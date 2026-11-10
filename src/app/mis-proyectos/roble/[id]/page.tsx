"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
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
  const [project, setProject] = useState<OwnRobleProjectDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "missing" | "error">("loading");
  const [tab, setTab] = useState<Tab>("Descripción");

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

  return <AppShell backHref="/mis-proyectos/roble">
    <p className="preview-note">Datos reales de Roble · Consulta de solo lectura disponible en desarrollo. Ninguna acción de esta pantalla modifica el proyecto.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="folder" size={36} /><h1>Consultando proyecto…</h1></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h1>Inicia sesión para continuar</h1><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "missing" && <div className="empty-panel"><Icon name="folder" size={36} /><h1>Proyecto no disponible</h1><p>Solo puedes consultar proyectos de tu cuenta.</p><Link href="/mis-proyectos/roble" className="outline-action">Volver a mis proyectos</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><Icon name="folder" size={36} /><h1>No pudimos consultar Roble</h1><p>Inténtalo de nuevo más tarde. Tus datos no se han modificado.</p><Link href="/mis-proyectos/roble" className="outline-action">Volver a mis proyectos</Link></div>}
    {status === "ready" && project && <>
      <div className="project-hero"><span className="project-hero-symbol"><Icon name="leaf" size={56} /></span></div>
      <div className="detail-heading"><span className="project-icon"><Icon name="leaf" size={28} /></span><div><h1>{project.name}</h1><span className={`badge ${project.isDraft ? "" : "success"}`}>{project.isDraft ? "Borrador" : project.audience === "Toda la comunidad" ? "Publicado" : "Privado"}</span></div></div>
      <div className="detail-tabs" role="tablist" aria-label="Detalle del proyecto en Roble">{tabs.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="detail-grid"><section className="detail-main">
        {tab === "Descripción" && <div className="surface-panel"><h2>Sobre el proyecto</h2><p>{project.description || "Sin descripción todavía."}</p><div className="project-meta">{project.categories.map(category => <span className="category-chip" key={category}>{category}</span>)}</div>{project.duration && <p>Duración estimada: {project.duration}</p>}{project.teamDeadline && <p>Postulaciones al equipo hasta: {dateLabel(project.teamDeadline)}</p>}{project.createdAt && <p>Creado el {dateLabel(project.createdAt)}</p>}</div>}
        {tab === "Tareas" && <><h2>Tareas del proyecto</h2>{project.tasks.length === 0 ? <div className="empty-panel"><p>Este proyecto todavía no tiene tareas registradas.</p></div> : project.tasks.map(task => <article className="surface-panel task-row" key={task.id}><span className="project-icon"><Icon name="folder" /></span><div><h3>{task.title}</h3><p>{task.description || "Sin descripción."}</p><small>{Math.max(0, task.needed - task.accepted)} de {task.needed} cupos disponibles{task.deadline ? ` · Hasta ${dateLabel(task.deadline)}` : ""}</small></div><span className="badge success">{task.status === "completed" ? "Completada" : task.status === "in_progress" ? "En progreso" : "Disponible"}</span></article>)}</>}
        {tab === "Miembros" && <><h2>Equipo necesario</h2>{project.teamRoles.length === 0 ? <div className="empty-panel"><p>Este proyecto todavía no definió roles.</p></div> : <div className="content-grid">{project.teamRoles.map(role => <article className="surface-panel role-card" key={role.role}><Icon name="user" /><h3>{role.role}</h3><p>{Math.max(0, role.needed - role.accepted)} de {role.needed} cupos disponibles</p></article>)}</div>}{project.members.length > 0 && <div className="surface-panel"><h2>Miembros registrados</h2>{project.members.map(member => <p key={member.id}>{member.name}{member.role ? ` · ${member.role}` : ""}</p>)}</div>}</>}
        {tab === "Solicitudes" && <><h2>Solicitudes recibidas</h2>{project.requests.length === 0 ? <div className="empty-panel"><p>Todavía no hay solicitudes para este proyecto.</p></div> : project.requests.map(request => <article className="surface-panel roble-request" key={request.id}><div className="roble-request-heading"><h3>{request.applicantName}</h3><span className="badge">{request.status === "accepted" ? "Aceptada" : request.status === "rejected" ? "Rechazada" : "Pendiente"}</span></div><p>{request.type === "task" ? "Postulación a tarea" : "Solicitud de equipo"}{request.role ? ` · ${request.role}` : ""}</p>{request.message && <p>{request.message}</p>}{request.createdAt && <small>{dateLabel(request.createdAt)}</small>}</article>)}</>}
      </section><aside className="surface-panel detail-aside"><h2>Información rápida</h2><div className="project-meta"><span className="category-chip">{project.members.length} miembros</span><span className="category-chip">{project.tasks.length} tareas</span><span className="category-chip">{pending.length} solicitudes pendientes</span></div><p>Este resumen proviene de la misma base usada por la app móvil.</p><Link href="/mis-proyectos/roble" className="outline-action">Ver todos mis proyectos</Link></aside></div>
    </>}
  </AppShell>;
}
