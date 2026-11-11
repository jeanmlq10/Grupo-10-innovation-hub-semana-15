import { ProjectMember } from "../models/projectMember";

/** Miembros reales de un proyecto (tabla `project_members`). */
export interface IMemberRepository {
  forProject(projectId: string, opts: { ownerId: string }): Promise<ProjectMember[]>;
  add(member: ProjectMember): Promise<ProjectMember>;
  forUser(userId: string): Promise<ProjectMember[]>;
}
