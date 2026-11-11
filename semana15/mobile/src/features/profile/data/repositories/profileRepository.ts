import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleOptionalColumns } from "@/src/core/roble/robleOptionalColumns";
import { RobleRows } from "@/src/core/roble/robleRows";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { ActivityVisibility, ContactPermission, ProfileVisibility, UserProfile } from "../../domain/models/userProfile";
import { ProfileFailure } from "../../domain/profileFailure";
import { IProfileRepository } from "../../domain/repositories/iProfileRepository";
import { IProfileDataSource } from "../datasources/iProfileDataSource";

/** Perfiles: convierte filas en [UserProfile] y traduce errores. */
export class ProfileRepository implements IProfileRepository {
  private static readonly optionalColumns = new Set(["avatarIcon"]);

  constructor(private readonly source: IProfileDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new ProfileFailure(m), { notFound: "Ese perfil ya no existe." });
  }

  async byUserId(userId: string) {
    if (!userId) return null;
    const rows = await this.guard(() => this.source.readForUser(userId));
    const own = rows.filter((row) => RobleRows.author(row, "userId") === userId);
    return own.length === 0 ? null : this.toProfile(own[0]);
  }

  async save(profile: UserProfile) {
    const row =
      profile.id === ""
        ? await this.guard(() =>
            RobleOptionalColumns.write(this.toRow(profile), (r) => this.source.create(r), {
              optional: ProfileRepository.optionalColumns,
            }),
          )
        : await this.guard(() =>
            RobleOptionalColumns.write(this.toRow(profile), (changes) => this.source.update(profile.id, changes), {
              optional: ProfileRepository.optionalColumns,
            }),
          );
    return Object.keys(row).length === 0 ? profile : this.toProfile(row);
  }

  async delete(profile: UserProfile) {
    if (profile.id === "") return;
    await this.guard(() => this.source.delete(profile.id));
  }

  private toRow(p: UserProfile): Row {
    return {
      userId: p.userId,
      name: p.name,
      username: p.username,
      bio: p.bio,
      career: p.career,
      profileVisibility: p.visibility,
      contactPermission: p.contact,
      activityVisibility: p.activityVisibility,
      notificationsEnabled: p.notificationsEnabled,
      mutedNotifications: JSON.stringify([...p.mutedNotifications]),
      avatarIcon: p.avatarIcon,
      updatedAt: RobleRows.nowIso(),
    };
  }

  private toProfile(row: Row): UserProfile {
    return new UserProfile({
      id: RobleRows.str(row._id),
      userId: RobleRows.str(row.userId),
      name: RobleRows.str(row.name),
      username: RobleRows.str(row.username),
      bio: RobleRows.str(row.bio),
      career: RobleRows.str(row.career),
      visibility: RobleRows.str(row.profileVisibility) === "private" ? ProfileVisibility.private : ProfileVisibility.public,
      contact: RobleRows.str(row.contactPermission) === "nobody" ? ContactPermission.nobody : ContactPermission.everyone,
      activityVisibility:
        RobleRows.str(row.activityVisibility) === "onlyMe" ? ActivityVisibility.onlyMe : ActivityVisibility.everyone,
      notificationsEnabled: RobleRows.boolean(row.notificationsEnabled, true),
      mutedNotifications: new Set(RobleRows.stringList(row.mutedNotifications)),
      avatarIcon: RobleRows.str(row.avatarIcon),
    });
  }
}
