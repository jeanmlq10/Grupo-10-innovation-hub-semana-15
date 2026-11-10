"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { MyRobleRequest } from "@/lib/roble/my-activity";

function dateLabel(value: string): string {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("es-CO", { dateStyle: "medium" }) : "";
}

export default function MyRobleRequestsPage() {
  const [requests, setRequests] = useState<MyRobleRequest[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [tab, setTab] = useState<"all" | "pending" | "resolved">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/activity/requests", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (!response.ok) { setStatus("error"); return; }
        const body: { requests: MyRobleRequest[] } = await response.json();
        if (active) { setRequests(body.requests); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  const query = search.trim().toLocaleLowerCase("es");
  const pending = requests.filter(item => item.status === "pending").length;
  const visible = requests.filter(item =>
    (tab === "all" || (tab === "pending" ? item.status === "pending" : item.status !== "pending")) &&
    (!query || [item.projectName, item.role, item.message].some(value => value.toLocaleLowerCase("es").includes(query))));

  return <AppShell backHref="/cuenta">
    <header className="topbar"><div className="page-intro"><h1>Mis postulaciones en Roble</h1><p>Solicitudes enviadas desde tu cuenta móvil</p></div><div className="topbar-spacer" /><Link href="/explorar/roble" className="outline-action">Explorar proyectos</Link></header>
    <p className="preview-note">Consulta de solo lectura en desarrollo. Los estados muestran la última decisión registrada por la persona creadora cuando Roble permite comprobarla.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="user" size={36} /><h2>Consultando postulaciones…</h2></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h2>Inicia sesión para continuar</h2><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><Icon name="folder" size={36} /><h2>No pudimos consultar Roble</h2><p>Inténtalo de nuevo más tarde.</p></div>}
    {status === "ready" && <><label className="roble-search-label" htmlFor="roble-requests-search">Buscar postulaciones</label><input id="roble-requests-search" className="roble-project-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Proyecto, rol o mensaje" />
      <div className="explore-tabs" role="tablist" aria-label="Estado de postulaciones"><button type="button" role="tab" aria-selected={tab === "all"} className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>Todas ({requests.length})</button><button type="button" role="tab" aria-selected={tab === "pending"} className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>Pendientes ({pending})</button><button type="button" role="tab" aria-selected={tab === "resolved"} className={tab === "resolved" ? "active" : ""} onClick={() => setTab("resolved")}>Resueltas ({requests.length - pending})</button></div>
      {visible.length === 0 ? <div className="empty-panel"><Icon name="folder" size={36} /><h2>{requests.length ? "No hay postulaciones con este filtro" : "Aún no has enviado postulaciones"}</h2><p>Puedes descubrir proyectos publicados en la sección Explorar.</p></div> : <div className="content-grid">{visible.map(item => <article className="content-card" key={item.id}><div className="card-heading"><span className="project-icon"><Icon name="user" /></span><h2>{item.projectName}</h2></div><span className="badge">{item.status === "accepted" ? "Aceptada" : item.status === "rejected" ? "Rechazada" : "Pendiente"}</span><p>{item.type === "task" ? "Postulación a tarea" : "Solicitud para unirse al equipo"}{item.role ? ` · ${item.role}` : ""}</p>{item.message && <p>{item.message}</p>}{item.createdAt && <small>{dateLabel(item.createdAt)}</small>}{item.publicProject && <Link href={`/explorar/roble/${encodeURIComponent(item.projectId)}`} className="outline-action roble-card-link">Ver proyecto</Link>}</article>)}</div>}
    </>}
  </AppShell>;
}
