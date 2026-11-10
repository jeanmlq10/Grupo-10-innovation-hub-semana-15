/** Tipos de registro del "Historial de actividad" (Página 5.2). */
export enum ActivityKind {
  publication = "publication",
  participation = "participation",
  taskAssignment = "taskAssignment",
  comment = "comment",
  follow = "follow",
}

/** Una acción del usuario y el proyecto relacionado. */
export class ActivityEntry {
  readonly kind: ActivityKind;
  readonly projectId: string;
  readonly projectName: string;
  readonly date: Date | null;
  readonly detail: string | null;

  constructor(p: { kind: ActivityKind; projectId: string; projectName: string; date?: Date | null; detail?: string | null }) {
    this.kind = p.kind;
    this.projectId = p.projectId;
    this.projectName = p.projectName;
    this.date = p.date ?? null;
    this.detail = p.detail ?? null;
  }
}
