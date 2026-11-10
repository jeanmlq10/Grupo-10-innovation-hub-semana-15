import { StateError } from "@/src/core/roble/robleClient";
import { Controller } from "@/src/core/state/Controller";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { AppNotificationType } from "@/src/features/notifications/domain/models/appNotification";
import { INotificationRepository } from "@/src/features/notifications/domain/repositories/iNotificationRepository";
import { IProfileRepository } from "@/src/features/profile/domain/repositories/iProfileRepository";

import { Conversation } from "../../domain/models/conversation";
import { DirectMessage } from "../../domain/models/directMessage";
import { IMessageRepository } from "../../domain/repositories/iMessageRepository";

/** ViewModel de "Mensajes" (lista de conversaciones) y del chat. */
export class MessagesController extends Controller {
  readonly messages: IMessageRepository;
  readonly profiles: IProfileRepository;
  readonly notifications: INotificationRepository;
  readonly session: AuthenticationController;

  private readonly _conversations = this.obs<Conversation[]>([]);
  readonly isLoading = this.obs(false);
  readonly search = this.obs("");
  readonly loadError = this.obs("");

  constructor(d: {
    messages: IMessageRepository;
    profiles: IProfileRepository;
    notifications: INotificationRepository;
    session: AuthenticationController;
  }) {
    super();
    this.messages = d.messages;
    this.profiles = d.profiles;
    this.notifications = d.notifications;
    this.session = d.session;
  }

  get me(): string | null {
    return this.session.loggedUser?.userId ?? null;
  }

  get conversations(): Conversation[] {
    const query = this.search.value.trim().toLowerCase();
    if (query === "") return this._conversations.value;
    return this._conversations.value.filter(
      (c) => c.otherName.toLowerCase().includes(query) || c.lastMessage.text.toLowerCase().includes(query),
    );
  }

  async loadConversations() {
    const userId = this.me;
    if (userId == null) return;
    this.isLoading.value = true;
    this.loadError.value = "";
    try {
      this._conversations.value = Conversation.group(userId, await this.messages.allOf(userId));
    } catch (error) {
      console.error(`MessagesController: could not load: ${error}`);
      this.loadError.value = errorMessage(error, { fallback: "No se pudieron cargar tus mensajes." });
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * La conversación privada entre la persona y [otherUserId]. Solo trae los
   * mensajes enviados o recibidos por la persona (nunca conversaciones
   * ajenas) y marca como leídos los que le llegaron, solo si hay alguno sin leer.
   */
  async thread(otherUserId: string): Promise<DirectMessage[]> {
    const userId = this.me;
    if (userId == null) return [];
    const list = await this.messages.thread(userId, otherUserId);
    if (list.some((m) => m.toUserId === userId && !m.read)) {
      try {
        await this.messages.markThreadRead(userId, otherUserId);
      } catch {
        // igual que en Flutter
      }
    }
    return list;
  }

  async canWriteTo(otherUserId: string): Promise<boolean> {
    if (otherUserId === "" || otherUserId === this.me) return false;
    const profile = await this.profiles.byUserId(otherUserId).catch(() => null);
    return profile?.acceptsMessages ?? true;
  }

  async send({ toUserId, toName, text }: { toUserId: string; toName: string; text: string }) {
    const user = this.session.loggedUser;
    if (user == null) throw new StateError("Debes iniciar sesión para escribir.");
    const clean = text.trim();
    if (clean === "") return;
    if (toUserId === user.userId) throw new StateError("No puedes enviarte mensajes a ti mismo.");
    if (!(await this.canWriteTo(toUserId))) throw new StateError("Esta persona no recibe mensajes.");
    const myName = user.name === "" ? user.email : user.name;
    await this.messages.send(
      new DirectMessage({
        id: "",
        fromUserId: user.userId,
        fromName: myName,
        toUserId,
        toName,
        text: clean,
        createdAt: new Date(),
      }),
    );
    try {
      await this.notifications.send({
        recipientUserId: toUserId,
        type: AppNotificationType.newMessage,
        title: "Nuevo mensaje",
        message: `${myName} te envió un mensaje.`,
        projectId: "",
        actorUserId: user.userId,
        actorName: myName,
        detail: clean,
      });
    } catch {
      // el aviso es opcional
    }
  }
}
