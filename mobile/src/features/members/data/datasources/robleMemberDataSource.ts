import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IMemberDataSource } from "./iMemberDataSource";

/** Habla con Roble sobre la tabla `project_members`. No decide nada. */
export class RobleMemberDataSource implements IMemberDataSource {
  private static readonly table = RobleClient.members;

  constructor(private readonly client: RobleClient) {}

  readForProject(projectId: string) {
    return this.client.db.read(RobleMemberDataSource.table, { filters: { projectId } });
  }
  readForUser(userId: string) {
    return this.client.db.read(RobleMemberDataSource.table, { filters: { userId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleMemberDataSource.table, row);
  }
}
