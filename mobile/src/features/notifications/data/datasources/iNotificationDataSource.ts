import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `app_notifications`. */
export interface INotificationDataSource {
  readForRecipient(userId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  update(id: string, changes: Row): Promise<Row>;
}
