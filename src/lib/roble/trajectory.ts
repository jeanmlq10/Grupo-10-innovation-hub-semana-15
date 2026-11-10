import type { RobleAuthConfig } from "./auth";
import { readOwnProjects, readRobleRows } from "./own-projects.ts";
import { readMyRequests } from "./my-activity.ts";

type Row = Record<string, unknown>;
const row = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
type Entry = { id: string; date: string; text: string; href: string };

export async function readOwnTrajectory(config: RobleAuthConfig, token: string, userId: string) {
  const [ownProjects, memberRows, commentRows, followRows, requests, allProjects, taskRows] = await Promise.all([
    readOwnProjects(config, token, userId),
    readRobleRows(config, token, "project_members", { userId }),
    readRobleRows(config, token, "project_comments", { authorUserId: userId }),
    readRobleRows(config, token, "project_follows", { userId }),
    readMyRequests(config, token, userId),
    readRobleRows(config, token, "projects"),
    readRobleRows(config, token, "project_tasks"),
  ]);
  const projects = new Map(allProjects.map(row).filter((item): item is Row => !!item && !!text(item._id) && !text(item.deletedAt)).map(item => [text(item._id), item]));
  const accessibleName = (id: string) => {
    const item = projects.get(id);
    return item && (item._owner === userId || item.isDraft === false && item.audience === "Toda la comunidad") ? text(item.name) : "Proyecto";
  };
  const members = memberRows.map(row).filter((item): item is Row => !!item && item.userId === userId && !!projects.get(text(item.projectId)));
  const comments = commentRows.map(row).filter((item): item is Row => !!item && item.authorUserId === userId && item._owner === userId && !!projects.get(text(item.projectId)));
  const follows = followRows.map(row).filter((item): item is Row => !!item && item.userId === userId && item._owner === userId && !!projects.get(text(item.projectId)));
  const tasks = new Map(taskRows.map(row).filter((item): item is Row => !!item && !!text(item._id)).map(item => [text(item._id), item]));
  const assigned = members.filter(item => item.sourceType === "task" && text(item.sourceId));
  const tasksCompleted = assigned.filter(item => {
    const task = tasks.get(text(item.sourceId));
    return task && task.projectId === item.projectId && task.status === "completed";
  }).length;
  const requestsAccepted = requests.filter(item => item.status === "accepted").length;
  const projectsCreated = ownProjects.length;
  const summary = {
    projectsCreated, projectsCompleted: 0, tasksAssigned: assigned.length, tasksCompleted,
    participations: members.length, comments: comments.length, requestsSent: requests.length, requestsAccepted,
    collaboration: Math.min(1, (members.length * 2 + projectsCreated * 2 + comments.length) / 10),
    fulfillment: assigned.length ? tasksCompleted / assigned.length : null,
    quality: requests.length ? requestsAccepted / requests.length : null,
  };
  const entries: Entry[] = [
    ...ownProjects.map(project => ({ id: `project-${project.id}`, date: project.createdAt, text: `Creaste ${project.name}`, href: `/mis-proyectos/roble/${encodeURIComponent(project.id)}` })),
    ...members.map(item => ({ id: `member-${text(item._id)}`, date: text(item.joinedAt), text: `Te uniste a ${accessibleName(text(item.projectId))}`, href: `/explorar/roble/${encodeURIComponent(text(item.projectId))}` })),
    ...comments.map(item => ({ id: `comment-${text(item._id)}`, date: text(item.createdAt), text: `Comentaste en ${accessibleName(text(item.projectId))}`, href: `/explorar/roble/${encodeURIComponent(text(item.projectId))}` })),
    ...follows.map(item => ({ id: `follow-${text(item._id)}`, date: text(item.createdAt), text: `Seguiste ${accessibleName(text(item.projectId))}`, href: `/explorar/roble/${encodeURIComponent(text(item.projectId))}` })),
  ].filter(item => item.date).sort((a, b) => b.date.localeCompare(a.date));
  return { summary, entries };
}
