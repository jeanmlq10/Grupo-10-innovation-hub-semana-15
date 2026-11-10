import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IRequestDataSource } from "./iRequestDataSource";

/** Habla con Roble sobre `project_requests` y `request_decisions`. No decide nada. */
export class RobleRequestDataSource implements IRequestDataSource {
  constructor(private readonly client: RobleClient) {}

  readRequests({ projectId }: { projectId?: string | null } = {}) {
    return this.client.db.read(RobleClient.requests, { filters: projectId == null ? undefined : { projectId } });
  }
  readByApplicant(userId: string) {
    return this.client.db.read(RobleClient.requests, { filters: { applicantUserId: userId } });
  }
  createRequest(row: Row) {
    return this.client.db.create(RobleClient.requests, row);
  }
  readDecisions() {
    return this.client.db.read(RobleClient.decisions);
  }
  createDecision(row: Row) {
    return this.client.db.create(RobleClient.decisions, row);
  }
}
