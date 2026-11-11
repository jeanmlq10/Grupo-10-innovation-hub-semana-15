import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IProjectDataSource } from "./iProjectDataSource";

/** Habla con Roble sobre la tabla `projects`. No decide nada. */
export class RobleProjectDataSource implements IProjectDataSource {
  private static readonly table = RobleClient.projects;

  constructor(private readonly client: RobleClient) {}

  readAll() {
    return this.client.db.read(RobleProjectDataSource.table);
  }
  readAllPublic() {
    return this.client.db.publicRead(RobleProjectDataSource.table);
  }
  readById(id: string) {
    return this.client.db.getById(RobleProjectDataSource.table, id);
  }
  create(row: Row) {
    return this.client.db.create(RobleProjectDataSource.table, row);
  }
  async delete(id: string) {
    await this.client.db.delete(RobleProjectDataSource.table, id);
  }
  update(id: string, changes: Row) {
    return this.client.db.update(RobleProjectDataSource.table, id, changes);
  }
}
