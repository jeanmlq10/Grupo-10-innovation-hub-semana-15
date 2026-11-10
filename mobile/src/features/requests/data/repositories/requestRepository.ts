import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleRows } from "@/src/core/roble/robleRows";
import { Row, robleOwnerOf } from "@/src/core/roble/sdk/robleOwnership";

import { ParticipationRequest, RequestStatus, RequestType } from "../../domain/models/participationRequest";
import { IRequestRepository } from "../../domain/repositories/iRequestRepository";
import { RequestFailure } from "../../domain/requestFailure";
import { IRequestDataSource } from "../datasources/iRequestDataSource";

const Y2000 = new Date(2000, 0, 1).getTime();

/** Solicitudes: convierte filas, calcula el estado a partir de las decisiones del dueno y traduce errores. */
export class RequestRepository implements IRequestRepository {
  constructor(private readonly source: IRequestDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new RequestFailure(m));
  }

  async submit(r: ParticipationRequest) {
    const now = RobleRows.nowIso();
    const row = await this.guard(() =>
      this.source.createRequest({
        projectId: r.projectId,
        type: r.type === RequestType.task ? "task" : "team",
        taskId: r.taskId,
        teamRoleId: r.teamRoleId,
        role: r.role,
        message: r.message,
        applicantUserId: r.applicantUserId,
        applicantName: r.applicantName,
        applicantEmail: r.applicantEmail,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      }),
    );
    return this.toRequest(row);
  }

  async forProject(projectId: string, { ownerId }: { ownerId: string }) {
    const rows = await this.guard(() => this.source.readRequests({ projectId }));
    return this.withStatus(
      rows.map((r) => this.toRequest(r)),
      ownerId,
    );
  }

  async forProjects(projectNames: Map<string, string>, { ownerId }: { ownerId: string }) {
    if (projectNames.size === 0) return [];
    const rows = await this.guard(() => this.source.readRequests());
    const requests = rows
      .map((r) => this.toRequest(r))
      .filter((r) => projectNames.has(r.projectId))
      .map((r) => r.copyWith({ projectName: projectNames.get(r.projectId) }));
    return this.withStatus(requests, ownerId);
  }

  async sentBy(userId: string) {
    const rows = await this.guard(() => this.source.readByApplicant(userId));
    return rows.map((r) => this.toRequest(r)).filter((r) => r.applicantUserId === userId);
  }

  async decide(requestId: string, status: RequestStatus) {
    await this.guard(() =>
      this.source.createDecision({
        requestId,
        status: status === RequestStatus.accepted ? "accepted" : "rejected",
        decidedAt: RobleRows.nowIso(),
      }),
    );
  }

  private async withStatus(requests: ParticipationRequest[], ownerId: string) {
    if (requests.length === 0) return requests;
    const ids = new Set(requests.map((r) => r.id));
    const rows = await this.guard(() => this.source.readDecisions());
    const latest = new Map<string, Row>();
    for (const row of rows) {
      const requestId = RobleRows.str(row.requestId);
      const author = robleOwnerOf(row);
      if (!ids.has(requestId)) continue;
      if (author != null && author !== ownerId) continue;
      const previous = latest.get(requestId);
      const when = RobleRows.date(row.decidedAt)?.getTime() ?? Y2000;
      const previousWhen = RobleRows.date(previous?.decidedAt)?.getTime() ?? Y2000;
      if (previous == null || when > previousWhen) latest.set(requestId, row);
    }
    return requests
      .map((r) => {
        const decision = latest.get(r.id);
        if (!decision) return r;
        return r.copyWith({
          status: RobleRows.str(decision.status) === "accepted" ? RequestStatus.accepted : RequestStatus.rejected,
          updatedAt: RobleRows.date(decision.decidedAt),
        });
      })
      .sort((a, b) => (b.createdAt?.getTime() ?? Y2000) - (a.createdAt?.getTime() ?? Y2000));
  }

  private toRequest(row: Row): ParticipationRequest {
    return new ParticipationRequest({
      id: RobleRows.str(row._id),
      projectId: RobleRows.str(row.projectId),
      role: RobleRows.str(row.role),
      message: RobleRows.str(row.message),
      type: RobleRows.str(row.type) === "task" ? RequestType.task : RequestType.team,
      taskId: RobleRows.strOrNull(row.taskId),
      teamRoleId: RobleRows.strOrNull(row.teamRoleId),
      applicantName: RobleRows.str(row.applicantName, "Usuario interesado"),
      applicantUserId: RobleRows.author(row, "applicantUserId"),
      applicantEmail: RobleRows.strOrNull(row.applicantEmail),
      createdAt: RobleRows.date(row.createdAt),
      updatedAt: RobleRows.date(row.updatedAt),
    });
  }
}
