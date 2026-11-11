import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `project_follows`. */
export interface IFollowDataSource {
  readForUser(userId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  delete(id: string): Promise<void>;
}
