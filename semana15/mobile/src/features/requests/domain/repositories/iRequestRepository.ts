import { ParticipationRequest, RequestStatus } from "../models/participationRequest";

/** Solicitudes para participar (tablas `project_requests` y `request_decisions`). */
export interface IRequestRepository {
  submit(request: ParticipationRequest): Promise<ParticipationRequest>;
  forProject(projectId: string, opts: { ownerId: string }): Promise<ParticipationRequest[]>;
  forProjects(projectNames: Map<string, string>, opts: { ownerId: string }): Promise<ParticipationRequest[]>;
  decide(requestId: string, status: RequestStatus): Promise<void>;
  sentBy(userId: string): Promise<ParticipationRequest[]>;
}
