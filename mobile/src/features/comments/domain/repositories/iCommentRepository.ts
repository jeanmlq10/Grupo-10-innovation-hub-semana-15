import { ProjectComment } from "../models/projectComment";

/** Comentarios de un proyecto (tabla `project_comments`). */
export interface ICommentRepository {
  forProject(projectId: string): Promise<ProjectComment[]>;
  add(comment: ProjectComment): Promise<ProjectComment>;
  byAuthor(userId: string): Promise<ProjectComment[]>;
}
