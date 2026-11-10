/** A comment left on a project from "Ver proyecto" (tabla `project_comments`). */
export class ProjectComment {
  readonly id: string;
  readonly projectId: string;
  readonly authorName: string;
  readonly authorUserId: string | null;
  readonly text: string;
  readonly createdAt: Date;
  /** Comentario al que responde (columna `parentId`); `null` = comentario principal. */
  readonly parentId: string | null;

  constructor(p: {
    id: string;
    projectId: string;
    authorName: string;
    text: string;
    createdAt: Date;
    authorUserId?: string | null;
    parentId?: string | null;
  }) {
    this.id = p.id;
    this.projectId = p.projectId;
    this.authorName = p.authorName;
    this.authorUserId = p.authorUserId ?? null;
    this.text = p.text;
    this.createdAt = p.createdAt;
    this.parentId = p.parentId != null && p.parentId !== "" ? p.parentId : null;
  }

  get isReply(): boolean {
    return this.parentId != null;
  }
}

/** Un comentario principal con sus respuestas (un nivel, como un hilo). */
export class CommentThread {
  constructor(
    readonly root: ProjectComment,
    readonly replies: ProjectComment[],
  ) {}

  /** Fecha de la última actividad del hilo (para ordenar). */
  get lastActivity(): Date {
    const last = this.replies.length > 0 ? this.replies[this.replies.length - 1].createdAt : this.root.createdAt;
    return last.getTime() > this.root.createdAt.getTime() ? last : this.root.createdAt;
  }

  /**
   * Agrupa una lista plana en hilos. Las respuestas a respuestas se cuelgan
   * del comentario principal; una respuesta cuyo comentario ya no existe se
   * muestra como principal (no se pierde). Hilos del más reciente al más
   * viejo; respuestas en orden cronológico.
   */
  static build(comments: ProjectComment[]): CommentThread[] {
    const byId = new Map(comments.map((c) => [c.id, c]));
    const rootOf = (c: ProjectComment): ProjectComment => {
      let current = c;
      const seen = new Set<string>();
      while (current.parentId != null && byId.has(current.parentId) && !seen.has(current.id)) {
        seen.add(current.id);
        current = byId.get(current.parentId)!;
      }
      return current;
    };
    const roots = new Map<string, ProjectComment[]>();
    const order: ProjectComment[] = [];
    for (const c of comments) {
      const root = rootOf(c);
      if (root.id === c.id) {
        if (!roots.has(c.id)) {
          roots.set(c.id, []);
          order.push(c);
        }
      } else {
        if (!roots.has(root.id)) {
          roots.set(root.id, []);
          order.push(root);
        }
        roots.get(root.id)!.push(c);
      }
    }
    return order
      .map(
        (root) =>
          new CommentThread(
            root,
            [...(roots.get(root.id) ?? [])].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
          ),
      )
      .sort((a, b) => b.root.createdAt.getTime() - a.root.createdAt.getTime());
  }
}
