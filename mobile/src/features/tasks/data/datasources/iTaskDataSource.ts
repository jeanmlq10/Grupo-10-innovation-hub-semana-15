import { Row } from "@/src/core/roble/sdk/robleOwnership";

/**
 * Filas de `project_tasks` (pública) y de `project_task_private` (privada:
 * título y descripción de las tareas "Solo equipo").
 */
export interface ITaskDataSource {
  readForProject(projectId: string): Promise<Row[]>;
  readForProjectPublic(projectId: string): Promise<Row[]>;
  readAll(): Promise<Row[]>;
  readAllPublic(): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  update(id: string, changes: Row): Promise<Row>;
  delete(id: string): Promise<void>;

  /** Contenido privado de las tareas "Solo equipo" de un proyecto. Requiere sesión. */
  readPrivateForProject(projectId: string): Promise<Row[]>;
  createPrivate(row: Row): Promise<Row>;
  updatePrivate(id: string, changes: Row): Promise<Row>;
  deletePrivate(id: string): Promise<void>;
}
