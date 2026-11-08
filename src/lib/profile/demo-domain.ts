import type { DemoActor, DemoState } from "@/lib/projects/demo-domain";

export type NotificationCategory = "messages" | "projectActivity" | "participationRequests" | "comments" | "reminders" | "platformNews";
export const notificationCategories: { id: NotificationCategory; label: string }[] = [
  { id: "messages", label: "Mensajes" }, { id: "projectActivity", label: "Actividad de proyectos" },
  { id: "participationRequests", label: "Solicitudes de participación" }, { id: "comments", label: "Comentarios" },
  { id: "reminders", label: "Recordatorios" }, { id: "platformNews", label: "Novedades de la plataforma" },
];
export type DemoProfile = {
  userId: DemoActor; name: string; email: string; username: string; bio: string; career: string; avatarIcon: string;
  visibility: "public" | "private"; contact: "everyone" | "nobody"; activityVisibility: "onlyMe" | "everyone";
  notificationsEnabled: boolean; mutedNotifications: NotificationCategory[]; updatedAt: string;
};
export type ProfilesState = { version: 1; profiles: Record<DemoActor, DemoProfile> };
const seed = (userId: DemoActor, name: string, username: string): DemoProfile => ({
  userId, name, username, email: `${username}@example.invalid`, bio: "", career: "", avatarIcon: "sprout",
  visibility: "public", contact: "everyone", activityVisibility: "everyone", notificationsEnabled: true,
  mutedNotifications: [], updatedAt: "2026-11-08T12:00:00.000Z",
});
export const initialProfiles: ProfilesState = { version: 1, profiles: {
  "demo-a": seed("demo-a", "Cuenta de prueba A", "cuenta_a"),
  "demo-b": seed("demo-b", "Cuenta de prueba B", "cuenta_b"),
} };

function ownProfile(state: ProfilesState, actor: DemoActor, target: DemoActor): DemoProfile {
  if (actor !== target) throw new Error("Solo puedes cambiar tu propio perfil.");
  return state.profiles[target];
}
function replace(state: ProfilesState, profile: DemoProfile): ProfilesState {
  return { ...state, profiles: { ...state.profiles, [profile.userId]: profile } };
}
export function saveProfile(state: ProfilesState, actor: DemoActor, target: DemoActor, fields: Pick<DemoProfile, "name" | "username" | "bio" | "career" | "avatarIcon">, now: string): ProfilesState {
  const previous = ownProfile(state, actor, target);
  const name = fields.name.trim(), username = fields.username.trim().replace(/^@/, "");
  if (name.length < 2) throw new Error("Escribe un nombre de al menos dos caracteres.");
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) throw new Error("El usuario debe tener entre 3 y 24 letras, números o guiones bajos.");
  if (Object.values(state.profiles).some(profile => profile.userId !== actor && profile.username.toLowerCase() === username.toLowerCase())) throw new Error("Ese usuario ya está en uso en esta demostración.");
  if (fields.bio.length > 280) throw new Error("La biografía no puede superar 280 caracteres.");
  return replace(state, { ...previous, name, username, bio: fields.bio.trim(), career: fields.career.trim(), avatarIcon: fields.avatarIcon, updatedAt: now });
}
export function savePrivacy(state: ProfilesState, actor: DemoActor, target: DemoActor, fields: Pick<DemoProfile, "visibility" | "contact" | "activityVisibility">, now: string): ProfilesState {
  const previous = ownProfile(state, actor, target);
  if (!["public", "private"].includes(fields.visibility) || !["everyone", "nobody"].includes(fields.contact) || !["onlyMe", "everyone"].includes(fields.activityVisibility)) throw new Error("Preferencias de privacidad no válidas.");
  return replace(state, { ...previous, ...fields, updatedAt: now });
}
export function saveNotifications(state: ProfilesState, actor: DemoActor, target: DemoActor, enabled: boolean, muted: NotificationCategory[], now: string): ProfilesState {
  const previous = ownProfile(state, actor, target);
  const allowed = new Set(notificationCategories.map(item => item.id));
  if (muted.some(id => !allowed.has(id))) throw new Error("Categoría de notificación no válida.");
  return replace(state, { ...previous, notificationsEnabled: enabled, mutedNotifications: [...new Set(muted)], updatedAt: now });
}
export function visibleProfile(state: ProfilesState, viewer: DemoActor, target: DemoActor): Omit<DemoProfile, "email" | "notificationsEnabled" | "mutedNotifications"> | null {
  const { email: _email, notificationsEnabled: _enabled, mutedNotifications: _muted, ...profile } = state.profiles[target];
  void _email; void _enabled; void _muted;
  return viewer === target || profile.visibility === "public" ? profile : null;
}
export function trajectory(state: DemoState, actor: DemoActor) {
  const projectsCreated = state.projects.filter(project => project.ownerId === actor).length;
  const participations = state.projects.filter(project => project.members.includes(actor)).length;
  const comments = state.projects.reduce((count, project) => count + project.comments.filter(comment => comment.authorId === actor).length, 0);
  const requests = state.projects.flatMap(project => project.requests.filter(request => request.applicantId === actor));
  const requestsSent = requests.length, requestsAccepted = requests.filter(request => request.status === "accepted").length;
  const acceptedTasks = state.projects.flatMap(project => project.requests.filter(request => request.applicantId === actor && request.type === "task" && request.status === "accepted").map(request => project.tasks.find(task => task.id === request.targetId)));
  const tasksAssigned = acceptedTasks.length, tasksCompleted = acceptedTasks.filter(task => task?.status === "completed").length;
  const collaboration = Math.min(1, (participations * 2 + projectsCreated * 2 + comments) / 10);
  const fulfillment = tasksAssigned ? tasksCompleted / tasksAssigned : 0;
  const quality = requestsSent ? requestsAccepted / requestsSent : 0;
  const mean = (collaboration + fulfillment + quality) / 3;
  const commitment = projectsCreated + participations + comments + requestsSent === 0 ? "Nuevo" : mean >= .6 ? "Alto" : mean >= .3 ? "Medio" : "Bajo";
  return { projectsCreated, projectsCompleted: 0, participations, comments, requestsSent, requestsAccepted, tasksAssigned, tasksCompleted, collaboration, fulfillment, quality, commitment };
}
