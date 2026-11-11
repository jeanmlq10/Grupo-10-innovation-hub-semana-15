import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `project_members`. */
export interface IMemberDataSource {
  readForProject(projectId: string): Promise<Row[]>;
  readForUser(userId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
}
