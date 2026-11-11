import type { RobleAuthConfig, RobleIdentity } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { ProjectWriteFailure, writeRobleRow } from "./project-write.ts";

type Row = Record<string, unknown>;
const row = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const categories = ["messages", "projectActivity", "participationRequests", "comments", "reminders", "platformNews"];
const avatarIcons = ["person", "face", "smile", "school", "code", "palette", "science", "campaign", "lightbulb", "rocket", "eco", "music", "sports", "camera", "pets", "star"];

export function profileForOwner(values: unknown[], userId: string): Row | null {
  return values.map(row).find(item => item && item.userId === userId && item._owner === userId) ?? null;
}

export function publicProfileFields(value: Row | null) {
  const muted = (() => {
    try { const parsed: unknown = JSON.parse(text(value?.mutedNotifications) || "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && categories.includes(item)) : []; }
    catch { return []; }
  })();
  return {
    name: text(value?.name), username: text(value?.username), bio: text(value?.bio),
    career: text(value?.career), avatarIcon: text(value?.avatarIcon) || "person",
    profileVisibility: value?.profileVisibility === "private" ? "private" : "public",
    contactPermission: value?.contactPermission === "nobody" ? "nobody" : "everyone",
    activityVisibility: value?.activityVisibility === "onlyMe" ? "onlyMe" : "everyone",
    notificationsEnabled: value?.notificationsEnabled !== false && value?.notificationsEnabled !== "false",
    mutedNotifications: muted,
  };
}

function parseChanges(body: Row): Row {
  const kind = body.kind;
  if (kind === "details") {
    const name = text(body.name), username = text(body.username).replace(/^@/, "");
    const bio = text(body.bio), career = text(body.career), avatarIcon = text(body.avatarIcon);
    if (name.length < 2 || name.length > 80 || !/^[a-zA-Z0-9_]{3,24}$/.test(username) || bio.length > 280 || career.length > 100 || !avatarIcons.includes(avatarIcon)) {
      throw new ProjectWriteFailure(400, "Revisa el nombre, el usuario y los campos del perfil.");
    }
    return { name, username, bio, career, avatarIcon };
  }
  if (kind === "privacy") {
    if (!["public", "private"].includes(String(body.profileVisibility)) || !["everyone", "nobody"].includes(String(body.contactPermission)) || !["everyone", "onlyMe"].includes(String(body.activityVisibility))) {
      throw new ProjectWriteFailure(400, "Preferencias de privacidad inválidas.");
    }
    return { profileVisibility: body.profileVisibility, contactPermission: body.contactPermission, activityVisibility: body.activityVisibility };
  }
  if (kind === "notifications") {
    const muted = body.mutedNotifications;
    if (typeof body.notificationsEnabled !== "boolean" || !Array.isArray(muted) || muted.some(item => typeof item !== "string" || !categories.includes(item))) {
      throw new ProjectWriteFailure(400, "Preferencias de notificaciones inválidas.");
    }
    return { notificationsEnabled: body.notificationsEnabled, mutedNotifications: JSON.stringify([...new Set(muted)]) };
  }
  throw new ProjectWriteFailure(400, "Tipo de cambio de perfil inválido.");
}

export async function saveOwnProfile(config: RobleAuthConfig, token: string, identity: RobleIdentity, body: Row) {
  const changes = parseChanges(body);
  const profiles = await readRobleRows(config, token, "user_profiles", { userId: identity.userId });
  const current = profileForOwner(profiles, identity.userId);
  if (profiles.length && !current) throw new ProjectWriteFailure(403, "No puedes modificar ese perfil.");
  if (body.kind === "details") {
    const all = await readRobleRows(config, token, "user_profiles");
    if (all.map(row).some(item => item && item.userId !== identity.userId && text(item.username).toLowerCase() === String(changes.username).toLowerCase())) {
      throw new ProjectWriteFailure(409, "Ese nombre de usuario ya está en uso.");
    }
  }
  const updates = { ...changes, updatedAt: new Date().toISOString() };
  if (current) {
    await writeRobleRow(config, token, "PUT", "update", { tableName: "user_profiles", idColumn: "_id", idValue: current._id, updates });
  } else {
    const fallback = { userId: identity.userId, name: identity.name || identity.email || "Usuario", username: identity.email.split("@")[0] || "usuario",
      bio: "", career: "", profileVisibility: "public", contactPermission: "everyone", activityVisibility: "everyone",
      notificationsEnabled: true, mutedNotifications: "[]", avatarIcon: "person" };
    await writeRobleRow(config, token, "POST", "insert-one", { tableName: "user_profiles", record: { ...fallback, ...updates } });
  }
  const refreshed = await readRobleRows(config, token, "user_profiles", { userId: identity.userId });
  return publicProfileFields(profileForOwner(refreshed, identity.userId));
}
