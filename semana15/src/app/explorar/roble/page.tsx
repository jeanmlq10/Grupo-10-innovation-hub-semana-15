"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { RobleReadError } from "@/components/RobleReadError";
import type { PublishedProject } from "@/lib/roble/projects";

export default function RobleExplorePage() {
  const [projects, setProjects] = useState<PublishedProject[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [errorStatus, setErrorStatus] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas");

  useEffect(() => {
    let active = true;
    fetch("/api/projects/explore", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (!response.ok) { setErrorStatus(response.status); setStatus("error"); return; }
        const body: { projects: PublishedProject[] } = await response.json();
        if (active) { setProjects(body.projects); setStatus("ready"); }
      })
      .catch(() => { if (active) { setErrorStatus(0); setStatus("error"); } });
    return () => { active = false; };
  }, [attempt]);

  const categories = ["Todas", ...Array.from(new Set(projects.flatMap(project => project.categories)))];
  const query = search.trim().toLocaleLowerCase("es");
  const visible = projects.filter(project =>
    (category === "Todas" || project.categories.includes(category)) &&
    (!query || [project.name, project.description, ...project.categories].some(value => value.toLocaleLowerCase("es").includes(query)))
  );

  return <AppShell>
    <header className="topbar"><div className="page-intro"><h1>Explorar proyectos</h1><p>Descubre ideas y únete a las que te inspiren</p></div></header>
    <p className="preview-note">Proyectos publicados en Roble con la misma cuenta de la app móvil.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="search" size={36} /><h2>Consultando proyectos…</h2></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h2>Inicia sesión para explorar</h2><p>Usa la misma cuenta de la app móvil.</p><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "error" && <RobleReadError title="No pudimos cargar proyectos" icon="folder" status={errorStatus} onRetry={() => { setStatus("loading"); setAttempt(value => value + 1); }} />}
    {status === "ready" && <>
      <div className="roble-filter-row"><div><label className="roble-search-label" htmlFor="roble-explore-search">Buscar proyectos</label><input id="roble-explore-search" className="roble-project-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, descripción o categoría" /></div><div><label className="roble-search-label" htmlFor="roble-explore-category">Categoría</label><select id="roble-explore-category" className="roble-project-search" value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></div></div>
      {visible.length === 0 ? <div className="empty-panel"><Icon name="folder" size={36} /><h2>{projects.length ? "No encontramos proyectos con esos filtros" : "Todavía no hay proyectos publicados"}</h2></div> : <div className="project-grid">{visible.map(project => <Link href={`/explorar/roble/${encodeURIComponent(project.id)}`} className="project-card" key={project.id}><div className="project-card-head"><span className="project-icon"><Icon name="leaf" size={23} /></span><h3>{project.name}</h3></div><p>{project.description || "Sin descripción todavía."}</p><div className="project-meta">{project.categories.map(item => <span className="category-chip" key={item}>{item}</span>)}{project.acceptedMembersCount > 0 && <span className="category-chip">{project.acceptedMembersCount} miembros</span>}</div></Link>)}</div>}
    </>}
  </AppShell>;
}
