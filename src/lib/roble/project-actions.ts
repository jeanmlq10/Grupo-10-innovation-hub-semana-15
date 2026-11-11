import type { RobleAuthConfig, RobleIdentity } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { ProjectWriteFailure, writeRobleRow } from "./project-write.ts";

type Row = Record<string, unknown>;
const asRow = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

async function ownedProject(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string): Promise<Row> {
  if (!projectId || projectId.length > 100) throw new ProjectWriteFailure(404, "Proyecto no disponible.");
  const rows = await readRobleRows(config, token, "projects", { _id: projectId, _owner: identity.userId });
  const project = rows.map(asRow).find(row => row && text(row._id) === projectId && text(row._owner) === identity.userId && !text(row.deletedAt));
  if (!project) throw new ProjectWriteFailure(404, "Proyecto no disponible o no pertenece a tu cuenta.");
  return project;
}

export async function updateOwnedTaskStatus(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string, taskId: string, status: unknown): Promise<void> {
  if (status !== "available" && status !== "in_progress" && status !== "completed") throw new ProjectWriteFailure(400, "Estado de tarea inválido.");
  await ownedProject(config, token, identity, projectId);
  if (!taskId || taskId.length > 100) throw new ProjectWriteFailure(404, "Tarea no disponible.");
  const rows = await readRobleRows(config, token, "project_tasks", { _id: taskId, projectId });
  const task = rows.map(asRow).find(row => row && text(row._id) === taskId && text(row.projectId) === projectId && text(row._owner) === identity.userId);
  if (!task) throw new ProjectWriteFailure(404, "Tarea no disponible o no pertenece a este proyecto.");
  await writeRobleRow(config, token, "PUT", "update", { tableName: "project_tasks", idColumn: "_id", idValue: taskId, updates: { status } });
}

export async function softDeleteOwnedProject(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string): Promise<void> {
  await ownedProject(config, token, identity, projectId);
  await writeRobleRow(config, token, "PUT", "update", { tableName: "projects", idColumn: "_id", idValue: projectId,
    updates: { deletedAt: new Date().toISOString(), isDraft: true, audience: "Solo yo" } });
}
