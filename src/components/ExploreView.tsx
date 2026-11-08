"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { publicProjects } from "@/lib/projects/demo-domain";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import type { PublishedProject } from "@/lib/roble/projects";

type ExploreResult = { status: "pending" } | { status: "error" } | { status: "loaded"; projects: PublishedProject[] };
type CardProject = { id: string; name: string; description: string; categories: string[]; members: number; followed: boolean };

export function ExploreView({ result }: { result: ExploreResult }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tab, setTab] = useState<"todos" | "seguidos">("todos");
  const state = useDemoWorkspace();
  const isDemo = result.status === "pending" && process.env.NODE_ENV === "development";
  const projects: CardProject[] = result.status === "loaded"
    ? result.projects.map(project => ({ id: project.id, name: project.name, description: project.description, categories: project.categories, members: project.acceptedMembersCount, followed: false }))
    : isDemo ? publicProjects(state).map(project => ({ id: project.id, name: project.name, description: project.description, categories: project.categories, members: project.members.length, followed: project.followers.includes(state.actor) })) : [];
  const categories = ["Todas", ...Array.from(new Set(projects.flatMap(project => project.categories)))];
  const visible = projects.filter(project =>
    (tab === "todos" || project.followed) && (category === "Todas" || project.categories.includes(category)) &&
    `${project.name} ${project.description} ${project.categories.join(" ")}`.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))
  );

  return <AppShell>
    <header className="topbar">
      <div className="page-intro"><h1>Explorar proyectos</h1><p>Descubre ideas y únete a las que te inspiren</p></div>
      <div className="topbar-spacer" />
      <label className="search-box"><Icon name="search" /><span className="sr-only">Buscar proyectos</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar proyectos…" /></label>
      <button className="icon-button" type="button" aria-label="Mostrar filtros" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><Icon name="sliders" /></button>
    </header>
    <div className="explore-tabs" role="tablist" aria-label="Proyectos"><button type="button" role="tab" aria-selected={tab === "todos"} className={tab === "todos" ? "active" : ""} onClick={() => setTab("todos")}>Todos</button><button type="button" role="tab" aria-selected={tab === "seguidos"} className={tab === "seguidos" ? "active" : ""} disabled={!isDemo} onClick={() => setTab("seguidos")}>Seguidos</button></div>
    {isDemo && <p className="preview-note" role="status">Demostración local · Busca, sigue y crea proyectos de prueba en este navegador. Roble todavía no está conectado.</p>}
    <div className={filtersOpen ? "explore-layout with-filters" : "explore-layout"}>
      <div className="project-grid">
        <Link href="/proyectos/nuevo" className="create-card"><span className="create-plus"><Icon name="plus" size={25} /></span><span><strong>Crea otra idea</strong><small>Comparte tu idea y encuentra personas que quieren construirla contigo</small></span></Link>
        {result.status === "error" && <div className="status-card" role="alert">No pudimos cargar los proyectos. Intenta de nuevo más tarde.</div>}
        {result.status === "pending" && !isDemo && <div className="status-card">Los proyectos se mostrarán cuando se verifiquen los permisos de Roble.</div>}
        {visible.map(project => <Link href={`/proyectos/${project.id}`} className="project-card" key={project.id}>
          <div className="project-card-head"><span className="project-icon"><Icon name="leaf" size={23} /></span><h3>{project.name}</h3></div>
          <p>{project.description || "Sin descripción todavía."}</p>
          <div className="project-meta">{project.categories.map(item => <span className="category-chip" key={item}>{item}</span>)}{project.members > 0 && <span className="category-chip">{project.members} miembros</span>}</div>
        </Link>)}
        {projects.length > 0 && visible.length === 0 && <div className="status-card">No encontramos proyectos con esos filtros.</div>}
      </div>
      {filtersOpen && <aside className="filters-panel mobile-open" aria-label="Filtros de proyectos">
        <div className="filters-heading"><h2>Filtros</h2><button type="button" aria-label="Cerrar filtros" onClick={() => setFiltersOpen(false)}><Icon name="close" size={18} /></button></div>
        <p className="filters-note">Filtra los proyectos visibles en esta vista.</p>
        <div className="filter-group"><h3>Categoría</h3><div className="filter-options">{categories.map(item => <button className={`filter-option ${category === item ? "selected" : ""}`} type="button" onClick={() => setCategory(item)} key={item}>{item}</button>)}</div></div>
      </aside>}
    </div>
  </AppShell>;
}
