export type DemoActor = "demo-a" | "demo-b";
export type ProjectTask = { id: string; title: string; description: string; requiredCount: number; acceptedCount: number; deadline: string; status: "available" | "in_progress" | "completed"; statusUpdatedAt?: string };
export type ProjectRequest = { id: string; projectId: string; applicantId: DemoActor; type: "team" | "task"; targetId: string; message: string; status: "pending" | "accepted" | "rejected"; createdAt: string; decidedAt?: string };
export type ProjectComment = { id: string; authorId: DemoActor; text: string; createdAt: string };
export type ProjectRecord = {
  id: string; ownerId: DemoActor; name: string; description: string; categories: string[];
  audience: "Solo yo" | "Toda la comunidad"; isDraft: boolean; duration: string;
  teamRoles: Record<string, number>; acceptedRoleCounts: Record<string, number>; teamDeadline: string;
  tasks: ProjectTask[]; requests: ProjectRequest[]; comments: ProjectComment[]; followers: DemoActor[]; members: DemoActor[];
  createdAt: string; updatedAt: string;
};
export type ProjectInput = Pick<ProjectRecord, "name" | "description" | "categories" | "audience" | "duration" | "teamRoles" | "teamDeadline" | "tasks">;
export type DemoState = { version: 1; actor: DemoActor; projects: ProjectRecord[] };

export const actors: Record<DemoActor, string> = { "demo-a": "Cuenta de prueba A", "demo-b": "Cuenta de prueba B" };
const now = "2026-11-08T12:00:00.000Z";
export const emptyState: DemoState = { version: 1, actor: "demo-a", projects: [] };
export const initialState: DemoState = {
  version: 1, actor: "demo-a",
  projects: [
    { id: "eco-campus", ownerId: "demo-a", name: "EcoCampus", description: "Diseñemos juntos un campus más sostenible.", categories: ["Medio ambiente", "Impacto social"], audience: "Toda la comunidad", isDraft: false, duration: "Meses", teamRoles: { "Diseñador/a": 1, "Desarrollador/a": 2 }, acceptedRoleCounts: {}, teamDeadline: "", tasks: [{ id: "task-eco-1", title: "Planear la primera jornada", description: "Organizar actividades para el campus.", requiredCount: 2, acceptedCount: 0, deadline: "", status: "available" }], requests: [], comments: [], followers: [], members: [], createdAt: now, updatedAt: now },
    { id: "green-lab", ownerId: "demo-b", name: "GreenLab", description: "Laboratorio estudiantil de soluciones ambientales de bajo costo.", categories: ["Medio ambiente", "Tecnología"], audience: "Toda la comunidad", isDraft: false, duration: "Semanas", teamRoles: { "Investigador/a": 2 }, acceptedRoleCounts: {}, teamDeadline: "", tasks: [], requests: [], comments: [], followers: [], members: [], createdAt: now, updatedAt: now },
    { id: "quiz-pro", ownerId: "demo-b", name: "QuizPro", description: "Aplicación web para crear actividades de aprendizaje.", categories: ["Innovación", "Educación"], audience: "Toda la comunidad", isDraft: false, duration: "Meses", teamRoles: { "Desarrollador/a": 1 }, acceptedRoleCounts: {}, teamDeadline: "", tasks: [], requests: [], comments: [], followers: [], members: [], createdAt: now, updatedAt: now },
  ],
};

export function publicProjects(state: DemoState): ProjectRecord[] { return state.projects.filter(project => !project.isDraft && project.audience === "Toda la comunidad"); }
export function ownedProjects(state: DemoState): ProjectRecord[] { return state.projects.filter(project => project.ownerId === state.actor); }
export function visibleProject(state: DemoState, id: string): ProjectRecord | undefined {
  const project = state.projects.find(item => item.id === id);
  return project && (project.ownerId === state.actor || (!project.isDraft && project.audience === "Toda la comunidad")) ? project : undefined;
}
export function setActor(state: DemoState, actor: DemoActor): DemoState { return { ...state, actor }; }

export function saveProject(state: DemoState, input: ProjectInput, id: string, publish: boolean, timestamp: string): DemoState {
  const name = input.name.trim();
  if (!name) throw new Error("Escribe el nombre de la idea.");
  if (publish && !input.description.trim()) throw new Error("Añade una descripción antes de publicar.");
  if (publish && input.tasks.some(task => !task.title.trim())) throw new Error("Pon título a todas las tareas antes de publicar.");
  const existing = state.projects.find(project => project.id === id);
  if (existing && existing.ownerId !== state.actor) throw new Error("Solo quien creó el proyecto puede editarlo.");
  if (existing && Object.entries(existing.acceptedRoleCounts).some(([role, count]) => (input.teamRoles[role] ?? 0) < count)) throw new Error("Un rol no puede tener menos cupos que miembros aceptados.");
  if (existing && existing.tasks.some(task => task.acceptedCount > 0 && !input.tasks.some(item => item.id === task.id))) throw new Error("No puedes eliminar una tarea con participantes aceptados.");
  const cleanedTasks = input.tasks.map(task => {
    const previous = existing?.tasks.find(item => item.id === task.id);
    const requestedCount = Math.floor(task.requiredCount);
    if (previous && requestedCount < previous.acceptedCount) throw new Error("La tarea necesita conservar los cupos ya aceptados.");
    const requiredCount = Math.max(1, Number.isFinite(requestedCount) ? requestedCount : 1);
    return { ...task, title: task.title.trim(), description: task.description.trim(), requiredCount, acceptedCount: previous?.acceptedCount ?? 0, status: previous?.status ?? "available" as const, statusUpdatedAt: previous?.statusUpdatedAt };
  });
  const isDraft = !publish || input.audience === "Solo yo";
  const project: ProjectRecord = {
    id, ownerId: state.actor, name, description: input.description.trim(), categories: input.categories.map(item => item.trim()).filter(Boolean),
    audience: input.audience, isDraft, duration: input.duration, teamRoles: Object.fromEntries(Object.entries(input.teamRoles).filter(([, count]) => count > 0)),
    acceptedRoleCounts: existing?.acceptedRoleCounts ?? {}, teamDeadline: input.teamDeadline, tasks: cleanedTasks,
    requests: existing?.requests ?? [], comments: existing?.comments ?? [], followers: existing?.followers ?? [], members: existing?.members ?? [],
    createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
  };
  return { ...state, projects: existing ? state.projects.map(item => item.id === id ? project : item) : [project, ...state.projects] };
}
export function deleteProject(state: DemoState, id: string): DemoState {
  const project = state.projects.find(item => item.id === id);
  if (!project || project.ownerId !== state.actor) throw new Error("Solo quien creó el proyecto puede eliminarlo.");
  return { ...state, projects: state.projects.filter(item => item.id !== id) };
}
export function toggleFollow(state: DemoState, id: string): DemoState {
  const project = visibleProject(state, id);
  if (!project || project.isDraft) throw new Error("Proyecto no disponible.");
  return { ...state, projects: state.projects.map(item => item.id === id ? { ...item, followers: item.followers.includes(state.actor) ? item.followers.filter(actor => actor !== state.actor) : [...item.followers, state.actor] } : item) };
}
export function addComment(state: DemoState, id: string, text: string, commentId: string, timestamp: string): DemoState {
  const project = visibleProject(state, id);
  if (!project || project.isDraft) throw new Error("Proyecto no disponible.");
  if (!text.trim()) throw new Error("Escribe un comentario.");
  return { ...state, projects: state.projects.map(item => item.id === id ? { ...item, comments: [...item.comments, { id: commentId, authorId: state.actor, text: text.trim(), createdAt: timestamp }] } : item) };
}
export function requestParticipation(state: DemoState, id: string, type: "team" | "task", targetId: string, message: string, requestId: string, timestamp: string): DemoState {
  const project = visibleProject(state, id);
  if (!project || project.isDraft) throw new Error("Proyecto no disponible.");
  if (project.ownerId === state.actor) throw new Error("No puedes solicitar entrar en tu propio proyecto.");
  if (project.members.includes(state.actor)) throw new Error("Ya eres miembro de este proyecto.");
  if (type === "team" && project.teamDeadline && project.teamDeadline < timestamp.slice(0, 10)) throw new Error("La convocatoria del equipo ya terminó.");
  const task = type === "task" ? project.tasks.find(item => item.id === targetId) : undefined;
  if (type === "task" && (!task || task.status !== "available" || (task.deadline && task.deadline < timestamp.slice(0, 10)))) throw new Error("La tarea ya no está disponible.");
  if (project.requests.some(item => item.applicantId === state.actor && item.type === type && item.targetId === targetId && item.status === "pending")) throw new Error("Ya tienes una solicitud pendiente para este cupo.");
  const available = type === "team" ? (project.teamRoles[targetId] ?? 0) - (project.acceptedRoleCounts[targetId] ?? 0) : (project.tasks.find(task => task.id === targetId)?.requiredCount ?? 0) - (project.tasks.find(task => task.id === targetId)?.acceptedCount ?? 0);
  if (available <= 0) throw new Error("No quedan cupos disponibles.");
  const request: ProjectRequest = { id: requestId, projectId: id, applicantId: state.actor, type, targetId, message: message.trim(), status: "pending", createdAt: timestamp };
  return { ...state, projects: state.projects.map(item => item.id === id ? { ...item, requests: [...item.requests, request] } : item) };
}
export function decideRequest(state: DemoState, projectId: string, requestId: string, decision: "accepted" | "rejected", timestamp?: string): DemoState {
  const project = state.projects.find(item => item.id === projectId);
  if (!project || project.ownerId !== state.actor) throw new Error("Solo quien creó el proyecto puede decidir.");
  const request = project.requests.find(item => item.id === requestId);
  if (!request || request.status !== "pending") throw new Error("La solicitud ya fue atendida.");
  if (decision === "accepted") {
    if (project.members.includes(request.applicantId)) throw new Error("La persona ya es miembro.");
    const available = request.type === "team" ? (project.teamRoles[request.targetId] ?? 0) - (project.acceptedRoleCounts[request.targetId] ?? 0) : (project.tasks.find(task => task.id === request.targetId)?.requiredCount ?? 0) - (project.tasks.find(task => task.id === request.targetId)?.acceptedCount ?? 0);
    if (available <= 0) throw new Error("No quedan cupos disponibles.");
  }
  const updated: ProjectRecord = {
    ...project, updatedAt: timestamp ?? project.updatedAt, requests: project.requests.map(item => item.id === requestId ? { ...item, status: decision, decidedAt: timestamp ?? item.createdAt } : item),
    members: decision === "accepted" ? [...project.members, request.applicantId] : project.members,
    acceptedRoleCounts: decision === "accepted" && request.type === "team" ? { ...project.acceptedRoleCounts, [request.targetId]: (project.acceptedRoleCounts[request.targetId] ?? 0) + 1 } : project.acceptedRoleCounts,
    tasks: decision === "accepted" && request.type === "task" ? project.tasks.map(task => task.id === request.targetId ? { ...task, acceptedCount: task.acceptedCount + 1 } : task) : project.tasks,
  };
  return { ...state, projects: state.projects.map(item => item.id === projectId ? updated : item) };
}
export function setTaskStatus(state: DemoState, projectId: string, taskId: string, status: ProjectTask["status"], timestamp?: string): DemoState {
  const project = state.projects.find(item => item.id === projectId);
  if (!project || project.ownerId !== state.actor) throw new Error("Solo quien creó el proyecto puede actualizar tareas.");
  if (!project.tasks.some(task => task.id === taskId)) throw new Error("Tarea no encontrada.");
  return { ...state, projects: state.projects.map(item => item.id === projectId ? { ...item, updatedAt: timestamp ?? item.updatedAt, tasks: item.tasks.map(task => task.id === taskId ? { ...task, status, statusUpdatedAt: timestamp ?? task.statusUpdatedAt ?? item.updatedAt } : task) } : item) };
}
