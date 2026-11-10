import { Controller } from "@/src/core/state/Controller";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { IProfileRepository } from "@/src/features/profile/domain/repositories/iProfileRepository";
import { Project } from "@/src/features/projects/domain/models/project";
import { IProjectRepository } from "@/src/features/projects/domain/repositories/iProjectRepository";

import { AppNotification } from "../../domain/models/appNotification";
import { NotificationCategory } from "../../domain/models/notificationCategory";
import { NotificationPreferences } from "../../domain/models/notificationPreference";
import { INotificationRepository } from "../../domain/repositories/iNotificationRepository";

/**
 * Filtros rápidos de la barra de filtros (Corrección 6.3). Cada uno agrupa
 * una o varias categorías reales de `NotificationCategory`.
 */
export enum QuickFilter {
  users = "users",
  messages = "messages",
  reminders = "reminders",
  tasks = "tasks",
  completed = "completed",
}

export const QUICK_FILTERS: QuickFilter[] = [
  QuickFilter.users,
  QuickFilter.messages,
  QuickFilter.reminders,
  QuickFilter.tasks,
  QuickFilter.completed,
];

export const QUICK_FILTER_CATEGORIES: Record<QuickFilter, NotificationCategory[]> = {
  [QuickFilter.users]: [NotificationCategory.participationRequests],
  [QuickFilter.messages]: [NotificationCategory.messages, NotificationCategory.comments, NotificationCategory.mentions],
  [QuickFilter.reminders]: [NotificationCategory.reminders],
  [QuickFilter.tasks]: [NotificationCategory.taskApplications],
  [QuickFilter.completed]: [NotificationCategory.completedTasks],
};

/** Clave para detectar avisos repetidos (mismo evento enviado dos veces). */
function duplicateKey(n: AppNotification): string {
  const minute = Math.floor(n.createdAt.getTime() / 60000);
  return [n.type, n.projectId, n.requestId ?? "", n.actorUserId ?? "", n.detail ?? n.message, minute].join("|");
}

/** Quita duplicados por id y por evento repetido (conserva el más reciente). */
export function dedupeNotifications(list: AppNotification[]): AppNotification[] {
  const ids = new Set<string>();
  const keys = new Map<string, AppNotification>();
  const out: AppNotification[] = [];
  for (const n of list) {
    if (ids.has(n.id)) continue;
    ids.add(n.id);
    const key = duplicateKey(n);
    const previous = keys.get(key);
    if (previous) {
      // Si uno de los dos ya se leyó, el evento cuenta como leído.
      if (n.read && !previous.read) {
        const updated = previous.copyWith({ read: true });
        out[out.indexOf(previous)] = updated;
        keys.set(key, updated);
      }
      continue;
    }
    keys.set(key, n);
    out.push(n);
  }
  return out;
}

/** ViewModel de "Notificaciones" (Página 4). */
export class NotificationsController extends Controller {
  readonly notifications: INotificationRepository;
  readonly projects: IProjectRepository;
  readonly profiles: IProfileRepository;
  readonly session: AuthenticationController;

  private readonly all = this.obs<AppNotification[]>([]);
  readonly isLoading = this.obs(false);
  readonly loadError = this.obs("");
  readonly search = this.obs("");
  readonly unreadOnly = this.obs(false);
  readonly filters = this.obs<Set<NotificationCategory>>(new Set());
  private readonly muted = this.obs<Set<NotificationCategory>>(new Set());
  /** Duplicados ocultos: se marcan como leídos junto con el que se muestra. */
  private duplicatesOf = new Map<string, string[]>();
  private lastLoadedAt = 0;
  private loadedFor: string | null = null;

  constructor(d: {
    notifications: INotificationRepository;
    projects: IProjectRepository;
    profiles: IProfileRepository;
    session: AuthenticationController;
  }) {
    super();
    this.notifications = d.notifications;
    this.projects = d.projects;
    this.profiles = d.profiles;
    this.session = d.session;
  }

  get visible(): AppNotification[] {
    return this.visibleIgnoringReadState.filter((n) => !(this.unreadOnly.value && n.read));
  }

  /** Búsqueda + filtros + silenciadas, sin aplicar "No leídas" (para los contadores de las pestañas). */
  get visibleIgnoringReadState(): AppNotification[] {
    const query = this.search.value.trim().toLowerCase();
    const filters = this.filters.value;
    return this.all.value.filter((n) => {
      if (this.muted.value.has(n.category)) return false;
      if (filters.size > 0 && !filters.has(n.category)) return false;
      if (query === "") return true;
      return (
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        (n.actorName ?? "").toLowerCase().includes(query)
      );
    });
  }

  get unreadCount(): number {
    return this.all.value.filter((n) => !n.read && !this.muted.value.has(n.category)).length;
  }

  async load() {
    const userId = this.session.loggedUser?.userId;
    if (userId == null) return;
    this.isLoading.value = true;
    this.loadError.value = "";
    try {
      const list = await this.notifications.forUser(userId);
      const profile = await this.profiles.byUserId(userId).catch(() => null);
      this.setList(list);
      this.lastLoadedAt = Date.now();
      this.loadedFor = userId;
      this.muted.value =
        profile == null
          ? new Set()
          : NotificationPreferences.mutedCategories({
              allEnabled: profile.notificationsEnabled,
              mutedKeys: new Set(profile.mutedNotifications),
            });
    } catch (error) {
      console.error(`NotificationsController: could not load: ${error}`);
      this.loadError.value = errorMessage(error, { fallback: "No se pudieron cargar tus notificaciones." });
    } finally {
      this.isLoading.value = false;
    }
  }

  private setList(list: AppNotification[]) {
    const unique = dedupeNotifications(list);
    const kept = new Set(unique.map((n) => n.id));
    const byKey = new Map(unique.map((n) => [duplicateKey(n), n.id]));
    this.duplicatesOf = new Map();
    for (const n of list) {
      if (kept.has(n.id)) continue;
      const keeper = byKey.get(duplicateKey(n));
      if (keeper && !n.read) this.duplicatesOf.set(keeper, [...(this.duplicatesOf.get(keeper) ?? []), n.id]);
    }
    this.all.value = unique;
  }

  /**
   * Para el indicador de la barra inferior: recarga en silencio (sin
   * spinner) si los datos tienen más de [maxAgeMs] o son de otra sesión.
   */
  async refreshIfStale(maxAgeMs = 30000) {
    const userId = this.session.loggedUser?.userId;
    if (userId == null) {
      if (this.all.value.length > 0) this.all.value = [];
      this.loadedFor = null;
      return;
    }
    if (this.isLoading.value) return;
    if (this.loadedFor === userId && Date.now() - this.lastLoadedAt < maxAgeMs) return;
    try {
      const list = await this.notifications.forUser(userId);
      this.setList(list);
      this.lastLoadedAt = Date.now();
      this.loadedFor = userId;
    } catch {
      // el indicador simplemente no cambia
    }
  }

  /** ¿Hay notificaciones sin leer? (respeta las categorías silenciadas). */
  get hasUnread(): boolean {
    const userId = this.session.loggedUser?.userId;
    return userId != null && this.loadedFor === userId && this.unreadCount > 0;
  }

  isQuickFilterOn(filter: QuickFilter): boolean {
    return QUICK_FILTER_CATEGORIES[filter].every((c) => this.filters.value.has(c));
  }

  toggleQuickFilter(filter: QuickFilter, on: boolean) {
    const next = new Set(this.filters.value);
    for (const c of QUICK_FILTER_CATEGORIES[filter]) {
      if (on) next.add(c);
      else next.delete(c);
    }
    this.filters.value = next;
  }

  async markAllRead(): Promise<number> {
    const pending = this.all.value.filter((n) => !n.read);
    if (pending.length === 0) return 0;
    this.all.value = this.all.value.map((n) => (n.read ? n : n.copyWith({ read: true })));
    let failed = 0;
    for (const n of pending) {
      for (const id of [n.id, ...(this.duplicatesOf.get(n.id) ?? [])]) {
        try {
          await this.notifications.markRead(id);
        } catch {
          failed++;
        }
      }
    }
    return pending.length - Math.min(failed, pending.length);
  }

  showAll() {
    this.unreadOnly.value = false;
  }

  showUnread() {
    this.unreadOnly.value = true;
  }

  applyFilters(categories: Set<NotificationCategory>) {
    this.filters.value = new Set(categories);
  }

  removeFilter(category: NotificationCategory) {
    const next = new Set(this.filters.value);
    next.delete(category);
    this.filters.value = next;
  }

  clearFilters() {
    this.filters.value = new Set();
  }

  async markRead(notification: AppNotification) {
    if (notification.read) return;
    const index = this.all.value.findIndex((n) => n.id === notification.id);
    if (index >= 0) {
      const next = [...this.all.value];
      next[index] = notification.copyWith({ read: true });
      this.all.value = next;
    }
    for (const id of [notification.id, ...(this.duplicatesOf.get(notification.id) ?? [])]) {
      try {
        await this.notifications.markRead(id);
      } catch {
        // igual que en Flutter: si falla, la notificación se abre igual
      }
    }
  }

  projectById(id: string): Promise<Project | null> {
    return id === "" ? Promise.resolve(null) : this.projects.getById(id, { viewerId: this.session.loggedUser?.userId });
  }
}
