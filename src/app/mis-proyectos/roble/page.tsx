"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { OwnRobleProject } from "@/lib/roble/own-projects";

export default function MyRobleProjectsPage() {
  const [projects, setProjects] = useState<OwnRobleProject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [tab, setTab] = useState<"publicados" | "borradores">("publicados");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/projects/mine", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (!response.ok) { setStatus("error"); return; }
        const body: { projects: OwnRobleProject[] } = await response.json();
        if (active) { setProjects(body.projects); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  const published = projects.filter(project => !project.isDraft && project.audience === "Toda la comunidad");
  const drafts = projects.filter(project => project.isDraft || project.audience !== "Toda la comunidad");
  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const visible = (tab === "publicados" ? published : drafts)
    .filter(project => !normalizedSearch || [project.name, project.description, ...project.categories]
      .some(value => value.toLocaleLowerCase("es").includes(normalizedSearch)))
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));

  return <AppShell backHref="/cuenta">
    <header className="topbar"><div className="page-intro"><h1>Mis proyectos en Roble</h1><p>La misma cuenta que usas en la app móvil</p></div><div className="topbar-spacer" /><Link href="/mis-proyectos" className="outline-action">Ver demostración</Link><Link href="/proyectos/roble/nuevo" className="solid-action">Nuevo proyecto en Roble</Link></header>
    <p className="preview-note">Lectura y guardado reales disponibles solo en desarrollo. Esta pantalla muestra únicamente filas cuyo propietario coincide con tu sesión; la configuración actual de Roble aún requiere corrección antes de publicar la web.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="folder" size={36} /><h2>Consultando tus proyectos…</h2></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h2>Inicia sesión para continuar</h2><p>Usa tu cuenta de Proyéctate para ver tus proyectos de Roble.</p><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><Icon name="folder" size={36} /><h2>No pudimos consultar Roble</h2><p>Inténtalo de nuevo más tarde. Tus proyectos no se han modificado.</p><Link href="/cuenta" className="outline-action">Volver a mi cuenta</Link></div>}
    {status === "ready" && <>
      <label className="roble-search-label" htmlFor="roble-project-search">Buscar entre mis proyectos</label>
      <input id="roble-project-search" className="roble-project-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, descripción o categoría" />
      <div className="explore-tabs" role="tablist" aria-label="Estado de proyectos en Roble"><button type="button" role="tab" aria-selected={tab === "publicados"} className={tab === "publicados" ? "active" : ""} onClick={() => setTab("publicados")}>Publicados ({published.length})</button><button type="button" role="tab" aria-selected={tab === "borradores"} className={tab === "borradores" ? "active" : ""} onClick={() => setTab("borradores")}>Privados y borradores ({drafts.length})</button></div>
      {visible.length === 0 ? <div className="empty-panel"><Icon name="folder" size={36} /><h2>{normalizedSearch ? "No encontramos proyectos con esa búsqueda" : tab === "borradores" ? "No tienes borradores en Roble" : "No tienes proyectos publicados en Roble"}</h2><p>Esta lista muestra solo los proyectos de tu cuenta real.</p></div> : <div className="content-grid">{visible.map(project => <article className="content-card" key={project.id}><div className="card-heading"><span className="project-icon"><Icon name="leaf" /></span><h2>{project.name}</h2></div><p>{project.description || "Sin descripción."}</p><span className={`badge ${project.isDraft ? "" : "success"}`}>{project.isDraft ? "Borrador" : project.audience === "Solo yo" ? "Privado" : "Publicado"}</span>{project.categories.length > 0 && <p>{project.categories.join(" · ")}</p>}<Link href={`/mis-proyectos/roble/${encodeURIComponent(project.id)}`} className="outline-action roble-card-link">Ver detalle</Link> <Link href={`/mis-proyectos/roble/${encodeURIComponent(project.id)}/editar`} className="outline-action roble-card-link">Editar</Link></article>)}</div>}
    </>}
  </AppShell>;
}
