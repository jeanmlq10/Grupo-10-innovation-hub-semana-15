import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleRows } from "@/src/core/roble/robleRows";
import { RobleSchema } from "@/src/core/roble/robleSchema";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { CommentFailure } from "../../domain/commentFailure";
import { ProjectComment } from "../../domain/models/projectComment";
import { ICommentRepository } from "../../domain/repositories/iCommentRepository";
import { ICommentDataSource } from "../datasources/iCommentDataSource";

/** Comentarios: convierte filas y traduce errores. */
export class CommentRepository implements ICommentRepository {
  constructor(private readonly source: ICommentDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new CommentFailure(m));
  }

  async forProject(projectId: string) {
    const rows = await this.guard(() => this.source.readForProject(projectId));
    return rows.map((r) => this.toComment(r)).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async byAuthor(userId: string) {
    const rows = await this.guard(() => this.source.readByAuthor(userId));
    return rows
      .map((r) => this.toComment(r))
      .filter((c) => c.authorUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async add(comment: ProjectComment) {
    const row: Row = {
      projectId: comment.projectId,
      authorUserId: comment.authorUserId,
      authorName: comment.authorName,
      text: comment.text,
      createdAt: RobleRows.nowIso(),
    };
    // Solo las respuestas llevan `parentId`: los comentarios principales
    // siguen funcionando aunque la columna todavía no exista en Roble.
    if (comment.parentId != null) row.parentId = comment.parentId;
    const created = await this.guard(async () => {
      try {
        return await this.source.create(row);
      } catch (e) {
        if (comment.parentId != null && RobleSchema.isMissingColumn(e, "parentId")) {
          throw new CommentFailure(
            "Para responder comentarios falta la columna parentId (text) en la tabla project_comments de Roble. " +
              "Ver ROBLE_CAMBIOS.md.",
          );
        }
        throw e;
      }
    });
    return this.toComment(created);
  }

  private toComment(row: Row): ProjectComment {
    return new ProjectComment({
      id: RobleRows.str(row._id),
      projectId: RobleRows.str(row.projectId),
      authorName: RobleRows.str(row.authorName, "Usuario"),
      authorUserId: RobleRows.author(row, "authorUserId"),
      text: RobleRows.str(row.text),
      createdAt: RobleRows.date(row.createdAt) ?? new Date(),
      parentId: RobleRows.strOrNull(row.parentId),
    });
  }
}
