import type { RobleAuthConfig, RobleIdentity } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { readPublishedProjectDetail } from "./public-projects.ts";
import { ProjectWriteFailure, writeRobleRow } from "./project-write.ts";

type Row = Record<string, unknown>;
const row = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

async function published(config: RobleAuthConfig, token: string, projectId: string) {
  if (!projectId || projectId.length > 100 || !await readPublishedProjectDetail(config, token, projectId)) {
    throw new ProjectWriteFailure(404, "Este proyecto no está publicado.");
  }
}

export function projectCommentsFromRows(values: unknown[], projectId: string) {
  return values.flatMap(value => {
    const item = row(value);
    if (!item || text(item.projectId) !== projectId || !text(item._id) || !text(item.text) || !text(item.authorUserId) || text(item._owner) !== text(item.authorUserId)) return [];
    return [{ id: text(item._id), authorUserId: text(item.authorUserId), authorName: text(item.authorName) || "Usuario", text: text(item.text), createdAt: text(item.createdAt), parentId: text(item.parentId) }];
  }).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function readProjectSocial(config: RobleAuthConfig, token: string, userId: string, projectId: string) {
  await published(config, token, projectId);
  const [comments, follows] = await Promise.all([
    readRobleRows(config, token, "project_comments", { projectId }),
    readRobleRows(config, token, "project_follows", { projectId, userId }),
  ]);
  return { comments: projectCommentsFromRows(comments, projectId), following: follows.some(value => { const item = row(value); return item && item.projectId === projectId && item.userId === userId && item._owner === userId; }) };
}

export async function addProjectComment(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string, body: Row) {
  await published(config, token, projectId);
  const content = text(body.text), parentId = text(body.parentId);
  if (!content || content.length > 1000 || parentId.length > 100) throw new ProjectWriteFailure(400, "El comentario debe tener entre 1 y 1000 caracteres.");
  if (parentId) {
    const comments = await readRobleRows(config, token, "project_comments", { projectId });
    if (!projectCommentsFromRows(comments, projectId).some(item => item.id === parentId)) throw new ProjectWriteFailure(404, "El comentario al que respondes ya no existe.");
  }
  const created = await writeRobleRow(config, token, "POST", "insert-one", { tableName: "project_comments", record: {
    projectId, authorUserId: identity.userId, authorName: identity.name || identity.email || "Usuario", text: content,
    createdAt: new Date().toISOString(), ...(parentId ? { parentId } : {}),
  } });
  return text(created._id);
}

export async function setProjectFollow(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string, follow: boolean) {
  await published(config, token, projectId);
  const values = await readRobleRows(config, token, "project_follows", { projectId, userId: identity.userId });
  const own = values.map(row).filter(item => item && item.projectId === projectId && item.userId === identity.userId && item._owner === identity.userId);
  if (follow && !own.length) await writeRobleRow(config, token, "POST", "insert-one", { tableName: "project_follows", record: { projectId, userId: identity.userId, createdAt: new Date().toISOString() } });
  if (!follow) for (const item of own) await writeRobleRow(config, token, "DELETE", "delete", { tableName: "project_follows", idColumn: "_id", idValue: item!._id });
  return follow;
}
