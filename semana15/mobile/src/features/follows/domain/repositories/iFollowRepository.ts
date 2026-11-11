import { ProjectFollow } from "../models/projectFollow";

/** Seguimientos de proyectos (tabla `project_follows`). */
export interface IFollowRepository {
  followsOf(userId: string): Promise<ProjectFollow[]>;
  followedProjectIds(userId: string): Promise<Set<string>>;
  isFollowing(projectId: string, userId: string): Promise<boolean>;
  toggle(projectId: string, userId: string): Promise<boolean>;
}
