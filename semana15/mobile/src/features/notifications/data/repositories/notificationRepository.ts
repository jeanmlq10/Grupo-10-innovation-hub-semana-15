import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleOptionalColumns } from "@/src/core/roble/robleOptionalColumns";
import { RobleRows } from "@/src/core/roble/robleRows";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { AppNotification, AppNotificationType } from "../../domain/models/appNotification";
import { NotificationFailure } from "../../domain/notificationFailure";
import { INotificationRepository, SendNotificationArgs } from "../../domain/repositories/iNotificationRepository";
import { INotificationDataSource } from "../datasources/iNotificationDataSource";

/** Notificaciones: convierte filas y traduce errores. */
export class NotificationRepository implements INotificationRepository {
  private static readonly optionalColumns = new Set(["actorUserId", "actorName", "detail"]);

  constructor(private readonly source: INotificationDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new NotificationFailure(m));
  }

  async forUser(userId: string) {
    const rows = await this.guard(() => this.source.readForRecipient(userId));
    return rows.map((r) => this.toNotification(r)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async send(a: SendNotificationArgs) {
    await this.guard(() =>
      RobleOptionalColumns.write(
        {
          recipientUserId: a.recipientUserId,
          projectId: a.projectId,
          requestId: a.requestId ?? null,
          type: a.type,
          title: a.title,
          message: a.message,
          read: false,
          createdAt: RobleRows.nowIso(),
          actorUserId: a.actorUserId ?? null,
          actorName: a.actorName ?? null,
          detail: a.detail ?? null,
        },
        (r) => this.source.create(r),
        { optional: NotificationRepository.optionalColumns },
      ),
    );
  }

  async markRead(id: string) {
    await this.guard(() => this.source.update(id, { read: true }));
  }

  private toNotification(row: Row): AppNotification {
    return new AppNotification({
      id: RobleRows.str(row._id),
      recipientUserId: RobleRows.strOrNull(row.recipientUserId),
      projectId: RobleRows.str(row.projectId),
      requestId: RobleRows.strOrNull(row.requestId),
      type: RobleRows.str(row.type, AppNotificationType.newRequest),
      title: RobleRows.str(row.title),
      message: RobleRows.str(row.message),
      read: RobleRows.boolean(row.read),
      createdAt: RobleRows.date(row.createdAt) ?? new Date(),
      actorUserId: RobleRows.strOrNull(row.actorUserId),
      actorName: RobleRows.strOrNull(row.actorName),
      detail: RobleRows.strOrNull(row.detail),
    });
  }
}
