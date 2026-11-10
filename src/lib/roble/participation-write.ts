import type { RobleAuthConfig, RobleIdentity } from "./auth";
import { readRobleRows } from "./own-projects.ts";
import { ProjectWriteFailure, writeRobleRow } from "./project-write.ts";

type Row = Record<string, unknown>;
const row = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const count = (value: unknown): number => Number.isFinite(Number(value)) ? Math.max(0, Math.trunc(Number(value))) : 0;
const jsonRow = (value: unknown): Row => {
  if (typeof value === "string") { try { return row(JSON.parse(value)) ?? {}; } catch { return {}; } }
  return row(value) ?? {};
};
const validId = (value: string): boolean => !!value && value.length <= 100;
const beforeDeadline = (value: unknown): boolean => !text(value) || text(value).slice(0, 10) >= new Date().toISOString().slice(0, 10);

async function project(config: RobleAuthConfig, token: string, id: string): Promise<Row> {
  if (!validId(id)) throw new ProjectWriteFailure(404, "Proyecto no disponible.");
  const rows = await readRobleRows(config, token, "projects", { _id: id });
  const found = rows.map(row).find(item => item?._id === id && text(item._owner));
  if (!found) throw new ProjectWriteFailure(404, "Proyecto no disponible.");
  return found;
}

async function rows(config: RobleAuthConfig, token: string, table: string, filters: Record<string, string>): Promise<Row[]> {
  return (await readRobleRows(config, token, table, filters)).map(row).filter((item): item is Row => !!item);
}

async function notify(config: RobleAuthConfig, token: string, recipient: string, projectId: string, requestId: string, type: string, title: string, message: string): Promise<void> {
  try {
    await writeRobleRow(config, token, "POST", "insert-one", { tableName: "app_notifications", record: {
      recipientUserId: recipient, projectId, requestId, type, title, message, read: false, createdAt: new Date().toISOString(),
    } });
  } catch { /* Mobile also treats a notification failure as non-fatal after the main action. */ }
}

function latestDecision(decisions: Row[], requestId: string, ownerId: string): Row | undefined {
  return decisions.filter(item => item.requestId === requestId && item._owner === ownerId)
    .sort((a, b) => (Date.parse(text(b.decidedAt)) || 0) - (Date.parse(text(a.decidedAt)) || 0))[0];
}

export async function submitRobleRequest(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string, body: Row): Promise<string> {
  const type = body.type, targetId = text(body.targetId), message = text(body.message);
  if ((type !== "team" && type !== "task") || !validId(targetId) || message.length > 1000) {
    throw new ProjectWriteFailure(400, "Selecciona un cupo válido y revisa el mensaje.");
  }
  const p = await project(config, token, projectId);
  const owner = text(p._owner);
  if (text(p.deletedAt) || (p.isDraft !== false && p.isDraft !== "false") || p.audience !== "Toda la comunidad" || p.canApply === false || p.canApply === "false") {
    throw new ProjectWriteFailure(404, "Este proyecto no recibe solicitudes.");
  }
  if (owner === identity.userId) throw new ProjectWriteFailure(400, "No puedes postularte a tu propio proyecto.");
  let role = targetId;
  if (type === "team") {
    const roles = jsonRow(p.teamRoles), accepted = jsonRow(p.acceptedRoleCounts);
    if (count(roles[targetId]) <= count(accepted[targetId]) || !beforeDeadline(p.teamDeadline)) {
      throw new ProjectWriteFailure(409, "La convocatoria para este rol ya cerró o no tiene cupos.");
    }
  } else {
    const tasks = await rows(config, token, "project_tasks", { projectId });
    const task = tasks.find(item => item._id === targetId && item.projectId === projectId && item._owner === owner);
    if (!task || text(task.visibility) === "team" || !text(task.title) || text(task.status) !== "available" || count(task.requiredCount) <= count(task.acceptedCount) || !beforeDeadline(task.deadline)) {
      throw new ProjectWriteFailure(409, "La postulación a esta tarea ya cerró o no tiene cupos.");
    }
    role = text(task.title);
  }
  const previous = await rows(config, token, "project_requests", { projectId, applicantUserId: identity.userId });
  const matching = previous.filter(item => item.projectId === projectId && item.applicantUserId === identity.userId &&
    (!text(item._owner) || item._owner === identity.userId) &&
    (type === "team" ? item.type === "team" && (item.teamRoleId === targetId || item.role === targetId) : item.type === "task" && item.taskId === targetId));
  if (matching.length) {
    const decisions = await rows(config, token, "request_decisions", {});
    if (matching.some(item => {
      const decision = latestDecision(decisions, text(item._id), owner);
      const status = text(decision?.status) || text(item.status);
      return status !== "rejected";
    })) throw new ProjectWriteFailure(409, "Ya tienes una solicitud para este cupo.");
  }
  const now = new Date().toISOString();
  const created = await writeRobleRow(config, token, "POST", "insert-one", { tableName: "project_requests", record: {
    projectId, type, taskId: type === "task" ? targetId : null, teamRoleId: type === "team" ? targetId : null,
    role, message, applicantUserId: identity.userId, applicantName: identity.name || identity.email || "Usuario interesado",
    applicantEmail: identity.email || null, status: "pending", createdAt: now, updatedAt: now,
  } });
  const requestId = text(created._id);
  await notify(config, token, owner, projectId, requestId, type === "task" ? "task_application" : "new_request",
    type === "task" ? "Nueva postulación a tarea" : "Solicitud para unirse al equipo",
    type === "task" ? `${identity.name || "Una persona"} se postuló a la tarea ${role}.` : `${identity.name || "Una persona"} quiere unirse a tu proyecto ${text(p.name)}.`);
  return requestId;
}

export async function decideRobleRequest(config: RobleAuthConfig, token: string, identity: RobleIdentity, projectId: string, requestId: string, decision: unknown): Promise<void> {
  if (!validId(requestId) || (decision !== "accepted" && decision !== "rejected")) throw new ProjectWriteFailure(400, "Decisión inválida.");
  const p = await project(config, token, projectId);
  const owner = text(p._owner);
  if (text(p.deletedAt)) throw new ProjectWriteFailure(404, "Este proyecto fue eliminado en la app móvil.");
  if (owner !== identity.userId) throw new ProjectWriteFailure(404, "Solo quien creó el proyecto puede resolver solicitudes.");
  const requests = await rows(config, token, "project_requests", { _id: requestId, projectId });
  const request = requests.find(item => item._id === requestId && item.projectId === projectId &&
    (!text(item._owner) || item._owner === item.applicantUserId));
  if (!request || !text(request.applicantUserId) || request.applicantUserId === owner) throw new ProjectWriteFailure(404, "Solicitud no disponible.");
  const decisions = await rows(config, token, "request_decisions", { requestId });
  if (latestDecision(decisions, requestId, owner) || (text(request.status) && request.status !== "pending")) {
    throw new ProjectWriteFailure(409, "Esta solicitud ya fue resuelta.");
  }
  const applicant = text(request.applicantUserId), role = text(request.role), type = request.type === "task" ? "task" : "team";
  if (!role) throw new ProjectWriteFailure(400, "La solicitud no tiene un rol válido.");
  if (decision === "accepted") {
    const members = await rows(config, token, "project_members", { projectId });
    const ownedMembers = members.filter(item => item.projectId === projectId && item._owner === owner);
    const sourceId = type === "task" ? text(request.taskId) : text(request.teamRoleId) || role;
    const same = ownedMembers.find(item => item.userId === applicant && item.role === role && item.sourceType === type && item.sourceId === sourceId);
    const otherMembership = ownedMembers.some(item => item.userId === applicant && item.role === role && item !== same);
    if (otherMembership) throw new ProjectWriteFailure(409, "Esta persona ya ocupa ese rol.");
    const acceptedRoles = jsonRow(p.acceptedRoleCounts);
    let task: Row | undefined;
    if (type === "team") {
      const roles = jsonRow(p.teamRoles);
      if (!same && count(roles[sourceId]) <= count(acceptedRoles[sourceId])) throw new ProjectWriteFailure(409, "Ya no quedan cupos para este rol.");
    } else {
      const tasks = await rows(config, token, "project_tasks", { projectId });
      task = tasks.find(item => item._id === sourceId && item.projectId === projectId && item._owner === owner);
      if (!task || (!same && count(task.requiredCount) <= count(task.acceptedCount))) throw new ProjectWriteFailure(409, "Ya no quedan cupos para esta tarea.");
    }
    try {
      if (!same) {
        await writeRobleRow(config, token, "POST", "insert-one", { tableName: "project_members", record: {
          projectId, userId: applicant, name: text(request.applicantName) || "Miembro", email: text(request.applicantEmail) || null,
          role, joinedAt: new Date().toISOString(), sourceType: type, sourceId,
        } });
      }
      const refreshed = await rows(config, token, "project_members", { projectId });
      const current = refreshed.filter(item => item.projectId === projectId && item._owner === owner);
      const unique = new Set(current.filter(item => text(item.userId) && text(item.role))
        .map(item => `${text(item.userId)}|${text(item.role)}`));
      const projectUpdates: Row = { acceptedMembersCount: Math.max(count(p.acceptedMembersCount), unique.size) };
      if (type === "team") {
        const roleMembers = current.filter(item => item.sourceType === "team" && item.sourceId === sourceId);
        projectUpdates.acceptedRoleCounts = { ...acceptedRoles, [sourceId]: Math.max(count(acceptedRoles[sourceId]), roleMembers.length) };
      } else if (task) {
        const taskMembers = current.filter(item => item.sourceType === "task" && item.sourceId === sourceId);
        await writeRobleRow(config, token, "PUT", "update", { tableName: "project_tasks", idColumn: "_id", idValue: task._id,
          updates: { acceptedCount: Math.max(count(task.acceptedCount), taskMembers.length) } });
      }
      await writeRobleRow(config, token, "PUT", "update", { tableName: "projects", idColumn: "_id", idValue: projectId, updates: projectUpdates });
      await writeRobleRow(config, token, "POST", "insert-one", { tableName: "request_decisions", record: {
        requestId, status: "accepted", decidedAt: new Date().toISOString(),
      } });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "No se completó la decisión.";
      throw new ProjectWriteFailure(503, `${message} Revisa los miembros y cupos antes de reintentar; puede haber cambios parciales.`, projectId);
    }
  } else {
    await writeRobleRow(config, token, "POST", "insert-one", { tableName: "request_decisions", record: {
      requestId, status: "rejected", decidedAt: new Date().toISOString(),
    } });
  }
  await notify(config, token, applicant, projectId, requestId,
    type === "task" ? `task_application_${decision}` : `request_${decision}`,
    decision === "accepted" ? "Solicitud aceptada" : "Solicitud rechazada",
    decision === "accepted" ? `Tu solicitud para ${text(p.name)} fue aceptada.` : `Tu solicitud para ${text(p.name)} no fue aceptada.`);
}

export async function markRobleNotificationRead(config: RobleAuthConfig, token: string, identity: RobleIdentity, id: string): Promise<void> {
  if (!validId(id)) throw new ProjectWriteFailure(404, "Aviso no disponible.");
  const notifications = await rows(config, token, "app_notifications", { _id: id, recipientUserId: identity.userId });
  const notification = notifications.find(item => item._id === id && item.recipientUserId === identity.userId);
  if (!notification) throw new ProjectWriteFailure(404, "Aviso no disponible.");
  if (notification.read === true || notification.read === "true") return;
  await writeRobleRow(config, token, "PUT", "update", { tableName: "app_notifications", idColumn: "_id", idValue: id,
    updates: { read: true } });
}
