import { isBeforeDeadline } from "@/src/core/utils/deadline";

/** A project shown in "Explorar proyectos". */
export class Project {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly categories: string[];
  readonly canApply: boolean;
  readonly teamRoles: Record<string, number>;
  readonly duration: string | null;
  readonly audience: string | null;
  readonly isDraft: boolean;
  readonly acceptedMembersCount: number;
  readonly acceptedRoleCounts: Record<string, number>;
  readonly createdBy: string | null;
  readonly createdByName: string | null;
  readonly createdAt: Date | null;
  readonly updatedAt: Date | null;
  readonly teamDeadline: Date | null;
  /**
   * Imagen de perfil del proyecto: id del archivo en el bucket (columna
   * `imageFileId`). La URL firmada se pide al mostrarla (caduca en minutos).
   */
  readonly imageFileId: string | null;
  /** Compatibilidad: URL directa (columna opcional `imageUrl`), si existiera. */
  readonly imageUrl: string | null;
  /** Objetivos del proyecto (columna `objectives`, lista JSON). */
  readonly objectives: string[];
  /** Etapa de desarrollo en texto libre (columna `stage`). */
  readonly stage: string | null;
  /** Eliminación lógica (columna `deletedAt`): un proyecto con fecha está eliminado. */
  readonly deletedAt: Date | null;

  constructor(p: {
    id: string;
    name: string;
    description: string;
    categories: string[];
    canApply?: boolean;
    teamRoles?: Record<string, number>;
    duration?: string | null;
    audience?: string | null;
    isDraft?: boolean;
    acceptedMembersCount?: number;
    acceptedRoleCounts?: Record<string, number>;
    createdBy?: string | null;
    createdByName?: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    teamDeadline?: Date | null;
    imageUrl?: string | null;
    imageFileId?: string | null;
    objectives?: string[];
    stage?: string | null;
    deletedAt?: Date | null;
  }) {
    this.id = p.id;
    this.name = p.name;
    this.description = p.description;
    this.categories = p.categories;
    this.canApply = p.canApply ?? false;
    this.teamRoles = p.teamRoles ?? {};
    this.duration = p.duration ?? null;
    this.audience = p.audience ?? null;
    this.isDraft = p.isDraft ?? false;
    this.acceptedMembersCount = p.acceptedMembersCount ?? 0;
    this.acceptedRoleCounts = p.acceptedRoleCounts ?? {};
    this.createdBy = p.createdBy ?? null;
    this.createdByName = p.createdByName ?? null;
    this.createdAt = p.createdAt ?? null;
    this.updatedAt = p.updatedAt ?? null;
    this.teamDeadline = p.teamDeadline ?? null;
    this.imageUrl = p.imageUrl ?? null;
    this.imageFileId = p.imageFileId ?? null;
    this.objectives = p.objectives ?? [];
    this.stage = p.stage ?? null;
    this.deletedAt = p.deletedAt ?? null;
  }

  get isDeleted(): boolean {
    return this.deletedAt != null;
  }

  isTeamCallOpenAt(now?: Date): boolean {
    return isBeforeDeadline(this.teamDeadline, now);
  }

  get isPublic(): boolean {
    return !this.isDeleted && !this.isDraft && this.audience === "Toda la comunidad";
  }

  /** Igual que en Dart: un valor `null`/ausente conserva el actual. */
  copyWith(c: {
    name?: string | null;
    description?: string | null;
    categories?: string[] | null;
    canApply?: boolean | null;
    teamRoles?: Record<string, number> | null;
    duration?: string | null;
    audience?: string | null;
    isDraft?: boolean | null;
    acceptedMembersCount?: number | null;
    acceptedRoleCounts?: Record<string, number> | null;
    createdBy?: string | null;
    createdByName?: string | null;
    updatedAt?: Date | null;
    teamDeadline?: Date | null;
    imageFileId?: string | null;
  }): Project {
    return new Project({
      id: this.id,
      name: c.name ?? this.name,
      description: c.description ?? this.description,
      categories: c.categories ?? this.categories,
      canApply: c.canApply ?? this.canApply,
      teamRoles: c.teamRoles ?? this.teamRoles,
      duration: c.duration ?? this.duration,
      audience: c.audience ?? this.audience,
      isDraft: c.isDraft ?? this.isDraft,
      acceptedMembersCount: c.acceptedMembersCount ?? this.acceptedMembersCount,
      acceptedRoleCounts: c.acceptedRoleCounts ?? this.acceptedRoleCounts,
      createdBy: c.createdBy ?? this.createdBy,
      createdByName: c.createdByName ?? this.createdByName,
      createdAt: this.createdAt,
      updatedAt: c.updatedAt ?? this.updatedAt,
      teamDeadline: c.teamDeadline ?? this.teamDeadline,
      imageUrl: this.imageUrl,
      imageFileId: c.imageFileId ?? this.imageFileId,
      objectives: this.objectives,
      stage: this.stage,
      deletedAt: this.deletedAt,
    });
  }

  static fromJson(json: Record<string, any>): Project {
    return new Project({
      id: json.id ?? "0",
      name: json.name ?? "---",
      description: json.description ?? "",
      categories: Array.isArray(json.categories) ? json.categories.map((e: unknown) => String(e)) : [],
      canApply: json.canApply ?? false,
      teamRoles: json.teamRoles ?? {},
      duration: json.duration ?? null,
      audience: json.audience ?? null,
      isDraft: json.isDraft ?? false,
      acceptedMembersCount: json.acceptedMembersCount ?? 0,
      createdBy: json.createdBy ?? null,
      createdByName: json.createdByName ?? null,
    });
  }

  toJson(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      categories: this.categories,
      canApply: this.canApply,
      teamRoles: this.teamRoles,
      duration: this.duration,
      audience: this.audience,
      isDraft: this.isDraft,
      acceptedMembersCount: this.acceptedMembersCount,
      createdBy: this.createdBy,
      createdByName: this.createdByName,
    };
  }

  toString() {
    return `Project{id: ${this.id}, name: ${this.name}}`;
  }
}
