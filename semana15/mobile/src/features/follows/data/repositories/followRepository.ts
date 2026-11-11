import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleRows } from "@/src/core/roble/robleRows";
import { RobleApiNotFoundException } from "@/src/core/roble/sdk/robleExceptions";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { FollowFailure } from "../../domain/followFailure";
import { ProjectFollow } from "../../domain/models/projectFollow";
import { IFollowRepository } from "../../domain/repositories/iFollowRepository";
import { IFollowDataSource } from "../datasources/iFollowDataSource";

/** Seguir = insertar fila; dejar de seguir = borrarla. */
export class FollowRepository implements IFollowRepository {
  constructor(private readonly source: IFollowDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new FollowFailure(m));
  }

  private async rowsOf(userId: string): Promise<Row[]> {
    const rows = await this.guard(() => this.source.readForUser(userId));
    return rows.filter((r) => RobleRows.author(r, "userId") === userId);
  }

  async followsOf(userId: string) {
    return (await this.rowsOf(userId)).map(
      (r) => new ProjectFollow({ projectId: RobleRows.str(r.projectId), userId, createdAt: RobleRows.date(r.createdAt) }),
    );
  }

  async followedProjectIds(userId: string) {
    return new Set((await this.rowsOf(userId)).map((r) => RobleRows.str(r.projectId)));
  }

  async isFollowing(projectId: string, userId: string) {
    return (await this.followedProjectIds(userId)).has(projectId);
  }

  async toggle(projectId: string, userId: string) {
    const rows = (await this.rowsOf(userId)).filter((r) => RobleRows.str(r.projectId) === projectId);
    if (rows.length > 0) {
      for (const row of rows) {
        await this.guard(async () => {
          try {
            await this.source.delete(RobleRows.str(row._id));
          } catch (e) {
            if (e instanceof RobleApiNotFoundException) return;
            throw e;
          }
        });
      }
      return false;
    }
    await this.guard(() => this.source.create({ projectId, userId, createdAt: RobleRows.nowIso() }));
    return true;
  }
}
