import { isBeforeDeadline } from "@/src/core/utils/deadline";

/** En qué va el trabajo de una tarea (columna `status` de `project_tasks`). */
export enum TaskProgress {
  available = "available",
  inProgress = "inProgress",
  completed = "completed",
}

/**
 * Quién puede ver una tarea temporal (columna `visibility` de `project_tasks`).
 * - `public`: cualquiera que consulte el proyecto.
 * - `team`: solo el creador y los integrantes del equipo. El título y la
 *   descripción NO viven en `project_tasks` (que es pública) sino en la tabla
 *   privada `project_task_private`.
 */
export enum TaskVisibility {
  public = "public",
  team = "team",
}

/** Lo que se le muestra a la gente en la tarjeta de la tarea. */
export enum TaskDisplayStatus {
  available = "available",
  inProgress = "inProgress",
  completed = "completed",
  closed = "closed",
}

/**
 * A concrete task a project needs help with ("Diseñar la interfaz",
 * "Hacer pruebas"...). Different from a ProjectTeamRole.
 */
export class ProjectTask {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly description: string;
  readonly numberNeeded: number;
  readonly numberAccepted: number;
  readonly status: string;
  readonly createdAt: Date | null;
  readonly deadline: Date | null;
  readonly progress: TaskProgress;
  readonly visibility: TaskVisibility;
  /**
   * `true` cuando la tarea es "Solo equipo" y quien la lee no tiene acceso al
   * contenido: el título y la descripción vienen vacíos.
   */
  readonly hiddenContent: boolean;

  constructor(p: {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    numberNeeded?: number;
    numberAccepted?: number;
    status?: string;
    createdAt?: Date | null;
    deadline?: Date | null;
    progress?: TaskProgress;
    visibility?: TaskVisibility;
    hiddenContent?: boolean;
  }) {
    this.id = p.id;
    this.projectId = p.projectId;
    this.title = p.title;
    this.description = p.description ?? "";
    this.numberNeeded = p.numberNeeded ?? 1;
    this.numberAccepted = p.numberAccepted ?? 0;
    this.status = p.status ?? "open";
    this.createdAt = p.createdAt ?? null;
    this.deadline = p.deadline ?? null;
    this.progress = p.progress ?? TaskProgress.available;
    this.visibility = p.visibility ?? TaskVisibility.public;
    this.hiddenContent = p.hiddenContent ?? false;
  }

  get isTeamOnly(): boolean {
    return this.visibility === TaskVisibility.team;
  }

  get hasSpots(): boolean {
    return this.numberAccepted < this.numberNeeded;
  }

  canApplyAt(now?: Date): boolean {
    return this.progress === TaskProgress.available && this.hasSpots && isBeforeDeadline(this.deadline, now);
  }

  displayStatusAt(now?: Date): TaskDisplayStatus {
    if (this.progress === TaskProgress.completed) return TaskDisplayStatus.completed;
    if (this.progress === TaskProgress.inProgress || !this.hasSpots) return TaskDisplayStatus.inProgress;
    if (!isBeforeDeadline(this.deadline, now)) return TaskDisplayStatus.closed;
    return TaskDisplayStatus.available;
  }

  /** Igual que en Dart: `null`/ausente conserva el valor actual. */
  copyWith(c: {
    id?: string | null;
    projectId?: string | null;
    title?: string | null;
    description?: string | null;
    numberNeeded?: number | null;
    numberAccepted?: number | null;
    status?: string | null;
    deadline?: Date | null;
    progress?: TaskProgress | null;
    visibility?: TaskVisibility | null;
  }): ProjectTask {
    return new ProjectTask({
      id: c.id ?? this.id,
      projectId: c.projectId ?? this.projectId,
      title: c.title ?? this.title,
      description: c.description ?? this.description,
      numberNeeded: c.numberNeeded ?? this.numberNeeded,
      numberAccepted: c.numberAccepted ?? this.numberAccepted,
      status: c.status ?? this.status,
      createdAt: this.createdAt,
      deadline: c.deadline ?? this.deadline,
      progress: c.progress ?? this.progress,
      visibility: c.visibility ?? this.visibility,
      hiddenContent: this.hiddenContent,
    });
  }
}
