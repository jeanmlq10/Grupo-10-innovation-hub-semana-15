import { ProjectTask, TaskProgress, TaskVisibility } from "../models/projectTask";

export type ForProjectOptions = {
  /** Lectura sin sesión (visitante): usa `public-read`. */
  publicAccess?: boolean;
  /**
   * El lector es el creador o un integrante del equipo: se completa el
   * contenido de las tareas "Solo equipo" desde la tabla privada.
   */
  teamAccess?: boolean;
};

/** Tareas especificas de un proyecto (tablas `project_tasks` y `project_task_private`). */
export interface ITaskRepository {
  /**
   * Todas las tareas del proyecto. Las "Solo equipo" vienen con
   * `hiddenContent = true` (sin título ni descripción) salvo con `teamAccess`.
   * Quien muestre tareas a terceros debe filtrar `isTeamOnly`.
   */
  forProject(projectId: string, opts?: ForProjectOptions): Promise<ProjectTask[]>;
  projectIdsWithOpenTasks(opts?: { publicAccess?: boolean }): Promise<Set<string>>;
  sync(projectId: string, tasks: ProjectTask[]): Promise<ProjectTask[]>;
  setProgress(task: ProjectTask, progress: TaskProgress): Promise<void>;
  setVisibility(projectId: string, task: ProjectTask, visibility: TaskVisibility): Promise<void>;
  deleteForProject(projectId: string): Promise<void>;
  addAccepted(task: ProjectTask): Promise<void>;
}
