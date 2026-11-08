"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { deleteProject, ownedProjects } from "@/lib/projects/demo-domain";
import { updateDemoWorkspace, useDemoWorkspace } from "@/lib/projects/demo-browser";

export default function MyProjectsPage() {
  const [tab, setTab] = useState<"publicados" | "borradores">("publicados");
  const state = useDemoWorkspace();
  const own = process.env.NODE_ENV === "development" ? ownedProjects(state) : [];
  const published = own.filter(project => !project.isDraft);
  const drafts = own.filter(project => project.isDraft);
  const visible = tab === "publicados" ? published : drafts;
  const [error, setError] = useState("");
  const remove = (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar ${name} de esta demostración local?`)) return;
    try { updateDemoWorkspace(current => deleteProject(current, id)); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo eliminar."); }
  };
  return <AppShell>
    <header className="topbar"><div className="page-intro"><h1>Mis proyectos</h1><p>Proyectos que creas</p></div><div className="topbar-spacer" /><Link href="/proyectos/nuevo" className="solid-action"><Icon name="plus" size={18} /> Nuevo proyecto</Link></header>
    <p className="preview-note">Demostración local · Los proyectos y borradores de prueba se guardan solo en este navegador; Roble no recibe cambios.</p>
    {error && <p className="wizard-error" role="alert">{error}</p>}
    <div className="explore-tabs" role="tablist" aria-label="Estado de proyectos"><button type="button" role="tab" aria-selected={tab === "publicados"} className={tab === "publicados" ? "active" : ""} onClick={() => setTab("publicados")}>Mis proyectos ({published.length})</button><button type="button" role="tab" aria-selected={tab === "borradores"} className={tab === "borradores" ? "active" : ""} onClick={() => setTab("borradores")}>Mis borradores ({drafts.length})</button></div>
    {visible.length === 0 ? <div className="empty-panel"><Icon name="folder" size={36} /><h2>{tab === "borradores" ? "Aún no tienes borradores" : "Aún no tienes proyectos publicados"}</h2><p>Puedes crear una idea y guardarla para continuar más tarde.</p><Link href="/proyectos/nuevo" className="solid-action">Crear una idea</Link></div> :
      <div className="content-grid">{visible.map(project => <article className="content-card" key={project.id}><div className="card-heading"><span className="project-icon"><Icon name="leaf" /></span><h2><Link href={`/proyectos/${project.id}`}>{project.name}</Link></h2></div><p>{project.description || "Idea en preparación."}</p><span className={`badge ${project.isDraft ? "" : "success"}`}>{project.isDraft ? "Borrador" : "Publicado"}</span><div className="card-stats"><span><b>{project.members.length}</b>Miembros</span><span><b>{project.tasks.length}</b>Tareas</span><span><b>{project.requests.filter(request => request.status === "pending").length}</b>Solicitudes</span></div><div className="project-card-actions"><Link className="outline-action" href={`/proyectos/${project.id}/editar`}><Icon name="edit" size={16} /> Editar</Link><Link className="outline-action" href={`/proyectos/${project.id}`}>Ver detalle</Link><button type="button" className="text-danger" onClick={() => remove(project.id, project.name)}>Eliminar</button></div></article>)}</div>}
  </AppShell>;
}
