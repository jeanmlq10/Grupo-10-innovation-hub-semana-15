/** Que [userId] sigue el proyecto [projectId] (tabla `project_follows`). */
export class ProjectFollow {
  readonly projectId: string;
  readonly userId: string;
  readonly createdAt: Date | null;

  constructor(p: { projectId: string; userId: string; createdAt?: Date | null }) {
    this.projectId = p.projectId;
    this.userId = p.userId;
    this.createdAt = p.createdAt ?? null;
  }
}
