import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { ITaskDataSource } from "./iTaskDataSource";

/**
 * Habla con Roble sobre `project_tasks` y `project_task_private`. No decide nada.
 * `project_task_private` NO es pública: nunca se lee con `publicRead`.
 */
export class RobleTaskDataSource implements ITaskDataSource {
  private static readonly table = RobleClient.tasks;
  private static readonly privateTable = RobleClient.taskPrivate;

  constructor(private readonly client: RobleClient) {}

  readForProject(projectId: string) {
    return this.client.db.read(RobleTaskDataSource.table, { filters: { projectId } });
  }
  readForProjectPublic(projectId: string) {
    return this.client.db.publicRead(RobleTaskDataSource.table, { filters: { projectId } });
  }
  readAll() {
    return this.client.db.read(RobleTaskDataSource.table);
  }
  readAllPublic() {
    return this.client.db.publicRead(RobleTaskDataSource.table);
  }
  create(row: Row) {
    return this.client.db.create(RobleTaskDataSource.table, row);
  }
  update(id: string, changes: Row) {
    return this.client.db.update(RobleTaskDataSource.table, id, changes);
  }
  async delete(id: string) {
    await this.client.db.delete(RobleTaskDataSource.table, id);
  }

  readPrivateForProject(projectId: string) {
    return this.client.db.read(RobleTaskDataSource.privateTable, { filters: { projectId } });
  }
  createPrivate(row: Row) {
    return this.client.db.create(RobleTaskDataSource.privateTable, row);
  }
  updatePrivate(id: string, changes: Row) {
    return this.client.db.update(RobleTaskDataSource.privateTable, id, changes);
  }
  async deletePrivate(id: string) {
    await this.client.db.delete(RobleTaskDataSource.privateTable, id);
  }
}
