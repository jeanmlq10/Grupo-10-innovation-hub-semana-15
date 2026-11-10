import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `project_comments`. */
export interface ICommentDataSource {
  readForProject(projectId: string): Promise<Row[]>;
  readByAuthor(userId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
}
