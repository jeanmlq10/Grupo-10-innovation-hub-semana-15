import type { RobleAuthConfig } from "./auth";
import { ownProjectsFromResponse, readRobleRows, type OwnRobleProject } from "./own-projects.ts";

export type OwnRobleTask = {
  id: string;
  title: string;
  description: string;
  needed: number;
  accepted: number;
  deadline: string;
  status: "available" | "in_progress" | "completed";
  visibility: "public" | "team";
};

export type OwnRobleMember = { id: string; name: string; role: string; joinedAt: string };
export type OwnRobleRequest = {
  id: string;
  applicantName: string;
  role: string;
  message: string;
  type: "team" | "task";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

export type OwnRobleProjectDetail = OwnRobleProject & {
  duration: string;
  teamDeadline: string;
  teamRoles: { role: string; needed: number; accepted: number }[];
  tasks: OwnRobleTask[];
  members: OwnRobleMember[];
  requests: OwnRobleRequest[];
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }

function jsonRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try { return jsonRecord(JSON.parse(value)); } catch { return {}; }
  }
  return record(value) ?? {};
}

function count(value: unknown): number {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function rowsForProject(rows: unknown[], projectId: string): Record<string, unknown>[] {
  return rows.flatMap(item => {
    const row = record(item);
    return row && text(row.projectId) === projectId ? [row] : [];
  });
}

export function ownProjectDetailFromRows(
  projectValue: unknown,
  ownerId: string,
  tasksValue: unknown[],
  membersValue: unknown[],
  requestsValue: unknown[],
  decisionsValue: unknown[],
  privateTasksValue: unknown[] = [],
): OwnRobleProjectDetail | null {
  const projectRow = record(projectValue);
  if (!projectRow) return null;
  const project = ownProjectsFromResponse([projectRow], ownerId)[0];
  if (!project) return null;
  const projectId = project.id;
  const teamRoles = jsonRecord(projectRow.teamRoles);
  const acceptedRoleCounts = jsonRecord(projectRow.acceptedRoleCounts);
  const requests = rowsForProject(requestsValue, projectId);
  const requestIds = new Set(requests.map(row => text(row._id)).filter(Boolean));
  const latestDecisions = new Map<string, Record<string, unknown>>();
  const privateTasks = new Map(rowsForProject(privateTasksValue, projectId)
    .filter(row => text(row._owner) === ownerId && text(row.taskId))
    .map(row => [text(row.taskId), row]));

  for (const item of decisionsValue) {
    const decision = record(item);
    if (!decision) continue;
    const requestId = text(decision.requestId);
    if (!requestIds.has(requestId)) continue;
    const author = text(decision._owner);
    if (author && author !== ownerId) continue;
    const previous = latestDecisions.get(requestId);
    if (!previous || (Date.parse(text(decision.decidedAt)) || 0) > (Date.parse(text(previous.decidedAt)) || 0)) {
      latestDecisions.set(requestId, decision);
    }
  }

  return {
    ...project,
    duration: text(projectRow.duration),
    teamDeadline: text(projectRow.teamDeadline),
    teamRoles: Object.entries(teamRoles).flatMap(([role, needed]) => count(needed) > 0
      ? [{ role, needed: count(needed), accepted: count(acceptedRoleCounts[role]) }] : []),
    tasks: rowsForProject(tasksValue, projectId).flatMap(row => {
      const id = text(row._id), teamOnly = text(row.visibility) === "team";
      const privateTask = teamOnly ? privateTasks.get(id) : undefined;
      const title = teamOnly ? text(privateTask?.title) : text(row.title);
      if (!id || !title || text(row._owner) !== ownerId) return [];
      const status = text(row.status);
      return [{ id, title, description: teamOnly ? text(privateTask?.description) : text(row.description), needed: count(row.requiredCount),
        accepted: count(row.acceptedCount), deadline: text(row.deadline),
        visibility: teamOnly ? "team" as const : "public" as const,
        status: status === "completed" ? "completed" as const : status === "in_progress" ? "in_progress" as const : "available" as const }];
    }),
    members: rowsForProject(membersValue, projectId).flatMap(row => {
      const id = text(row._id), name = text(row.name);
      if (!id || !name || text(row._owner) !== ownerId) return [];
      return [{ id, name, role: text(row.role), joinedAt: text(row.joinedAt) }];
    }),
    requests: requests.flatMap(row => {
      const id = text(row._id);
      if (!id) return [];
      const decided = text(latestDecisions.get(id)?.status);
      const rawStatus = decided || text(row.status);
      return [{ id, applicantName: text(row.applicantName) || "Usuario interesado", role: text(row.role),
        message: text(row.message), type: text(row.type) === "task" ? "task" as const : "team" as const,
        status: rawStatus === "accepted" ? "accepted" as const : rawStatus === "rejected" ? "rejected" as const : "pending" as const,
        createdAt: text(row.createdAt) }];
    }).sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)),
  };
}

export async function readOwnProjectDetail(config: RobleAuthConfig, accessToken: string, ownerId: string, projectId: string): Promise<OwnRobleProjectDetail | null> {
  if (!ownerId.trim() || !projectId.trim() || projectId.length > 100) return null;
  const projects = await readRobleRows(config, accessToken, "projects", { _id: projectId, _owner: ownerId });
  const project = projects.find(item => {
    const row = record(item);
    return row && text(row._id) === projectId && text(row._owner) === ownerId;
  });
  if (!project || !ownProjectsFromResponse([project], ownerId).length) return null;

  const [tasks, members, requests, decisions] = await Promise.all([
    readRobleRows(config, accessToken, "project_tasks", { projectId }),
    readRobleRows(config, accessToken, "project_members", { projectId }),
    readRobleRows(config, accessToken, "project_requests", { projectId }),
    readRobleRows(config, accessToken, "request_decisions"),
  ]);
  const hasTeamTasks = tasks.some(item => { const task = record(item); return task && text(task.projectId) === projectId && text(task._owner) === ownerId && text(task.visibility) === "team"; });
  const privateTasks = hasTeamTasks ? await readRobleRows(config, accessToken, "project_task_private", { projectId }) : [];
  return ownProjectDetailFromRows(project, ownerId, tasks, members, requests, decisions, privateTasks);
}
