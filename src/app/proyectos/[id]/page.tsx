"use client";

import { Suspense, use, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { demoProjects } from "@/lib/demo/data";

const tabs = ["Descripción", "Tareas", "Miembros", "Actividad"] as const;
type Tab = typeof tabs[number];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando proyecto…</main>}><ProjectDetail params={params} /></Suspense>;
}

function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<Tab>("Descripción");
  const project = process.env.NODE_ENV === "development" ? demoProjects.find(item => item.id === id) : undefined;
  return <AppShell backHref="/explorar">
    {!project ? <div className="empty-panel"><h1>Proyecto no disponible</h1><p>El detalle real estará disponible cuando se validen las lecturas públicas de Roble.</p></div> : <>
      <p className="preview-note">Vista de diseño · Proyecto de ejemplo; las solicitudes y comentarios no se envían a Roble.</p>
      <div className="project-hero"><span className="project-hero-symbol"><Icon name="leaf" size={56} /></span></div>
      <div className="detail-heading"><span className="project-icon"><Icon name="leaf" size={28} /></span><div><h1>{project.name}</h1><span className="badge">{project.members} miembros</span></div></div>
      <div className="detail-tabs" role="tablist" aria-label="Detalle del proyecto">{tabs.map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="detail-grid"><section className="detail-main">
        {tab === "Descripción" && <div className="surface-panel"><h2>Sobre el proyecto</h2><p>{project.description}</p><div className="project-meta">{project.categories.map(category => <span className="category-chip" key={category}>{category}</span>)}</div></div>}
        {tab === "Tareas" && <><h2>Tareas del proyecto</h2><div className="surface-panel task-row"><span className="project-icon"><Icon name="folder" /></span><div><h3>Planear el siguiente paso</h3><p>Definir entregables y personas necesarias para el proyecto.</p><small>Se necesita 1 persona</small></div><span className="badge success">Disponible</span></div><p className="demo-action-note">Las postulaciones estarán disponibles al conectar tu cuenta.</p></>}
        {tab === "Miembros" && <><h2>Buscamos</h2><div className="content-grid">{["Diseñador/a", "Desarrollador/a", "Líder de proyecto"].map(role => <div className="surface-panel role-card" key={role}><Icon name="user" /><h3>{role}</h3><p>1 miembro necesario</p><span className="badge success">Convocatoria abierta</span></div>)}</div><p className="demo-action-note">Las solicitudes para unirse estarán disponibles al conectar tu cuenta.</p></>}
        {tab === "Actividad" && <div className="empty-panel"><Icon name="clock" size={32} /><h2>Aún no hay actividad de ejemplo</h2></div>}
      </section><aside className="surface-panel detail-aside"><h2>Información rápida</h2><div className="project-meta"><span className="category-chip">{project.members} miembros</span><span className="category-chip">{project.tasks} tareas</span></div><button className="solid-action" type="button" disabled>Comentar</button><p className="demo-action-note">Requiere iniciar sesión.</p></aside></div>
    </>}
  </AppShell>;
}
