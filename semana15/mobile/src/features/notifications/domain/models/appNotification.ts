import { AppNotificationType } from "./appNotificationType";
import { NotificationCategories, NotificationCategory } from "./notificationCategory";

export { AppNotificationType };

/** A notification, stored in Roble (`app_notifications`), addressed to [recipientUserId]. */
export class AppNotification {
  readonly id: string;
  readonly recipientUserId: string | null;
  readonly projectId: string;
  readonly requestId: string | null;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly read: boolean;
  readonly createdAt: Date;
  readonly actorUserId: string | null;
  readonly actorName: string | null;
  readonly detail: string | null;

  constructor(p: {
    id: string;
    projectId: string;
    title: string;
    message: string;
    createdAt: Date;
    type?: string;
    requestId?: string | null;
    recipientUserId?: string | null;
    read?: boolean;
    actorUserId?: string | null;
    actorName?: string | null;
    detail?: string | null;
  }) {
    this.id = p.id;
    this.recipientUserId = p.recipientUserId ?? null;
    this.projectId = p.projectId;
    this.requestId = p.requestId ?? null;
    this.type = p.type ?? AppNotificationType.newRequest;
    this.title = p.title;
    this.message = p.message;
    this.read = p.read ?? false;
    this.createdAt = p.createdAt;
    this.actorUserId = p.actorUserId ?? null;
    this.actorName = p.actorName ?? null;
    this.detail = p.detail ?? null;
  }

  get category(): NotificationCategory {
    return NotificationCategories.ofType(this.type);
  }

  get isResponse(): boolean {
    return AppNotificationType.responses.has(this.type);
  }

  get isAccepted(): boolean {
    return this.type === AppNotificationType.requestAccepted || this.type === AppNotificationType.taskApplicationAccepted;
  }

  get isAboutTask(): boolean {
    return (
      this.type === AppNotificationType.taskApplication ||
      this.type === AppNotificationType.taskApplicationAccepted ||
      this.type === AppNotificationType.taskApplicationRejected ||
      this.type === AppNotificationType.taskCompleted
    );
  }

  copyWith({ read }: { read?: boolean | null }): AppNotification {
    return new AppNotification({
      id: this.id,
      projectId: this.projectId,
      title: this.title,
      message: this.message,
      createdAt: this.createdAt,
      type: this.type,
      requestId: this.requestId,
      recipientUserId: this.recipientUserId,
      read: read ?? this.read,
      actorUserId: this.actorUserId,
      actorName: this.actorName,
      detail: this.detail,
    });
  }
}
