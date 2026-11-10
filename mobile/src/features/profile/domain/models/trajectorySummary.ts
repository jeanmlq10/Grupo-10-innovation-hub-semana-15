/** Nivel de "Compromiso en la plataforma". */
export enum CommitmentLevel {
  newcomer = "newcomer",
  low = "low",
  medium = "medium",
  high = "high",
}

const clamp = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** "Resumen de trayectoria" (Página 5.1). */
export class TrajectorySummary {
  readonly projectsCreated: number;
  readonly projectsCompleted: number;
  readonly tasksAssigned: number;
  readonly tasksCompleted: number;
  readonly participations: number;
  readonly comments: number;
  readonly requestsSent: number;
  readonly requestsAccepted: number;
  /** Proyectos en curso (publicados o con participación, sin todas sus tareas completadas). */
  readonly activeProjects: number;
  /** Proyectos publicados por la persona. */
  readonly publications: number;

  constructor(p: {
    projectsCreated: number;
    projectsCompleted: number;
    tasksAssigned: number;
    tasksCompleted: number;
    participations: number;
    comments: number;
    requestsSent: number;
    requestsAccepted: number;
    activeProjects?: number;
    publications?: number;
  }) {
    this.projectsCreated = p.projectsCreated;
    this.projectsCompleted = p.projectsCompleted;
    this.tasksAssigned = p.tasksAssigned;
    this.tasksCompleted = p.tasksCompleted;
    this.participations = p.participations;
    this.comments = p.comments;
    this.requestsSent = p.requestsSent;
    this.requestsAccepted = p.requestsAccepted;
    this.activeProjects = p.activeProjects ?? 0;
    this.publications = p.publications ?? p.projectsCreated;
  }

  static readonly empty = new TrajectorySummary({
    projectsCreated: 0,
    projectsCompleted: 0,
    tasksAssigned: 0,
    tasksCompleted: 0,
    participations: 0,
    comments: 0,
    requestsSent: 0,
    requestsAccepted: 0,
  });

  get collaboration(): number {
    return clamp((this.participations * 2 + this.projectsCreated * 2 + this.comments) / 10);
  }

  get fulfillment(): number {
    return this.tasksAssigned === 0 ? 0 : clamp(this.tasksCompleted / this.tasksAssigned);
  }

  get quality(): number {
    return this.requestsSent === 0 ? 0 : clamp(this.requestsAccepted / this.requestsSent);
  }

  /**
   * Los mismos indicadores, pero `null` cuando todavía no hay datos para
   * calcularlos (la interfaz muestra "Sin información suficiente" en vez de
   * un 0 % que no significa nada).
   */
  get collaborationOrNull(): number | null {
    return this.hasActivity ? this.collaboration : null;
  }

  get fulfillmentOrNull(): number | null {
    return this.tasksAssigned === 0 ? null : this.fulfillment;
  }

  get qualityOrNull(): number | null {
    return this.requestsSent === 0 ? null : this.quality;
  }

  get hasActivity(): boolean {
    return this.projectsCreated + this.participations + this.comments + this.tasksAssigned + this.requestsSent > 0;
  }

  get commitment(): CommitmentLevel {
    if (!this.hasActivity) return CommitmentLevel.newcomer;
    const average = (this.collaboration + this.fulfillment + this.quality) / 3;
    if (average >= 0.6) return CommitmentLevel.high;
    if (average >= 0.3) return CommitmentLevel.medium;
    return CommitmentLevel.low;
  }
}
