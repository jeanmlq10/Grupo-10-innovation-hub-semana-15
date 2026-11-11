import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IFollowDataSource } from "./iFollowDataSource";

/** Habla con Roble sobre la tabla `project_follows`. No decide nada. */
export class RobleFollowDataSource implements IFollowDataSource {
  private static readonly table = RobleClient.follows;

  constructor(private readonly client: RobleClient) {}

  readForUser(userId: string) {
    return this.client.db.read(RobleFollowDataSource.table, { filters: { userId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleFollowDataSource.table, row);
  }
  async delete(id: string) {
    await this.client.db.delete(RobleFollowDataSource.table, id);
  }
}
