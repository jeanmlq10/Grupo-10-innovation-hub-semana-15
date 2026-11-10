import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IMessageDataSource } from "./iMessageDataSource";

/** Habla con Roble sobre la tabla `direct_messages`. No decide nada. */
export class RobleMessageDataSource implements IMessageDataSource {
  private static readonly table = RobleClient.messages;

  constructor(private readonly client: RobleClient) {}

  readSentBy(userId: string) {
    return this.client.db.read(RobleMessageDataSource.table, { filters: { fromUserId: userId } });
  }
  readReceivedBy(userId: string) {
    return this.client.db.read(RobleMessageDataSource.table, { filters: { toUserId: userId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleMessageDataSource.table, row);
  }
  update(id: string, changes: Row) {
    return this.client.db.update(RobleMessageDataSource.table, id, changes);
  }
}
