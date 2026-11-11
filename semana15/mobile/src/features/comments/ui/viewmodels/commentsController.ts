import { StateError } from "@/src/core/roble/robleClient";
import { Controller } from "@/src/core/state/Controller";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { AppNotificationType } from "@/src/features/notifications/domain/models/appNotification";
import { INotificationRepository } from "@/src/features/notifications/domain/repositories/iNotificationRepository";
import { IProjectRepository } from "@/src/features/projects/domain/repositories/iProjectRepository";

import { CommentThread, ProjectComment } from "../../domain/models/projectComment";
import { ICommentRepository } from "../../domain/repositories/iCommentRepository";

/** ViewModel de los comentarios de un proyecto (con respuestas en hilo). */
export class CommentsController extends Controller {
  readonly comments: ICommentRepository;
  readonly projects: IProjectRepository;
  readonly notifications: INotificationRepository;
  readonly session: AuthenticationController;

  constructor(d: {
    comments: ICommentRepository;
    projects: IProjectRepository;
    notifications: INotificationRepository;
    session: AuthenticationController;
  }) {
    super();
    this.comments = d.comments;
    this.projects = d.projects;
    this.notifications = d.notifications;
    this.session = d.session;
  }

  get me(): string | null {
    return this.session.loggedUser?.userId ?? null;
  }

  commentsFor(projectId: string) {
    return this.comments.forProject(projectId);
  }

  async threadsFor(projectId: string): Promise<CommentThread[]> {
    if (this.session.loggedUser == null) throw new StateError("Inicia sesión para ver los comentarios del proyecto.");
    return CommentThread.build(await this.comments.forProject(projectId));
  }

  /**
   * Publica un comentario o, con [parent], una respuesta. Solo se puede
   * comentar en un proyecto que la persona puede ver (publicado, o propio).
   */
  async addComment({ projectId, text, parent }: { projectId: string; text: string; parent?: ProjectComment | null }) {
    const user = this.session.loggedUser;
    if (user == null) throw new StateError("Debes iniciar sesión para comentar.");
    const clean = text.trim();
    if (clean === "") return;
    const project = await this.projects.getById(projectId, { viewerId: user.userId });
    if (project == null) throw new StateError("No puedes comentar en este proyecto.");
    if (parent != null && parent.projectId !== projectId) throw new StateError("Ese comentario no es de este proyecto.");
    const name = user.name === "" ? user.email : user.name;
    await this.comments.add(
      new ProjectComment({
        id: "",
        projectId,
        authorName: name,
        authorUserId: user.userId,
        text: clean,
        createdAt: new Date(),
        parentId: parent?.id ?? null,
      }),
    );

    const projectName = project.name === "" ? "tu proyecto" : project.name;
    const notified = new Set<string>([user.userId]);
    // 1) A quien escribió el comentario respondido.
    const parentAuthor = parent?.authorUserId ?? null;
    if (parentAuthor != null && !notified.has(parentAuthor)) {
      notified.add(parentAuthor);
      await this.notifySafely({
        recipientUserId: parentAuthor,
        type: AppNotificationType.commentReply,
        title: "Respuesta a tu comentario",
        message: `${name} respondió tu comentario en ${project.name === "" ? "un proyecto" : project.name}.`,
        projectId: project.id,
        actorUserId: user.userId,
        actorName: name,
        detail: clean,
      });
    }
    // 2) Al creador del proyecto (una sola vez, aunque también sea el autor respondido).
    const owner = project.createdBy;
    if (owner != null && !notified.has(owner)) {
      notified.add(owner);
      await this.notifySafely({
        recipientUserId: owner,
        type: AppNotificationType.newComment,
        title: parent != null ? "Nueva respuesta en tu proyecto" : "Comentario en tu proyecto",
        message: parent != null ? `${name} respondió un comentario en ${projectName}.` : `${name} comentó en ${projectName}.`,
        projectId: project.id,
        actorUserId: user.userId,
        actorName: name,
        detail: clean,
      });
    }
  }

  private async notifySafely(args: Parameters<INotificationRepository["send"]>[0]) {
    try {
      await this.notifications.send(args);
    } catch {
      // el aviso es opcional: el comentario ya quedó guardado
    }
  }
}
