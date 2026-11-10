/** Where a [ParticipationRequest] currently stands. */
export enum RequestStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}

/** "Postularme a una tarea" ([task]) or "Unirme al equipo" ([team]). */
export enum RequestType {
  task = "task",
  team = "team",
}

/**
 * A request a user submitted to participate in a project. Its status comes
 * from the owner's decision (table `request_decisions`).
 */
export class ParticipationRequest {
  readonly id: string;
  readonly projectId: string;
  readonly role: string;
  readonly message: string;
  readonly type: RequestType;
  readonly taskId: string | null;
  readonly teamRoleId: string | null;
  readonly projectOwnerId: string | null;
  readonly projectName: string | null;
  readonly applicantName: string;
  readonly applicantUserId: string | null;
  readonly applicantEmail: string | null;
  readonly status: RequestStatus;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;

  constructor(p: {
    id: string;
    projectId: string;
    role: string;
    message: string;
    type?: RequestType;
    taskId?: string | null;
    teamRoleId?: string | null;
    projectOwnerId?: string | null;
    projectName?: string | null;
    applicantName?: string;
    applicantUserId?: string | null;
    applicantEmail?: string | null;
    status?: RequestStatus;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }) {
    this.id = p.id;
    this.projectId = p.projectId;
    this.role = p.role;
    this.message = p.message;
    this.type = p.type ?? RequestType.team;
    this.taskId = p.taskId ?? null;
    this.teamRoleId = p.teamRoleId ?? null;
    this.projectOwnerId = p.projectOwnerId ?? null;
    this.projectName = p.projectName ?? null;
    this.applicantName = p.applicantName ?? "Usuario interesado";
    this.applicantUserId = p.applicantUserId ?? null;
    this.applicantEmail = p.applicantEmail ?? null;
    this.status = p.status ?? RequestStatus.pending;
    this.createdAt = p.createdAt ?? null;
    this.updatedAt = p.updatedAt ?? null;
  }

  copyWith(c: { status?: RequestStatus | null; updatedAt?: Date | null; projectName?: string | null }) {
    return new ParticipationRequest({
      id: this.id,
      projectId: this.projectId,
      role: this.role,
      message: this.message,
      type: this.type,
      taskId: this.taskId,
      teamRoleId: this.teamRoleId,
      projectOwnerId: this.projectOwnerId,
      projectName: c.projectName ?? this.projectName,
      applicantName: this.applicantName,
      applicantUserId: this.applicantUserId,
      applicantEmail: this.applicantEmail,
      status: c.status ?? this.status,
      createdAt: this.createdAt,
      updatedAt: c.updatedAt ?? this.updatedAt,
    });
  }
}
