/** Whether someone joined through a specific task or as a team member. */
export enum MemberSourceType {
  task = "task",
  team = "team",
}

/** A real member of a project (tabla `project_members`). */
export class ProjectMember {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly name: string;
  readonly email: string | null;
  readonly role: string;
  readonly sourceType: MemberSourceType;
  readonly sourceId: string | null;
  readonly requestId: string | null;
  readonly joinedAt: Date | null;
  readonly recordedBy: string | null;

  constructor(p: {
    id: string;
    projectId: string;
    userId: string;
    name: string;
    role: string;
    sourceType: MemberSourceType;
    email?: string | null;
    sourceId?: string | null;
    requestId?: string | null;
    joinedAt?: Date | null;
    recordedBy?: string | null;
  }) {
    this.id = p.id;
    this.projectId = p.projectId;
    this.userId = p.userId;
    this.name = p.name;
    this.email = p.email ?? null;
    this.role = p.role;
    this.sourceType = p.sourceType;
    this.sourceId = p.sourceId ?? null;
    this.requestId = p.requestId ?? null;
    this.joinedAt = p.joinedAt ?? null;
    this.recordedBy = p.recordedBy ?? null;
  }
}
