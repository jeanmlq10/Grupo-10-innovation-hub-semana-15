import type { RobleAuthConfig } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { publishedProjectsFromResponse, type PublishedProject } from "./projects.ts";

export type PublishedRobleDetail = PublishedProject & {
  duration: string;
  teamDeadline: string;
  roles: { name: string; needed: number; accepted: number }[];
  tasks: { id: string; title: string; description: string; needed: number; accepted: number; status: string }[];
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }
function object(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try { return object(JSON.parse(value)); } catch { return {}; }
  }
  return record(value) ?? {};
}
function count(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.trunc(number) : 0;
}

export function publishedProjectDetailFromRows(projectValue: unknown, taskValues: unknown[]): PublishedRobleDetail | null {
  const row = record(projectValue);
  if (!row) return null;
  const project = publishedProjectsFromResponse([row])[0];
  if (!project) return null;
  const teamRoles = object(row.teamRoles), acceptedCounts = object(row.acceptedRoleCounts);
  const owner = text(row._owner);
  return {
    ...project,
    duration: text(row.duration),
    teamDeadline: text(row.teamDeadline),
    roles: Object.entries(teamRoles).flatMap(([name, value]) => count(value) > 0
      ? [{ name, needed: count(value), accepted: count(acceptedCounts[name]) }] : []),
    tasks: taskValues.flatMap(item => {
      const task = record(item);
      if (!task || text(task.projectId) !== project.id || !owner || text(task._owner) !== owner) return [];
      const id = text(task._id), title = text(task.title);
      return id && title ? [{ id, title, description: text(task.description), needed: count(task.requiredCount), accepted: count(task.acceptedCount), status: text(task.status) || "available" }] : [];
    }),
  };
}

export async function readPublishedProjects(config: RobleAuthConfig, accessToken: string): Promise<PublishedProject[]> {
  const rows = await readRobleRows(config, accessToken, "projects", { isDraft: "false", audience: "Toda la comunidad" });
  return publishedProjectsFromResponse(rows);
}

export async function readPublishedProjectDetail(config: RobleAuthConfig, accessToken: string, id: string): Promise<PublishedRobleDetail | null> {
  if (!id.trim() || id.length > 100) return null;
  const rows = await readRobleRows(config, accessToken, "projects", { _id: id });
  const project = rows.find(item => {
    const row = record(item);
    return row && text(row._id) === id && publishedProjectsFromResponse([row]).length > 0;
  });
  if (!project) return null;
  const tasks = await readRobleRows(config, accessToken, "project_tasks", { projectId: id });
  return publishedProjectDetailFromRows(project, tasks);
}
