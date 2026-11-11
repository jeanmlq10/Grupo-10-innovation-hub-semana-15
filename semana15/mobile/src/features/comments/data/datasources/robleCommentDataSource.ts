import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { ICommentDataSource } from "./iCommentDataSource";

/** Habla con Roble sobre la tabla `project_comments`. No decide nada. */
export class RobleCommentDataSource implements ICommentDataSource {
  private static readonly table = RobleClient.comments;

  constructor(private readonly client: RobleClient) {}

  readForProject(projectId: string) {
    return this.client.db.read(RobleCommentDataSource.table, { filters: { projectId } });
  }
  readByAuthor(userId: string) {
    return this.client.db.read(RobleCommentDataSource.table, { filters: { authorUserId: userId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleCommentDataSource.table, row);
  }
}
