import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleRows } from "@/src/core/roble/robleRows";
import { Row, robleOwnerOf } from "@/src/core/roble/sdk/robleOwnership";

import { MemberFailure } from "../../domain/memberFailure";
import { MemberSourceType, ProjectMember } from "../../domain/models/projectMember";
import { IMemberRepository } from "../../domain/repositories/iMemberRepository";
import { IMemberDataSource } from "../datasources/iMemberDataSource";

const Y2000 = new Date(2000, 0, 1).getTime();

/** Miembros: solo cuentan los que registro el creador del proyecto; misma persona+rol cuenta una vez. */
export class MemberRepository implements IMemberRepository {
  constructor(private readonly source: IMemberDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new MemberFailure(m));
  }

  async forProject(projectId: string, { ownerId }: { ownerId: string }) {
    const rows = await this.guard(() => this.source.readForProject(projectId));
    const members = rows
      .filter((row) => {
        const owner = robleOwnerOf(row);
        return owner == null || owner === ownerId;
      })
      .map((r) => this.toMember(r))
      .sort((a, b) => (a.joinedAt?.getTime() ?? Y2000) - (b.joinedAt?.getTime() ?? Y2000));
    const seen = new Set<string>();
    return members.filter((m) => {
      const key = `${m.userId}|${m.role}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async forUser(userId: string) {
    const rows = await this.guard(() => this.source.readForUser(userId));
    return rows.map((r) => this.toMember(r)).filter((m) => m.userId === userId);
  }

  async add(member: ProjectMember) {
    const row = await this.guard(() =>
      this.source.create({
        projectId: member.projectId,
        userId: member.userId,
        name: member.name,
        email: member.email,
        role: member.role,
        joinedAt: RobleRows.nowIso(),
        sourceType: member.sourceType === MemberSourceType.task ? "task" : "team",
        sourceId: member.sourceId,
      }),
    );
    return this.toMember(row);
  }

  private toMember(row: Row): ProjectMember {
    return new ProjectMember({
      id: RobleRows.str(row._id),
      projectId: RobleRows.str(row.projectId),
      userId: RobleRows.str(row.userId),
      name: RobleRows.str(row.name, "Miembro"),
      email: RobleRows.strOrNull(row.email),
      role: RobleRows.str(row.role),
      sourceType: RobleRows.str(row.sourceType) === "task" ? MemberSourceType.task : MemberSourceType.team,
      sourceId: RobleRows.strOrNull(row.sourceId),
      joinedAt: RobleRows.date(row.joinedAt),
      recordedBy: robleOwnerOf(row),
    });
  }
}
