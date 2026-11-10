import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { INotificationDataSource } from "./iNotificationDataSource";

/** Habla con Roble sobre la tabla `app_notifications`. No decide nada. */
export class RobleNotificationDataSource implements INotificationDataSource {
  private static readonly table = RobleClient.notifications;

  constructor(private readonly client: RobleClient) {}

  readForRecipient(userId: string) {
    return this.client.db.read(RobleNotificationDataSource.table, { filters: { recipientUserId: userId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleNotificationDataSource.table, row);
  }
  update(id: string, changes: Row) {
    return this.client.db.update(RobleNotificationDataSource.table, id, changes);
  }
}
