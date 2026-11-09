"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { actors, addComment, decideRequest, requestParticipation, setTaskStatus, toggleFollow, visibleProject, type ProjectTask } from "@/lib/projects/demo-domain";
import { updateDemoWorkspace, useDemoWorkspace } from "@/lib/projects/demo-browser";

const tabs = ["Descripción", "Tareas", "Miembros", "Actividad"] as const;
type Tab = typeof tabs[number];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando proyecto…</main>}><ProjectDetail params={params} /></Suspense>;
}

function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const state = useDemoWorkspace();
  const [tab, setTab] = useState<Tab>("Descripción");
  const [message, setMessage] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const project = process.env.NODE_ENV === "development" ? visibleProject(state, id) : undefined;
  const owner = project?.ownerId === state.actor;
  const act = (action: Parameters<typeof updateDemoWorkspace>[0], success: string) => {
    try { updateDemoWorkspace(action); setError(""); setNotice(success); return true; }
    catch (cause) { setNotice(""); setError(cause instanceof Error ? cause.message : "No se pudo completar la acción."); return false; }
  };
  const apply = (type: "team" | "task", targetId: string) => act(current => requestParticipation(current, id, type, targetId, message, crypto.randomUUID(), new Date().toISOString()), "Solicitud enviada. Cambia a la cuenta creadora para decidir.");
  return <AppShell backHref={owner ? "/mis-proyectos" : "/explorar"}>
    {!project ? <div className="empty-panel"><h1>Proyecto no disponible</h1><p>Solo el creador puede ver sus borradores. Los proyectos reales aparecerán cuando se valide Roble.</p></div> : <>
      <p className="preview-note">Demostración local · Acciones y comentarios guardados solo en este navegador, sin Roble.</p>
      {error && <p className="wizard-error" role="alert">{error}</p>}{notice && <p className="demo-success" role="status">{notice}</p>}
      <div className="project-hero"><span className="project-hero-symbol"><Icon name="leaf" size={56} /></span></div>
      <div className="detail-heading"><span className="project-icon"><Icon name="leaf" size={28} /></span><div><h1>{project.name}</h1><span className="badge">{project.isDraft ? "Borrador" : `${project.members.length} miembros`}</span><p><Link href={`/usuarios/${project.ownerId}`} className="profile-link">Por {actors[project.ownerId]} ›</Link></p></div><div className="detail-heading-actions">{owner ? <Link href={`/proyectos/${id}/editar`} className="outline-action"><Icon name="edit" size={16} /> Editar proyecto</Link> : <button type="button" className="outline-action" onClick={() => act(current => toggleFollow(current, id), project.followers.includes(state.actor) ? "Dejaste de seguir este proyecto." : "Ahora sigues este proyecto.")}>{project.followers.includes(state.actor) ? "Siguiendo" : "Seguir"}</button>}</div></div>
      <div className="detail-tabs" role="tablist" aria-label="Detalle del proyecto">{tabs.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="detail-grid"><section className="detail-main">
        {tab === "Descripción" && <div className="surface-panel"><h2>Sobre el proyecto</h2><p>{project.description || "Idea en preparación."}</p><div className="project-meta">{project.categories.map(category => <span className="category-chip" key={category}>{category}</span>)}</div><p>Duración estimada: {project.duration}</p>{project.teamDeadline && <p>Postulaciones al equipo hasta: {project.teamDeadline}</p>}</div>}
        {tab === "Tareas" && <><h2>Tareas del proyecto</h2>{project.tasks.length === 0 && <div className="empty-panel"><h3>Sin tareas todavía</h3><p>La persona creadora puede agregarlas al editar el proyecto.</p></div>}{project.tasks.map(task => {
          const pending = project.requests.some(request => request.applicantId === state.actor && request.type === "task" && request.targetId === task.id && request.status === "pending");
          const available = task.requiredCount - task.acceptedCount;
          return <div className="surface-panel task-row" key={task.id}><span className="project-icon"><Icon name="folder" /></span><div><h3>{task.title}</h3><p>{task.description}</p><small>{available} cupos disponibles{task.deadline ? ` · Hasta ${task.deadline}` : ""}</small></div><div className="task-actions"><span className="badge success">{task.status === "completed" ? "Completada" : task.status === "in_progress" ? "En progreso" : "Disponible"}</span>{owner ? <label className="task-status-label">Estado<select value={task.status} onChange={event => act(current => setTaskStatus(current, id, task.id, event.target.value as ProjectTask["status"], new Date().toISOString()), "Estado de tarea actualizado en esta demostración.")}><option value="available">Disponible</option><option value="in_progress">En progreso</option><option value="completed">Completada</option></select></label> : <button type="button" className="solid-action" disabled={available <= 0 || pending || project.members.includes(state.actor) || task.status !== "available"} onClick={() => apply("task", task.id)}>{pending ? "Solicitud pendiente" : "Postularme"}</button>}</div></div>;
        })}</>}
        {tab === "Miembros" && <><h2>Equipo necesario</h2><div className="content-grid">{Object.entries(project.teamRoles).map(([role, count]) => {
          const available = count - (project.acceptedRoleCounts[role] || 0);
          const pending = project.requests.some(request => request.applicantId === state.actor && request.type === "team" && request.targetId === role && request.status === "pending");
          return <div className="surface-panel role-card" key={role}><Icon name="user" /><h3>{role}</h3><p>{available} de {count} cupos disponibles</p>{!owner && <button type="button" className="solid-action" disabled={available <= 0 || pending || project.members.includes(state.actor)} onClick={() => apply("team", role)}>{pending ? "Solicitud pendiente" : "Unirme al equipo"}</button>}</div>;
        })}</div>{Object.keys(project.teamRoles).length === 0 && <div className="empty-panel"><p>Este proyecto aún no definió roles.</p></div>}{project.members.length > 0 && <div className="surface-panel"><h2>Miembros</h2>{project.members.map(member => <p key={member}><Link href={`/usuarios/${member}`} className="profile-link">{actors[member]} ›</Link></p>)}</div>}</>}
        {tab === "Actividad" && <><h2>Comentarios</h2>{project.comments.length === 0 ? <div className="empty-panel"><p>Aún no hay comentarios.</p></div> : project.comments.map(item => <article className="surface-panel" key={item.id}><h3><Link href={`/usuarios/${item.authorId}`} className="profile-link">{actors[item.authorId]}</Link></h3><p>{item.text}</p><small>{new Date(item.createdAt).toLocaleDateString("es-CO")}</small></article>)}<form className="surface-panel comment-form" onSubmit={event => { event.preventDefault(); if (act(current => addComment(current, id, comment, crypto.randomUUID(), new Date().toISOString()), "Comentario agregado en esta demostración.")) setComment(""); }}><label htmlFor="project-comment">Añadir comentario</label><textarea id="project-comment" value={comment} onChange={event => setComment(event.target.value)} rows={3} /><button type="submit" className="solid-action">Comentar</button></form></>}
      </section><aside className="surface-panel detail-aside"><h2>Información rápida</h2><div className="project-meta"><span className="category-chip">{project.members.length} miembros</span><span className="category-chip">{project.tasks.length} tareas</span><span className="category-chip">{project.requests.filter(item => item.status === "pending").length} solicitudes</span></div>{!owner && <label className="demo-message-label">Mensaje para tu solicitud<textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Cuéntale al equipo por qué quieres participar" rows={3} /></label>}{owner && <><h3>Solicitudes pendientes</h3>{project.requests.filter(request => request.status === "pending").length === 0 ? <p>No hay solicitudes pendientes.</p> : project.requests.filter(request => request.status === "pending").map(request => <div className="request-card" key={request.id}><strong>{actors[request.applicantId]}</strong><small>{request.type === "team" ? `Equipo: ${request.targetId}` : `Tarea: ${project.tasks.find(task => task.id === request.targetId)?.title ?? "Tarea"}`}</small>{request.message && <p>{request.message}</p>}<div><button type="button" className="solid-action" onClick={() => act(current => decideRequest(current, id, request.id, "accepted", new Date().toISOString()), "Solicitud aceptada; cupo y miembros actualizados.")}>Aceptar</button><button type="button" className="outline-action" onClick={() => act(current => decideRequest(current, id, request.id, "rejected", new Date().toISOString()), "Solicitud rechazada.")}>Rechazar</button></div></div>)}</>}</aside></div>
    </>}
  </AppShell>;
}
