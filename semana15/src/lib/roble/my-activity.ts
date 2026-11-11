import type { RobleAuthConfig } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { publishedProjectsFromResponse } from "./projects.ts";

export type MyRobleNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export type MyRobleRequest = {
  id: string;
  projectId: string;
  projectName: string;
  publicProject: boolean;
  role: string;
  targetId: string;
  message: string;
  type: "team" | "task";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function created(value: string): number { return Date.parse(value) || 0; }

export function myNotificationsFromRows(rows: unknown[], userId: string): MyRobleNotification[] {
  if (!userId.trim()) return [];
  return rows.flatMap(item => {
    const row = record(item);
    if (!row || text(row.recipientUserId) !== userId) return [];
    const id = text(row._id);
    if (!id) return [];
    return [{ id, type: text(row.type), title: text(row.title), message: text(row.message),
      read: row.read === true || row.read === "true", createdAt: text(row.createdAt) }];
  }).sort((a, b) => created(b.createdAt) - created(a.createdAt));
}

export function myRequestsFromRows(requestValues: unknown[], projectValues: unknown[], decisionValues: unknown[], userId: string): MyRobleRequest[] {
  if (!userId.trim()) return [];
  const projects = new Map<string, Record<string, unknown>>();
  for (const value of projectValues) {
    const row = record(value);
    if (row && text(row._id)) projects.set(text(row._id), row);
  }
  const publicNames = new Map(publishedProjectsFromResponse(projectValues).map(project => [project.id, project.name]));
  const requests = requestValues.flatMap(item => {
    const row = record(item);
    if (!row || text(row.applicantUserId) !== userId || (text(row._owner) && text(row._owner) !== userId)) return [];
    const id = text(row._id), projectId = text(row.projectId);
    return id && projectId ? [row] : [];
  });
  const requestIds = new Set(requests.map(row => text(row._id)));
  const requestsById = new Map(requests.map(row => [text(row._id), row]));
  const latest = new Map<string, Record<string, unknown>>();
  for (const value of decisionValues) {
    const row = record(value);
    if (!row) continue;
    const requestId = text(row.requestId);
    if (!requestIds.has(requestId)) continue;
    const request = requestsById.get(requestId);
    const projectOwner = request ? text(projects.get(text(request.projectId))?._owner) : "";
    if (!projectOwner) continue;
    const decisionOwner = text(row._owner);
    if (decisionOwner && decisionOwner !== projectOwner) continue;
    const previous = latest.get(requestId);
    if (!previous || created(text(row.decidedAt)) > created(text(previous.decidedAt))) latest.set(requestId, row);
  }
  return requests.map(row => {
    const id = text(row._id), projectId = text(row.projectId);
    const decisionStatus = text(latest.get(id)?.status);
    const rawStatus = decisionStatus || text(row.status);
    return {
      id, projectId, projectName: publicNames.get(projectId) ?? "Proyecto no público",
      publicProject: publicNames.has(projectId), role: text(row.role),
      targetId: text(row.type) === "task" ? text(row.taskId) : text(row.teamRoleId) || text(row.role),
      message: text(row.message),
      type: text(row.type) === "task" ? "task" as const : "team" as const,
      status: rawStatus === "accepted" ? "accepted" as const : rawStatus === "rejected" ? "rejected" as const : "pending" as const,
      createdAt: text(row.createdAt),
    };
  }).sort((a, b) => created(b.createdAt) - created(a.createdAt));
}

export async function readMyNotifications(config: RobleAuthConfig, accessToken: string, userId: string): Promise<MyRobleNotification[]> {
  if (!userId.trim()) return [];
  const rows = await readRobleRows(config, accessToken, "app_notifications", { recipientUserId: userId });
  return myNotificationsFromRows(rows, userId);
}

export async function readMyRequests(config: RobleAuthConfig, accessToken: string, userId: string): Promise<MyRobleRequest[]> {
  if (!userId.trim()) return [];
  const requests = await readRobleRows(config, accessToken, "project_requests", { applicantUserId: userId });
  const ownedRequests = requests.filter(item => {
    const row = record(item);
    return row && text(row.applicantUserId) === userId && (!text(row._owner) || text(row._owner) === userId);
  });
  if (!ownedRequests.length) return [];
  const [projects, decisions] = await Promise.all([
    readRobleRows(config, accessToken, "projects"),
    readRobleRows(config, accessToken, "request_decisions"),
  ]);
  return myRequestsFromRows(ownedRequests, projects, decisions, userId);
}
