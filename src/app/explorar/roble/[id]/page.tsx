"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { PublishedRobleDetail } from "@/lib/roble/public-projects";
import type { MyRobleRequest } from "@/lib/roble/my-activity";

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
  const [requests, setRequests] = useState<MyRobleRequest[]>([]);
  const [selected, setSelected] = useState<{ type: "team" | "task"; targetId: string; label: string } | null>(null);
  const [message, setMessage] = useState("");
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    let active = true;
    fetch("/api/activity/requests", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active || !response.ok) return;
        const body: { requests: MyRobleRequest[] } = await response.json();
        if (active) setRequests(body.requests.filter(item => item.projectId === id));
      }).catch(() => undefined);
    return () => { active = false; };
  }, [id]);

  const requested = (type: "team" | "task", targetId: string) => requests.some(item => item.type === type && item.targetId === targetId && item.status !== "rejected");
  const apply = async () => {
    if (!selected || sending) return;
    setSending(true); setRequestError(""); setRequestSuccess("");
    try {
      const response = await fetch(`/api/projects/explore/${encodeURIComponent(id)}/requests`, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selected.type, targetId: selected.targetId, message }),
      });
      const body: { error?: string } = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo enviar la solicitud.");
      setRequestSuccess(`Solicitud enviada para ${selected.label}. Puedes ver su estado en Mis postulaciones.`);
      setRequests(current => [...current, { id: `new-${selected.targetId}`, projectId: id, projectName: project?.name ?? "",
        publicProject: true, role: selected.label, targetId: selected.targetId, type: selected.type, message,
        status: "pending", createdAt: new Date().toISOString() }]);
      setSelected(null); setMessage("");
    } catch (cause) { setRequestError(cause instanceof Error ? cause.message : "No se pudo enviar la solicitud."); }
    finally { setSending(false); }
  };

  return <AppShell backHref="/explorar/roble">
    <p className="preview-note">Proyecto real publicado en Roble · Puedes postularte al equipo o a una tarea con tu cuenta en desarrollo.</p>
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
        {tab === "Tareas" && <><h2>Tareas del proyecto</h2>{project.tasks.length === 0 ? <div className="empty-panel"><p>Todavía no hay tareas registradas.</p></div> : project.tasks.map(task => <article className="surface-panel task-row" key={task.id}><span className="project-icon"><Icon name="folder" /></span><div><h3>{task.title}</h3><p>{task.description || "Sin descripción."}</p><small>{Math.max(0, task.needed - task.accepted)} de {task.needed} cupos disponibles</small>{!project.isMine && <button type="button" className="outline-action" disabled={!project.canApply || requested("task", task.id) || task.status !== "available" || task.needed <= task.accepted || !!task.deadline && task.deadline.slice(0, 10) < new Date().toISOString().slice(0, 10)} onClick={() => { setSelected({ type: "task", targetId: task.id, label: task.title }); setRequestError(""); }}>{requested("task", task.id) ? "Solicitud enviada" : "Postularme a la tarea"}</button>}</div><span className="badge success">{task.status === "completed" ? "Completada" : task.status === "in_progress" ? "En progreso" : "Disponible"}</span></article>)}</>}
        {tab === "Equipo" && <><h2>Equipo necesario</h2>{project.roles.length === 0 ? <div className="empty-panel"><p>Este proyecto no tiene roles definidos.</p></div> : <div className="content-grid">{project.roles.map(role => <article className="surface-panel role-card" key={role.name}><Icon name="user" /><h3>{role.name}</h3><p>{Math.max(0, role.needed - role.accepted)} de {role.needed} cupos disponibles</p>{!project.isMine && <button type="button" className="solid-action" disabled={!project.canApply || requested("team", role.name) || role.needed <= role.accepted || !!project.teamDeadline && project.teamDeadline.slice(0, 10) < new Date().toISOString().slice(0, 10)} onClick={() => { setSelected({ type: "team", targetId: role.name, label: role.name }); setRequestError(""); }}>{requested("team", role.name) ? "Solicitud enviada" : "Unirme al equipo"}</button>}</article>)}</div>}</>}
      </section><aside className="surface-panel detail-aside"><h2>Información rápida</h2><div className="project-meta"><span className="category-chip">{project.acceptedMembersCount} miembros</span><span className="category-chip">{project.tasks.length} tareas</span></div><p>Este proyecto está publicado para toda la comunidad.</p>{!project.canApply && <p>Las postulaciones están cerradas.</p>}{project.isMine && <Link href={`/mis-proyectos/roble/${encodeURIComponent(id)}`} className="outline-action">Gestionar mi proyecto</Link>}{selected && <div className="roble-apply-form"><h3>Postularme como {selected.label}</h3><label htmlFor="request-message">Mensaje para el equipo</label><textarea id="request-message" value={message} maxLength={1000} onChange={event => setMessage(event.target.value)} placeholder="Cuéntales por qué quieres participar" rows={4} /><button type="button" className="solid-action" disabled={sending} onClick={apply}>{sending ? "Enviando…" : "Enviar solicitud"}</button><button type="button" className="outline-action" disabled={sending} onClick={() => setSelected(null)}>Cancelar</button></div>}{requestError && <p role="alert" className="wizard-error">{requestError}</p>}{requestSuccess && <p role="status" className="preview-note">{requestSuccess}</p>}<Link href="/explorar/roble" className="outline-action">Ver más proyectos</Link></aside></div>
    </>}
  </AppShell>;
}
