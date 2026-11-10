import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Filas de `project_requests` y `request_decisions`. */
export interface IRequestDataSource {
  readRequests(opts?: { projectId?: string | null }): Promise<Row[]>;
  readByApplicant(userId: string): Promise<Row[]>;
  createRequest(row: Row): Promise<Row>;
  readDecisions(): Promise<Row[]>;
  createDecision(row: Row): Promise<Row>;
}
