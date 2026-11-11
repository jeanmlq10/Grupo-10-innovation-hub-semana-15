import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleOptionalColumns } from "@/src/core/roble/robleOptionalColumns";
import { RobleRows } from "@/src/core/roble/robleRows";
import { RobleSchema } from "@/src/core/roble/robleSchema";
import { RobleApiNotFoundException } from "@/src/core/roble/sdk/robleExceptions";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { ProjectTask, TaskProgress, TaskVisibility } from "../../domain/models/projectTask";
import { ForProjectOptions, ITaskRepository } from "../../domain/repositories/iTaskRepository";
import { TaskFailure } from "../../domain/taskFailure";
import { ITaskDataSource } from "../datasources/iTaskDataSource";

const sameDay = (a: Date | null, b: Date | null) =>
  a == null || b == null ? a === b : a.getTime() === b.getTime();

const MISSING_PRIVATE_SETUP =
  'Para crear tareas "Solo equipo" falta configurar Roble: crea la tabla ' +
  "project_task_private y la columna visibility en project_tasks (ver ROBLE_CAMBIOS.md).";

/**
 * Tareas específicas: sincroniza, convierte filas y traduce errores.
 *
 * Visibilidad: la fila de `project_tasks` (tabla pública) de una tarea
 * "Solo equipo" se guarda con `visibility = "team"` y SIN título ni
 * descripción; ese contenido vive en `project_task_private` (tabla sin
 * lectura pública). Así un visitante o una consulta directa a `public-read`
 * nunca recibe el contenido interno del equipo.
 */
export class TaskRepository implements ITaskRepository {
  /** Columnas que pueden faltar en proyectos de Roble viejos. `visibility` NO es opcional para tareas de equipo. */
  private static readonly optionalColumns = new Set(["deadline", "status"]);
  private static readonly optionalColumnsPublicTask = new Set(["deadline", "status", "visibility"]);

  constructor(private readonly source: ITaskDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new TaskFailure(m), { notFound: "Esa tarea ya no existe." });
  }

  async forProject(projectId: string, { publicAccess = false, teamAccess = false }: ForProjectOptions = {}) {
    const rows = await this.guard(() =>
      publicAccess ? this.source.readForProjectPublic(projectId) : this.source.readForProject(projectId),
    );
    const privateByTask = new Map<string, Row>();
    const hasTeamRows = rows.some((r) => TaskRepository.visibilityFromRow(r.visibility) === TaskVisibility.team);
    if (teamAccess && !publicAccess && hasTeamRows) {
      try {
        for (const row of await this.source.readPrivateForProject(projectId)) {
          privateByTask.set(RobleRows.str(row.taskId), row);
        }
      } catch (e) {
        // Sin la tabla privada, las tareas de equipo se muestran sin contenido.
        if (!RobleSchema.isMissingTable(e)) {
          console.warn(`TaskRepository: no se pudo leer project_task_private: ${e}`);
        }
      }
    }
    return rows.map((r) => this.toTask(r, teamAccess ? privateByTask : null));
  }

  async projectIdsWithOpenTasks({ publicAccess = false }: { publicAccess?: boolean } = {}) {
    const rows = await this.guard(() => (publicAccess ? this.source.readAllPublic() : this.source.readAll()));
    return new Set(
      rows
        .map((r) => this.toTask(r, null))
        // Las tareas "Solo equipo" no cuentan como convocatoria abierta al público.
        .filter((task) => !task.isTeamOnly && task.canApplyAt())
        .map((task) => task.projectId),
    );
  }

  async sync(projectId: string, tasks: ProjectTask[]): Promise<ProjectTask[]> {
    const existing = new Map((await this.forProject(projectId, { teamAccess: true })).map((t) => [t.id, t]));
    const privateRows = await this.privateRowsByTask(projectId);
    for (const task of tasks) {
      const title = task.title.trim();
      if (!title) continue;
      let current: ProjectTask | null = null;
      if (task.id) {
        current = existing.get(task.id) ?? null;
        existing.delete(task.id);
      }
      if (current == null) {
        await this.createTask(projectId, task.copyWith({ title }));
      } else {
        await this.updateTask(projectId, current, task.copyWith({ title }), privateRows.get(current.id) ?? null);
      }
    }
    for (const leftover of existing.values()) {
      if (leftover.numberAccepted === 0) {
        await this.deleteTask(leftover.id, privateRows.get(leftover.id) ?? null);
      } else {
        await this.guard(() => this.source.update(leftover.id, { requiredCount: leftover.numberAccepted }));
      }
    }
    return this.forProject(projectId, { teamAccess: true });
  }

  async setVisibility(projectId: string, task: ProjectTask, visibility: TaskVisibility) {
    if (task.visibility === visibility) return;
    const privateRows = await this.privateRowsByTask(projectId);
    const current = (await this.forProject(projectId, { teamAccess: true })).find((t) => t.id === task.id);
    if (current == null) throw new TaskFailure("Esa tarea ya no existe.");
    await this.updateTask(projectId, current, current.copyWith({ visibility }), privateRows.get(current.id) ?? null);
  }

  async deleteForProject(projectId: string) {
    const privateRows = await this.privateRowsByTask(projectId);
    for (const task of await this.forProject(projectId)) {
      await this.deleteTask(task.id, privateRows.get(task.id) ?? null);
    }
  }

  async addAccepted(task: ProjectTask) {
    await this.guard(() => this.source.update(task.id, { acceptedCount: task.numberAccepted + 1 }));
  }

  async setProgress(task: ProjectTask, progress: TaskProgress) {
    await this.guard(() => this.source.update(task.id, { status: TaskRepository.progressToRow(progress) }));
  }

  // ── Escritura ─────────────────────────────────────────────

  private async createTask(projectId: string, task: ProjectTask) {
    const teamOnly = task.visibility === TaskVisibility.team;
    const base: Row = {
      projectId,
      title: teamOnly ? "" : task.title,
      description: teamOnly ? "" : task.description,
      requiredCount: task.numberNeeded,
      acceptedCount: 0,
      deadline: RobleRows.dayIso(task.deadline),
      status: TaskRepository.progressToRow(task.progress),
      visibility: task.visibility,
    };
    if (!teamOnly) {
      await this.guard(() =>
        RobleOptionalColumns.write(base, (r) => this.source.create(r), {
          optional: TaskRepository.optionalColumnsPublicTask,
        }),
      );
      return;
    }
    // "Solo equipo": primero la fila pública SIN contenido, luego el contenido privado.
    const created = await this.writeTeamRow(() =>
      RobleOptionalColumns.write(base, (r) => this.source.create(r), { optional: TaskRepository.optionalColumns }),
    );
    const taskId = RobleRows.str(created._id);
    try {
      await this.writeTeamRow(() =>
        this.source.createPrivate({ taskId, projectId, title: task.title, description: task.description }),
      );
    } catch (e) {
      // No dejar una tarea "fantasma" sin contenido.
      await this.source.delete(taskId).catch(() => {});
      throw e;
    }
  }

  private async updateTask(projectId: string, current: ProjectTask, next: ProjectTask, privateRow: Row | null) {
    const wasTeam = current.visibility === TaskVisibility.team;
    const isTeam = next.visibility === TaskVisibility.team;
    const changedFields =
      current.title !== next.title ||
      current.description !== next.description ||
      current.numberNeeded !== next.numberNeeded ||
      !sameDay(current.deadline, next.deadline);
    if (!changedFields && wasTeam === isTeam) return;

    const counts: Row = {
      requiredCount: next.numberNeeded,
      deadline: RobleRows.dayIso(next.deadline),
    };

    if (!isTeam) {
      // Pública (o pasa a pública): el contenido vuelve a la fila pública y se borra el privado.
      await this.guard(() =>
        RobleOptionalColumns.write(
          { ...counts, title: next.title, description: next.description, visibility: TaskVisibility.public },
          (r) => this.source.update(current.id, r),
          { optional: TaskRepository.optionalColumnsPublicTask },
        ),
      );
      if (privateRow != null) await this.deletePrivateRow(privateRow);
      return;
    }

    // "Solo equipo": el contenido se escribe primero en la tabla privada y
    // después se vacía la fila pública (nunca queda público ni un instante de más).
    const content = { title: next.title, description: next.description };
    if (privateRow == null) {
      await this.writeTeamRow(() => this.source.createPrivate({ taskId: current.id, projectId, ...content }));
    } else {
      await this.writeTeamRow(() => this.source.updatePrivate(RobleRows.str(privateRow._id), content));
    }
    await this.writeTeamRow(() =>
      RobleOptionalColumns.write(
        { ...counts, title: "", description: "", visibility: TaskVisibility.team },
        (r) => this.source.update(current.id, r),
        { optional: TaskRepository.optionalColumns },
      ),
    );
  }

  private async deleteTask(taskId: string, privateRow: Row | null) {
    await this.guard(async () => {
      try {
        await this.source.delete(taskId);
      } catch (e) {
        if (e instanceof RobleApiNotFoundException) return;
        throw e;
      }
    });
    if (privateRow != null) await this.deletePrivateRow(privateRow);
  }

  private async deletePrivateRow(row: Row) {
    try {
      await this.source.deletePrivate(RobleRows.str(row._id));
    } catch (e) {
      if (e instanceof RobleApiNotFoundException) return;
      throw new TaskFailure(e instanceof Error ? e.message : "No se pudo borrar el contenido privado de la tarea.");
    }
  }

  private async privateRowsByTask(projectId: string): Promise<Map<string, Row>> {
    const out = new Map<string, Row>();
    try {
      for (const row of await this.source.readPrivateForProject(projectId)) out.set(RobleRows.str(row.taskId), row);
    } catch {
      // Sin la tabla todavía: no hay tareas de equipo que limpiar.
    }
    return out;
  }

  /** Igual que `guard`, pero si falta la tabla o la columna explica qué configurar. */
  private async writeTeamRow<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (e) {
      if (RobleSchema.isMissingTable(e) || RobleSchema.isMissingColumn(e, "visibility") || RobleSchema.isMissingColumn(e)) {
        throw new TaskFailure(MISSING_PRIVATE_SETUP);
      }
      return this.guard(() => Promise.reject(e));
    }
  }

  // ── Conversión ────────────────────────────────────────────

  static progressToRow(progress: TaskProgress): string {
    switch (progress) {
      case TaskProgress.available:
        return "available";
      case TaskProgress.inProgress:
        return "in_progress";
      case TaskProgress.completed:
        return "completed";
    }
  }

  static progressFromRow(value: unknown): TaskProgress {
    switch (RobleRows.str(value)) {
      case "in_progress":
        return TaskProgress.inProgress;
      case "completed":
        return TaskProgress.completed;
      default:
        return TaskProgress.available;
    }
  }

  static visibilityFromRow(value: unknown): TaskVisibility {
    return RobleRows.str(value) === TaskVisibility.team ? TaskVisibility.team : TaskVisibility.public;
  }

  private toTask(row: Row, privateByTask: Map<string, Row> | null): ProjectTask {
    const needed = RobleRows.integer(row.requiredCount);
    const accepted = RobleRows.integer(row.acceptedCount);
    const id = RobleRows.str(row._id);
    const visibility = TaskRepository.visibilityFromRow(row.visibility);
    let title = RobleRows.str(row.title);
    let description = RobleRows.str(row.description);
    let hiddenContent = false;
    if (visibility === TaskVisibility.team) {
      const priv = privateByTask?.get(id);
      if (priv != null) {
        title = RobleRows.str(priv.title);
        description = RobleRows.str(priv.description);
      } else {
        title = "";
        description = "";
        hiddenContent = true;
      }
    }
    return new ProjectTask({
      id,
      projectId: RobleRows.str(row.projectId),
      title,
      description,
      numberNeeded: needed,
      numberAccepted: accepted,
      status: accepted >= needed ? "closed" : "open",
      deadline: RobleRows.day(row.deadline),
      progress: TaskRepository.progressFromRow(row.status),
      visibility,
      hiddenContent,
    });
  }
}
