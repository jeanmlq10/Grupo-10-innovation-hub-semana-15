import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IProfileDataSource } from "./iProfileDataSource";

/** Habla con Roble sobre la tabla `user_profiles`. No decide nada. */
export class RobleProfileDataSource implements IProfileDataSource {
  private static readonly table = RobleClient.profiles;

  constructor(private readonly client: RobleClient) {}

  readForUser(userId: string) {
    return this.client.db.read(RobleProfileDataSource.table, { filters: { userId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleProfileDataSource.table, row);
  }
  update(id: string, changes: Row) {
    return this.client.db.update(RobleProfileDataSource.table, id, changes);
  }
  async delete(id: string) {
    await this.client.db.delete(RobleProfileDataSource.table, id);
  }
}
