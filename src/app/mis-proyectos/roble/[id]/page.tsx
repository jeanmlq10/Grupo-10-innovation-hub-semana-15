"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { RobleProjectFiles } from "@/components/RobleProjectFiles";
import type { OwnRobleProjectDetail } from "@/lib/roble/own-project-detail";

const tabs = ["Descripción", "Tareas", "Miembros", "Solicitudes"] as const;
type Tab = typeof tabs[number];

function dateLabel(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export default function OwnRobleProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando proyecto…</main>}><OwnRobleProject params={params} /></Suspense>;
}

function OwnRobleProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<OwnRobleProjectDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "missing" | "error">("loading");
  const [tab, setTab] = useState<Tab>("Descripción");
  const [busyRequestId, setBusyRequestId] = useState("");
  const [busyTaskId, setBusyTaskId] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/projects/mine/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (response.status === 404) { setStatus("missing"); return; }
        if (!response.ok) { setStatus("error"); return; }
        const body: { project: OwnRobleProjectDetail } = await response.json();
        if (active) { setProject(body.project); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [id]);

  const pending = project?.requests.filter(request => request.status === "pending") ?? [];

  const changeTaskStatus = async (taskId: string, nextStatus: "available" | "in_progress" | "completed") => {
    if (busyTaskId || deleting) return;
    setBusyTaskId(taskId); setActionError(""); setActionSuccess("");
    try {
      const response = await fetch(`/api/projects/mine/${encodeURIComponent(id)}/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }),
      });
      const body: { error?: string } = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo actualizar la tarea.");
      setProject(current => current ? { ...current, tasks: current.tasks.map(task => task.id === taskId ? { ...task, status: nextStatus } : task) } : current);
      setActionSuccess("Estado de la tarea guardado en Roble.");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "No se pudo actualizar la tarea."); }
    finally { setBusyTaskId(""); }
  };

  const deleteProject = async () => {
    if (deleting || !project || !window.confirm(`¿Eliminar «${project.name}»? Dejará de aparecer en móvil y web.`)) return;
    setDeleting(true); setActionError(""); setActionSuccess("");
    try {
      const response = await fetch(`/api/projects/mine/${encodeURIComponent(id)}/delete`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const body: { error?: string } = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo eliminar el proyecto.");
      router.replace("/mis-proyectos/roble");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "No se pudo eliminar el proyecto."); setDeleting(false); }
  };

  const decide = async (requestId: string, decision: "accepted" | "rejected") => {
    if (busyRequestId) return;
    setBusyRequestId(requestId); setActionError(""); setActionSuccess("");
    try {
      const response = await fetch(`/api/projects/mine/${encodeURIComponent(id)}/requests/${encodeURIComponent(requestId)}/decision`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision }),
      });
      const body: { error?: string } = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo resolver la solicitud.");
      const refreshed = await fetch(`/api/projects/mine/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" });
      if (!refreshed.ok) throw new Error("La decisión se guardó, pero no pudimos actualizar la vista. Recarga la página.");
      const detail: { project: OwnRobleProjectDetail } = await refreshed.json();
      setProject(detail.project);
      setActionSuccess(decision === "accepted" ? "Solicitud aceptada. Revisa el equipo y los cupos." : "Solicitud rechazada.");
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : "No se pudo resolver la solicitud."); }
    finally { setBusyRequestId(""); }
  };

  return <AppShell backHref="/mis-proyectos/roble">
    <p className="preview-note">Datos reales de Roble · Guardado disponible solo en desarrollo.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="folder" size={36} /><h1>Consultando proyecto…</h1></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h1>Inicia sesión para continuar</h1><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "missing" && <div className="empty-panel"><Icon name="folder" size={36} /><h1>Proyecto no disponible</h1><p>Solo puedes consultar proyectos de tu cuenta.</p><Link href="/mis-proyectos/roble" className="outline-action">Volver a mis proyectos</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><Icon name="folder" size={36} /><h1>No pudimos consultar Roble</h1><p>Inténtalo de nuevo más tarde. Tus datos no se han modificado.</p><Link href="/mis-proyectos/roble" className="outline-action">Volver a mis proyectos</Link></div>}
    {status === "ready" && project && <>
      <RobleProjectFiles projectId={id} />
      <div className="detail-heading"><span className="project-icon"><Icon name="leaf" size={28} /></span><div><h1>{project.name}</h1><span className={`badge ${project.isDraft ? "" : "success"}`}>{project.isDraft ? "Borrador" : project.audience === "Toda la comunidad" ? "Publicado" : "Privado"}</span></div><Link href={`/mis-proyectos/roble/${encodeURIComponent(id)}/editar`} className="outline-action">Editar proyecto</Link></div>
      {actionError && <p role="alert" className="wizard-error">{actionError}</p>}{actionSuccess && <p role="status" className="preview-note">{actionSuccess}</p>}
      <div className="detail-tabs" role="tablist" aria-label="Detalle del proyecto en Roble">{tabs.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="detail-grid"><section className="detail-main">
        {tab === "Descripción" && <div className="surface-panel"><h2>Sobre el proyecto</h2><p>{project.description || "Sin descripción todavía."}</p><div className="project-meta">{project.categories.map(category => <span className="category-chip" key={category}>{category}</span>)}</div>{project.duration && <p>Duración estimada: {project.duration}</p>}{project.teamDeadline && <p>Postulaciones al equipo hasta: {dateLabel(project.teamDeadline)}</p>}{project.createdAt && <p>Creado el {dateLabel(project.createdAt)}</p>}</div>}
        {tab === "Tareas" && <><h2>Tareas del proyecto</h2>{project.tasks.length === 0 ? <div className="empty-panel"><p>Este proyecto todavía no tiene tareas registradas.</p></div> : project.tasks.map(task => <article className="surface-panel task-row" key={task.id}><span className="project-icon"><Icon name="folder" /></span><div><h3>{task.title}</h3><p>{task.description || "Sin descripción."}</p><small>{Math.max(0, task.needed - task.accepted)} de {task.needed} cupos disponibles{task.deadline ? ` · Hasta ${dateLabel(task.deadline)}` : ""}{task.visibility === "team" ? " · Solo equipo" : ""}</small></div><label className="task-status-label">Estado<select value={task.status} disabled={!!busyTaskId} onChange={event => changeTaskStatus(task.id, event.target.value as typeof task.status)}><option value="available">Disponible</option><option value="in_progress">En progreso</option><option value="completed">Completada</option></select></label></article>)}</>}
        {tab === "Miembros" && <><h2>Equipo necesario</h2>{project.teamRoles.length === 0 ? <div className="empty-panel"><p>Este proyecto todavía no definió roles.</p></div> : <div className="content-grid">{project.teamRoles.map(role => <article className="surface-panel role-card" key={role.role}><Icon name="user" /><h3>{role.role}</h3><p>{Math.max(0, role.needed - role.accepted)} de {role.needed} cupos disponibles</p></article>)}</div>}{project.members.length > 0 && <div className="surface-panel"><h2>Miembros registrados</h2>{project.members.map(member => <p key={member.id}>{member.name}{member.role ? ` · ${member.role}` : ""}</p>)}</div>}</>}
        {tab === "Solicitudes" && <><h2>Solicitudes recibidas</h2>{project.requests.length === 0 ? <div className="empty-panel"><p>Todavía no hay solicitudes para este proyecto.</p></div> : project.requests.map(request => <article className="surface-panel roble-request" key={request.id}><div className="roble-request-heading"><h3>{request.applicantName}</h3><span className="badge">{request.status === "accepted" ? "Aceptada" : request.status === "rejected" ? "Rechazada" : "Pendiente"}</span></div><p>{request.type === "task" ? "Postulación a tarea" : "Solicitud de equipo"}{request.role ? ` · ${request.role}` : ""}</p>{request.message && <p>{request.message}</p>}{request.createdAt && <small>{dateLabel(request.createdAt)}</small>}{request.status === "pending" && <div className="roble-request-actions"><button type="button" className="solid-action" disabled={!!busyRequestId} onClick={() => decide(request.id, "accepted")}>{busyRequestId === request.id ? "Guardando…" : "Aceptar"}</button><button type="button" className="outline-action" disabled={!!busyRequestId} onClick={() => decide(request.id, "rejected")}>Rechazar</button></div>}</article>)}</>}
      </section><aside className="surface-panel detail-aside"><h2>Información rápida</h2><div className="project-meta"><span className="category-chip">{project.members.length} miembros</span><span className="category-chip">{project.tasks.length} tareas</span><span className="category-chip">{pending.length} solicitudes pendientes</span></div><p>Este resumen proviene de la misma base usada por la app móvil.</p><Link href="/mis-proyectos/roble" className="outline-action">Ver todos mis proyectos</Link><button type="button" className="outline-action" disabled={deleting} onClick={deleteProject}>{deleting ? "Eliminando…" : "Eliminar proyecto"}</button></aside></div>
      <RobleProjectFiles projectId={id} section="documents" />
    </>}
  </AppShell>;
}
