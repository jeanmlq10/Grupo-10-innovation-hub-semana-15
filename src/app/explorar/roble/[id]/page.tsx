"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { PublishedRobleDetail } from "@/lib/roble/public-projects";

const tabs = ["Descripción", "Tareas", "Equipo"] as const;
type Tab = typeof tabs[number];

export default function PublishedRobleProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando proyecto…</main>}><PublishedRobleProject params={params} /></Suspense>;
}

function PublishedRobleProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<PublishedRobleDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "missing" | "error">("loading");
  const [tab, setTab] = useState<Tab>("Descripción");

  useEffect(() => {
    let active = true;
    fetch(`/api/projects/explore/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (response.status === 404) { setStatus("missing"); return; }
        if (!response.ok) { setStatus("error"); return; }
        const body: { project: PublishedRobleDetail } = await response.json();
        if (active) { setProject(body.project); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [id]);

  return <AppShell backHref="/explorar/roble">
    <p className="preview-note">Proyecto real publicado en Roble · Consulta de solo lectura disponible en desarrollo. Las postulaciones siguen en la app móvil.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="folder" size={36} /><h1>Consultando proyecto…</h1></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h1>Inicia sesión para continuar</h1><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "missing" && <div className="empty-panel"><Icon name="folder" size={36} /><h1>Proyecto no disponible</h1><p>Solo se muestran proyectos publicados para toda la comunidad.</p><Link href="/explorar/roble" className="outline-action">Volver a explorar</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><Icon name="folder" size={36} /><h1>No pudimos consultar Roble</h1><p>Inténtalo de nuevo más tarde.</p><Link href="/explorar/roble" className="outline-action">Volver a explorar</Link></div>}
    {status === "ready" && project && <>
      <div className="project-hero"><span className="project-hero-symbol"><Icon name="leaf" size={56} /></span></div>
      <div className="detail-heading"><span className="project-icon"><Icon name="leaf" size={28} /></span><div><h1>{project.name}</h1><span className="badge success">Publicado</span>{project.createdByName && <p>Por {project.createdByName}</p>}</div></div>
      <div className="detail-tabs" role="tablist" aria-label="Detalle del proyecto publicado">{tabs.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="detail-grid"><section className="detail-main">
        {tab === "Descripción" && <div className="surface-panel"><h2>Sobre el proyecto</h2><p>{project.description || "Sin descripción todavía."}</p><div className="project-meta">{project.categories.map(category => <span className="category-chip" key={category}>{category}</span>)}</div>{project.duration && <p>Duración estimada: {project.duration}</p>}{project.teamDeadline && <p>Postulaciones al equipo hasta: {project.teamDeadline}</p>}</div>}
        {tab === "Tareas" && <><h2>Tareas del proyecto</h2>{project.tasks.length === 0 ? <div className="empty-panel"><p>Todavía no hay tareas registradas.</p></div> : project.tasks.map(task => <article className="surface-panel task-row" key={task.id}><span className="project-icon"><Icon name="folder" /></span><div><h3>{task.title}</h3><p>{task.description || "Sin descripción."}</p><small>{Math.max(0, task.needed - task.accepted)} de {task.needed} cupos disponibles</small></div><span className="badge success">{task.status === "completed" ? "Completada" : task.status === "in_progress" ? "En progreso" : "Disponible"}</span></article>)}</>}
        {tab === "Equipo" && <><h2>Equipo necesario</h2>{project.roles.length === 0 ? <div className="empty-panel"><p>Este proyecto no tiene roles definidos.</p></div> : <div className="content-grid">{project.roles.map(role => <article className="surface-panel role-card" key={role.name}><Icon name="user" /><h3>{role.name}</h3><p>{Math.max(0, role.needed - role.accepted)} de {role.needed} cupos disponibles</p></article>)}</div>}</>}
      </section><aside className="surface-panel detail-aside"><h2>Información rápida</h2><div className="project-meta"><span className="category-chip">{project.acceptedMembersCount} miembros</span><span className="category-chip">{project.tasks.length} tareas</span></div><p>Este proyecto está publicado para toda la comunidad.</p><Link href="/explorar/roble" className="outline-action">Ver más proyectos</Link></aside></div>
    </>}
  </AppShell>;
}
