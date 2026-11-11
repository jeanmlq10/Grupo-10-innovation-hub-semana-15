/** A project owned by the current user, shown in "Mis proyectos". */
export class MyProject {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly status: string;
  readonly isDraft: boolean;
  readonly membersCount: number | null;
  readonly tasksCount: number | null;
  readonly requestsCount: number | null;
  readonly isPlaceholder: boolean;
  /** Imagen del proyecto (PENDIENTE de Roble Storage; ver ProjectAvatar). */
  readonly imageUrl: string | null;
  readonly imageFileId: string | null;
  readonly categories: string[];

  constructor(p: {
    id: string;
    name: string;
    description: string;
    status: string;
    isDraft: boolean;
    membersCount?: number | null;
    tasksCount?: number | null;
    requestsCount?: number | null;
    isPlaceholder?: boolean;
    imageUrl?: string | null;
    imageFileId?: string | null;
    categories?: string[];
  }) {
    this.id = p.id;
    this.name = p.name;
    this.description = p.description;
    this.status = p.status;
    this.isDraft = p.isDraft;
    this.membersCount = p.membersCount ?? null;
    this.tasksCount = p.tasksCount ?? null;
    this.requestsCount = p.requestsCount ?? null;
    this.isPlaceholder = p.isPlaceholder ?? false;
    this.imageUrl = p.imageUrl ?? null;
    this.imageFileId = p.imageFileId ?? null;
    this.categories = p.categories ?? [];
  }

  static fromJson(json: Record<string, any>): MyProject {
    return new MyProject({
      id: json.id ?? "0",
      name: json.name ?? "",
      description: json.description ?? "",
      status: json.status ?? "",
      isDraft: json.isDraft ?? false,
      membersCount: json.membersCount ?? null,
      tasksCount: json.tasksCount ?? null,
      requestsCount: json.requestsCount ?? null,
      isPlaceholder: json.isPlaceholder ?? false,
    });
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status,
      isDraft: this.isDraft,
      membersCount: this.membersCount,
      tasksCount: this.tasksCount,
      requestsCount: this.requestsCount,
      isPlaceholder: this.isPlaceholder,
    };
  }

  toString() {
    return `MyProject{id: ${this.id}, name: ${this.name}, isDraft: ${this.isDraft}}`;
  }
}
