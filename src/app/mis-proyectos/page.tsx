"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { demoProjects } from "@/lib/demo/data";

export default function MyProjectsPage() {
  const [tab, setTab] = useState<"publicados" | "borradores">("publicados");
  const isDemo = process.env.NODE_ENV === "development";
  return <AppShell>
    <header className="topbar"><div className="page-intro"><h1>Mis proyectos</h1><p>Proyectos que creas</p></div><div className="topbar-spacer" /><Link href="/proyectos/nuevo" className="solid-action"><Icon name="plus" size={18} /> Nuevo proyecto</Link></header>
    <p className="preview-note">Vista de diseño · La cuenta y los proyectos propios se conectarán a Roble.</p>
    <div className="explore-tabs" role="tablist" aria-label="Estado de proyectos">
      <button type="button" role="tab" aria-selected={tab === "publicados"} className={tab === "publicados" ? "active" : ""} onClick={() => setTab("publicados")}>Mis proyectos {isDemo ? `(${demoProjects.length})` : ""}</button>
      <button type="button" role="tab" aria-selected={tab === "borradores"} className={tab === "borradores" ? "active" : ""} onClick={() => setTab("borradores")}>Mis borradores (0)</button>
    </div>
    {tab === "borradores" || !isDemo ? <div className="empty-panel"><Icon name="folder" size={36} /><h2>{tab === "borradores" ? "Sin borradores de ejemplo" : "Conecta tu cuenta para ver tus proyectos"}</h2><p>Podrás continuar aquí las ideas que aún no publicas.</p><Link href="/proyectos/nuevo" className="solid-action">Crear una idea</Link></div> :
      <div className="content-grid">{demoProjects.slice(0, 2).map(project => <Link className="content-card" href={`/proyectos/${project.id}`} key={project.id}>
        <div className="card-heading"><span className="project-icon"><Icon name="leaf" /></span><h2>{project.name}</h2><Icon name="edit" size={18} /></div>
        <p>{project.description}</p><span className="badge success">Publicado</span>
        <div className="card-stats"><span><b>{project.members}</b>Miembros</span><span><b>{project.tasks}</b>Tareas</span><span><b>{project.requests}</b>Solicitudes</span></div>
      </Link>)}</div>}
  </AppShell>;
}
