import type { RobleAuthConfig, RobleIdentity } from "./auth";
import { readRobleRows } from "./own-projects.ts";

type Row = Record<string, unknown>;
export type ProjectWriteInput = {
  name: string; description: string; categories: string[]; audience: "Solo yo" | "Toda la comunidad";
  duration: string; teamRoles: Record<string, number>; teamDeadline: string;
  tasks: { id: string; title: string; description: string; requiredCount: number; deadline: string }[];
  publish: boolean;
};

export class ProjectWriteFailure extends Error {
  readonly status: number;
  readonly projectId?: string;
  constructor(status: number, message: string, projectId?: string) { super(message); this.status = status; this.projectId = projectId; }
}

const object = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const jsonObject = (value: unknown): Row | null => {
  if (typeof value === "string") { try { return object(JSON.parse(value)); } catch { return null; } }
  return object(value);
};
const string = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const date = (value: string): boolean => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export function parseProjectWrite(value: unknown): ProjectWriteInput {
  const row = object(value);
  if (!row) throw new ProjectWriteFailure(400, "Datos de proyecto inválidos.");
  const name = string(row.name), description = string(row.description);
  const categories = row.categories;
  const roles = object(row.teamRoles);
  const tasks = row.tasks;
  const audience = row.audience;
  const publish = row.publish === true;
  const duration = string(row.duration), teamDeadline = string(row.teamDeadline);
  if (!name || name.length > 120 || description.length > 5000 || !Array.isArray(categories) || categories.length > 12 ||
      categories.some(item => typeof item !== "string" || !item.trim() || item.trim().length > 80) ||
      !roles || Object.keys(roles).length > 20 || Object.entries(roles).some(([role, count]) => !role || role.length > 80 || !Number.isInteger(count) || (count as number) < 0 || (count as number) > 100) ||
      !Array.isArray(tasks) || tasks.length > 30 || !date(teamDeadline) || duration.length > 40 ||
      (audience !== "Solo yo" && audience !== "Toda la comunidad") ||
      (publish && (!description || !duration))) {
    throw new ProjectWriteFailure(400, "Revisa el nombre, la descripción y los campos del proyecto.");
  }
  const parsedTasks = tasks.map(item => {
    const task = object(item);
    const id = string(task?.id), title = string(task?.title), taskDescription = string(task?.description), deadline = string(task?.deadline);
    const requiredCount = task?.requiredCount;
    if (!id || id.length > 100 || title.length > 120 || taskDescription.length > 2000 || !date(deadline) ||
        !Number.isInteger(requiredCount) || (requiredCount as number) < 1 || (requiredCount as number) > 100 || (publish && !title)) {
      throw new ProjectWriteFailure(400, "Revisa el título y los cupos de cada tarea.");
    }
    return { id, title, description: taskDescription, requiredCount: requiredCount as number, deadline };
  });
  if (new Set(parsedTasks.map(task => task.id)).size !== parsedTasks.length) throw new ProjectWriteFailure(400, "Hay tareas duplicadas.");
  return { name, description, categories: categories.map(item => (item as string).trim()), audience, duration,
    teamRoles: Object.fromEntries(Object.entries(roles).filter(([, count]) => (count as number) > 0)) as Record<string, number>,
    teamDeadline, tasks: parsedTasks, publish };
}

export async function writeRobleRow(config: RobleAuthConfig, token: string, method: "POST" | "PUT" | "DELETE", endpoint: string, body: Row): Promise<Row> {
  const url = new URL(`/database/${encodeURIComponent(config.contractId)}/${endpoint}`, config.baseUrl);
  let response: Response;
  try {
    response = await fetch(url, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch { throw new ProjectWriteFailure(503, "No pudimos conectar con Roble. Revisa tus proyectos antes de reintentar."); }
  if (response.status === 401) throw new ProjectWriteFailure(401, "Tu sesión terminó. Inicia sesión de nuevo.");
  if (!response.ok) throw new ProjectWriteFailure(response.status === 403 ? 403 : 503, "Roble rechazó el cambio. Revisa tus proyectos antes de reintentar.");
  const result: unknown = await response.json().catch(() => null);
  if (method === "POST" && !object(result)?._id) throw new ProjectWriteFailure(502, "Roble no confirmó la creación. Revisa tus proyectos antes de reintentar.");
  return object(result) ?? {};
}

function projectFields(input: ProjectWriteInput, identity: RobleIdentity, existing?: Row): Row {
  const accepted = jsonObject(existing?.acceptedRoleCounts) ?? {};
  for (const [role, count] of Object.entries(accepted)) {
    if (typeof count === "number" && (input.teamRoles[role] ?? 0) < count) throw new ProjectWriteFailure(400, `Conserva los cupos ya ocupados de ${role}.`);
  }
  return { name: input.name, description: input.description, categories: input.categories,
    canApply: existing?.canApply === false ? false : true, teamRoles: input.teamRoles,
    acceptedRoleCounts: accepted, duration: input.duration, audience: input.audience,
    isDraft: !input.publish || input.audience === "Solo yo", acceptedMembersCount: existing?.acceptedMembersCount ?? 0,
    createdByName: identity.name || identity.email, teamDeadline: input.teamDeadline || null };
}

function taskFields(projectId: string, task: ProjectWriteInput["tasks"][number], previous?: Row): Row {
  const accepted = typeof previous?.acceptedCount === "number" ? previous.acceptedCount : 0;
  if (task.requiredCount < accepted) throw new ProjectWriteFailure(400, "Una tarea necesita conservar los cupos ya ocupados.");
  const edit = { title: task.title, description: task.description, requiredCount: task.requiredCount, deadline: task.deadline || null };
  return previous ? edit : { projectId, ...edit, acceptedCount: 0, status: "available" };
}

export async function saveRobleProject(config: RobleAuthConfig, token: string, identity: RobleIdentity, input: ProjectWriteInput, projectId?: string): Promise<string> {
  let existing: Row | undefined;
  if (projectId) {
    if (projectId.length > 100) throw new ProjectWriteFailure(404, "Proyecto no disponible.");
    const rows = await readRobleRows(config, token, "projects", { _id: projectId, _owner: identity.userId });
    existing = rows.map(object).find(row => row?._id === projectId && row._owner === identity.userId) ?? undefined;
    if (!existing) throw new ProjectWriteFailure(404, "Proyecto no disponible o no pertenece a tu cuenta.");
  }
  const fields = projectFields(input, identity, existing);
  const currentTasks = projectId ? (await readRobleRows(config, token, "project_tasks", { projectId })).map(object)
    .filter((row): row is Row => !!row && row.projectId === projectId && row._owner === identity.userId) : [];
  const currentById = new Map(currentTasks.map(row => [String(row._id), row]));
  const savedTasks = input.tasks.filter(task => task.title);
  for (const task of savedTasks) {
    const previous = currentById.get(task.id);
    if (projectId && !previous && !/^new-[0-9a-f-]{36}$/i.test(task.id)) {
      throw new ProjectWriteFailure(400, "Una tarea ya no pertenece a este proyecto. Actualiza la página.");
    }
    if (previous) taskFields(projectId!, task, previous);
  }
  for (const row of currentTasks) if (!savedTasks.some(task => task.id === row._id) && Number(row.acceptedCount || 0) > 0) {
    throw new ProjectWriteFailure(400, "No puedes eliminar una tarea con participantes aceptados.");
  }

  let id = projectId;
  if (!id) {
    const created = await writeRobleRow(config, token, "POST", "insert-one", { tableName: "projects", record: {
      ...fields, isDraft: true, createdBy: identity.userId, createdAt: new Date().toISOString(),
    } });
    id = string(created._id);
  }
  try {
    for (const task of savedTasks) {
      const previous = currentById.get(task.id);
      if (previous) await writeRobleRow(config, token, "PUT", "update", { tableName: "project_tasks", idColumn: "_id", idValue: task.id,
        updates: taskFields(id, task, previous) });
      else await writeRobleRow(config, token, "POST", "insert-one", { tableName: "project_tasks", record: taskFields(id, task) });
    }
    for (const row of currentTasks) if (!savedTasks.some(task => task.id === row._id)) {
      await writeRobleRow(config, token, "DELETE", "delete", { tableName: "project_tasks", idColumn: "_id", idValue: row._id });
    }
    await writeRobleRow(config, token, "PUT", "update", { tableName: "projects", idColumn: "_id", idValue: id, updates: fields });
    return id;
  } catch (cause) {
    if (cause instanceof ProjectWriteFailure) throw new ProjectWriteFailure(cause.status, `${cause.message} El proyecto puede tener cambios parciales; ábrelo para comprobarlo.`, id);
    throw new ProjectWriteFailure(503, "No se pudo completar el guardado. Revisa el proyecto antes de reintentar.", id);
  }
}
