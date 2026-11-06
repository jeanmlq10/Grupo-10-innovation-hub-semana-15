"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import type { PublishedProject } from "@/lib/roble/projects";

type ExploreResult =
  | { status: "pending" }
  | { status: "error" }
  | { status: "loaded"; projects: PublishedProject[] };

const previewProjects: PublishedProject[] = [
  { id: "preview-1", name: "EcoCampus", description: "Diseñemos juntos un campus más sostenible", categories: ["Medio ambiente", "Impacto social"], createdByName: null, acceptedMembersCount: 0 },
  { id: "preview-2", name: "GreenLab", description: "Laboratorio estudiantil de soluciones ambientales de bajo costo", categories: ["Medio ambiente", "Tecnología"], createdByName: null, acceptedMembersCount: 0 },
  { id: "preview-3", name: "QuizPro", description: "Aplicación web para crear actividades de aprendizaje", categories: ["Innovación", "Educación"], createdByName: null, acceptedMembersCount: 5 },
];

const nav = [
  { label: "Explorar", icon: "compass" as const, active: true },
  { label: "Mis proyectos", icon: "folder" as const, active: false },
  { label: "Notificaciones", icon: "bell" as const, active: false },
  { label: "Perfil", icon: "user" as const, active: false },
];

function ProjectCard({ project }: { project: PublishedProject }) {
  return (
    <article className="project-card">
      <div className="project-card-head">
        <span className="project-icon"><Icon name="leaf" size={23} /></span>
        <h3>{project.name}</h3>
      </div>
      <p>{project.description || "Sin descripción todavía."}</p>
      <div className="project-meta">
        {project.categories.map((category) => <span className="category-chip" key={category}>{category}</span>)}
        {project.acceptedMembersCount > 0 && <span className="category-chip">{project.acceptedMembersCount} miembros</span>}
      </div>
    </article>
  );
}

function FilterGroup({ title, options }: { title: string; options: string[] }) {
  return (
    <div className="filter-group">
      <h3>{title}</h3>
      <div className="filter-options">
        {options.map((option, index) => <span className={index === 0 ? "filter-option selected" : "filter-option"} key={option}>{option}</span>)}
      </div>
    </div>
  );
}

export function ExploreView({ result }: { result: ExploreResult }) {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const preview = result.status === "pending" && process.env.NODE_ENV === "development";
  const projects = result.status === "loaded" ? result.projects : preview ? previewProjects : [];
  const normalized = query.trim().toLocaleLowerCase("es");
  const visibleProjects = normalized ? projects.filter((project) =>
    [project.name, project.description, ...project.categories].some((value) => value.toLocaleLowerCase("es").includes(normalized))) : projects;

  return (
    <div className="app-shell">
      <aside className="side-nav" aria-label="Navegación principal">
        <div className="brand"><span className="brand-icon"><Icon name="leaf" /></span><span>Innovation Hub</span></div>
        <nav>
          {nav.map((item) => item.active
            ? <Link className="nav-item selected" href="/explorar" aria-current="page" key={item.label}><Icon name={item.icon} />{item.label}</Link>
            : <span className="nav-item unavailable" aria-disabled="true" key={item.label}><Icon name={item.icon} />{item.label}</span>)}
        </nav>
        <div className="side-spacer" />
        <div className="user-mini"><span className="avatar">V</span><span><strong>Visitante</strong><small>Explorando proyectos</small></span></div>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="page-intro"><h1>Explorar proyectos</h1><p>Descubre ideas y únete a las que te inspiren</p></div>
          <div className="topbar-spacer" />
          <label className="search-box"><Icon name="search" /><span className="sr-only">Buscar proyectos</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar proyectos…" /></label>
          <button className="icon-button desktop-filter-trigger" type="button" aria-label={filterOpen ? "Ocultar filtros" : "Mostrar filtros"} aria-expanded={filterOpen} onClick={() => setFilterOpen(!filterOpen)}><Icon name="sliders" /></button>
          <button className="icon-button mobile-filter-trigger" type="button" aria-label={mobileFiltersOpen ? "Ocultar filtros" : "Mostrar filtros"} aria-expanded={mobileFiltersOpen} onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}><Icon name="sliders" /></button>
        </div>

        <div className="explore-tabs" role="tablist" aria-label="Proyectos">
          <button className="active" role="tab" aria-selected="true">Todos</button>
          <button role="tab" aria-selected="false" disabled title="Disponible cuando se habilite el inicio de sesión">Seguidos</button>
        </div>

        {preview && <p className="preview-note" role="status">Vista de diseño · Estos proyectos son ejemplos. Roble todavía no está conectado.</p>}

        <div className={filterOpen ? "explore-layout with-filters" : "explore-layout"}>
          <div className="project-grid">
            <div className="create-card" aria-disabled="true">
              <span className="create-plus"><Icon name="plus" size={25} /></span>
              <span><strong>Crea otra idea</strong><small>Comparte tu idea y encuentra personas que quieren construirla contigo</small></span>
            </div>

            {result.status === "error" && <div className="status-card" role="alert">No pudimos cargar los proyectos. Intenta de nuevo más tarde.</div>}
            {result.status === "pending" && !preview && <div className="status-card" role="status">Los proyectos se mostrarán cuando se verifiquen los permisos de Roble.</div>}
            {visibleProjects.map((project) => <ProjectCard project={project} key={project.id} />)}
            {result.status === "loaded" && visibleProjects.length === 0 && <div className="status-card">{normalized ? "No encontramos proyectos con ese nombre." : "Todavía no hay proyectos publicados. ¡Crea el primero!"}</div>}
          </div>

          {(filterOpen || mobileFiltersOpen) && <aside className={mobileFiltersOpen ? "filters-panel mobile-open" : "filters-panel"} aria-label="Filtros de proyectos">
            <div className="filters-heading"><h2>Filtros</h2><button type="button" aria-label="Cerrar filtros" onClick={() => { setFilterOpen(false); setMobileFiltersOpen(false); }}><Icon name="close" size={18} /></button></div>
            <p className="filters-note">Opciones disponibles cuando se conecten los datos de Roble.</p>
            <FilterGroup title="Fecha de creación" options={["Todos", "Últimos 7 días", "Últimos 30 días", "Más antiguos"]} />
            <FilterGroup title="Disponibilidad de tareas" options={["Todas", "Con tareas disponibles", "Sin tareas disponibles"]} />
            <FilterGroup title="Disponibilidad de miembros" options={["Todos", "Con miembros disponibles", "Sin miembros disponibles"]} />
            <FilterGroup title="Rol del proyecto" options={["Todos", "Diseñador", "Desarrollador", "Líder", "Comunicador", "Otros"]} />
          </aside>}
        </div>
      </main>

      <nav className="bottom-nav" aria-label="Navegación móvil">
        {nav.map((item) => item.active
          ? <Link className="bottom-item selected" href="/explorar" aria-current="page" aria-label={item.label} key={item.label}><Icon name={item.icon} size={26} /></Link>
          : <span className="bottom-item unavailable" aria-label={`${item.label}, próximamente`} key={item.label}><Icon name={item.icon} size={26} /></span>)}
      </nav>
    </div>
  );
}
