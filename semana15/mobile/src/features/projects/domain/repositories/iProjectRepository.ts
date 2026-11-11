import { Project } from "../models/project";
import { ProjectTeamRole } from "../models/projectTeamRole";

/** Proyectos (tabla `projects`). */
export interface IProjectRepository {
  create(project: Project): Promise<Project>;
  save(project: Project): Promise<Project>;
  getById(id: string, opts?: { viewerId?: string | null; publicAccess?: boolean }): Promise<Project | null>;
  explorable(opts?: { publicAccess?: boolean }): Promise<Project[]>;
  ownedBy(userId: string): Promise<Project[]>;
  /** Borrado físico: solo para borradores (no tienen registros de otras personas). */
  delete(id: string): Promise<void>;
  /** Eliminación lógica para proyectos publicados (ver ProjectRepository.softDelete). */
  softDelete(project: Project): Promise<void>;
  rolesOf(project: Project): ProjectTeamRole[];
}
