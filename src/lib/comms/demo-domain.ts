import type { DemoActor, DemoState } from "@/lib/projects/demo-domain";
import type { NotificationCategory, ProfilesState } from "@/lib/profile/demo-domain";

export type DirectMessage = { id: string; fromUserId: DemoActor; toUserId: DemoActor; text: string; createdAt: string; read: boolean };
export type CommsState = { version: 1; messages: DirectMessage[]; readNotificationIds: Record<DemoActor, string[]> };
export type DemoNotification = { id: string; recipientId: DemoActor; category: NotificationCategory; title: string; body: string; createdAt: string; href: string; icon: "user" | "folder" | "chat" | "check" };
export const initialComms: CommsState = { version: 1, messages: [], readNotificationIds: { "demo-a": [], "demo-b": [] } };
const otherActor = (actor: DemoActor): DemoActor => actor === "demo-a" ? "demo-b" : "demo-a";

export function sendMessage(state: CommsState, profiles: ProfilesState, actor: DemoActor, recipient: DemoActor, text: string, id: string, createdAt: string): CommsState {
  if (actor === recipient) throw new Error("No puedes enviarte mensajes a ti mismo.");
  if (recipient !== otherActor(actor)) throw new Error("Destinatario no disponible.");
  if (profiles.profiles[recipient].contact === "nobody") throw new Error("Esta persona no recibe mensajes.");
  const clean = text.trim();
  if (!clean) throw new Error("Escribe un mensaje.");
  if (clean.length > 1000) throw new Error("El mensaje no puede superar 1000 caracteres.");
  if (state.messages.some(message => message.id === id)) throw new Error("El mensaje ya existe.");
  return { ...state, messages: [...state.messages, { id, fromUserId: actor, toUserId: recipient, text: clean, createdAt, read: false }] };
}
export function thread(state: CommsState, viewer: DemoActor, other: DemoActor): DirectMessage[] {
  return state.messages.filter(message => (message.fromUserId === viewer && message.toUserId === other) || (message.fromUserId === other && message.toUserId === viewer)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function conversations(state: CommsState, viewer: DemoActor, profiles: ProfilesState) {
  return (["demo-a", "demo-b"] as DemoActor[]).filter(other => other !== viewer).flatMap(other => {
    const messages = thread(state, viewer, other), last = messages.at(-1);
    return last ? [{ other, name: profiles.profiles[other].name, last, unreadCount: messages.filter(message => message.toUserId === viewer && !message.read).length }] : [];
  }).sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt));
}
export function markThreadRead(state: CommsState, viewer: DemoActor, other: DemoActor): CommsState {
  const unread = state.messages.filter(message => message.fromUserId === other && message.toUserId === viewer && !message.read);
  if (!unread.length) return state;
  return { ...state, messages: state.messages.map(message => unread.some(item => item.id === message.id) ? { ...message, read: true } : message), readNotificationIds: { ...state.readNotificationIds, [viewer]: [...new Set([...(state.readNotificationIds[viewer] ?? []), ...unread.map(message => `message:${message.id}`)])] } };
}
export function notificationsFor(projects: DemoState, comms: CommsState, profiles: ProfilesState, viewer: DemoActor): DemoNotification[] {
  const items: DemoNotification[] = [];
  for (const project of projects.projects) {
    for (const request of project.requests) {
      const applicant = profiles.profiles[request.applicantId].name;
      items.push({ id: `request:${request.id}`, recipientId: project.ownerId, category: "participationRequests", title: request.type === "task" ? "Nueva postulación a tarea" : "Solicitud para unirse al equipo", body: `${applicant} quiere participar en ${project.name}.`, createdAt: request.createdAt, href: `/proyectos/${project.id}`, icon: "user" });
      if (request.status !== "pending") items.push({ id: `decision:${request.id}`, recipientId: request.applicantId, category: "participationRequests", title: request.status === "accepted" ? "Solicitud aceptada" : "Solicitud rechazada", body: `Tu solicitud para ${project.name} fue ${request.status === "accepted" ? "aceptada" : "rechazada"}.`, createdAt: request.decidedAt ?? request.createdAt, href: `/proyectos/${project.id}`, icon: request.status === "accepted" ? "check" : "folder" });
    }
    for (const comment of project.comments) if (comment.authorId !== project.ownerId) items.push({ id: `comment:${comment.id}`, recipientId: project.ownerId, category: "comments", title: "Comentario en tu proyecto", body: `${profiles.profiles[comment.authorId].name} comentó en ${project.name}.`, createdAt: comment.createdAt, href: `/proyectos/${project.id}`, icon: "chat" });
    for (const task of project.tasks) if (task.status === "completed") for (const request of project.requests) if (request.type === "task" && request.targetId === task.id && request.status === "accepted") items.push({ id: `task:${task.id}:${request.applicantId}`, recipientId: request.applicantId, category: "projectActivity", title: "Tarea completada", body: `${task.title} de ${project.name} se marcó como completada.`, createdAt: task.statusUpdatedAt ?? project.updatedAt, href: `/proyectos/${project.id}`, icon: "check" });
  }
  for (const message of comms.messages) items.push({ id: `message:${message.id}`, recipientId: message.toUserId, category: "messages", title: "Nuevo mensaje", body: `${profiles.profiles[message.fromUserId].name} te envió un mensaje.`, createdAt: message.createdAt, href: `/mensajes/${message.fromUserId}`, icon: "chat" });
  const preference = profiles.profiles[viewer];
  return items.filter(item => item.recipientId === viewer && preference.notificationsEnabled && !preference.mutedNotifications.includes(item.category)).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}
export function markNotificationsRead(state: CommsState, actor: DemoActor, ids: string[], available: DemoNotification[]): CommsState {
  const allowed = new Set(available.filter(item => item.recipientId === actor).map(item => item.id));
  return { ...state, readNotificationIds: { ...state.readNotificationIds, [actor]: [...new Set([...(state.readNotificationIds[actor] ?? []), ...ids.filter(id => allowed.has(id))])] } };
}
