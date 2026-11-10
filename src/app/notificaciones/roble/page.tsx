"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { MyRobleNotification } from "@/lib/roble/my-activity";

function typeLabel(value: string): string {
  const labels: Record<string, string> = {
    new_request: "Solicitud recibida", task_application: "Postulación a tarea",
    request_accepted: "Solicitud aceptada", request_rejected: "Solicitud rechazada",
    task_application_accepted: "Postulación aceptada", task_application_rejected: "Postulación rechazada",
    new_comment: "Comentario", task_completed: "Tarea completada", new_message: "Mensaje", member_joined: "Nuevo miembro",
  };
  return labels[value] ?? "Aviso";
}

function dateLabel(value: string): string {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" }) : "";
}

export default function RobleNotificationsPage() {
  const [notifications, setNotifications] = useState<MyRobleNotification[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/activity/notifications", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (!response.ok) { setStatus("error"); return; }
        const body: { notifications: MyRobleNotification[] } = await response.json();
        if (active) { setNotifications(body.notifications); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  const query = search.trim().toLocaleLowerCase("es");
  const visible = notifications.filter(item => (!unreadOnly || !item.read) &&
    (!query || [item.title, item.message, typeLabel(item.type)].some(value => value.toLocaleLowerCase("es").includes(query))));
  const unread = notifications.filter(item => !item.read).length;

  return <AppShell backHref="/notificaciones">
    <header className="topbar"><div className="page-intro"><h1>Mis avisos en Roble</h1><p>Notificaciones reales de tu cuenta móvil</p></div><div className="topbar-spacer" /><Link href="/notificaciones" className="outline-action">Ver demostración</Link></header>
    <p className="preview-note">Consulta de solo lectura en desarrollo. Los avisos se filtran por destinatario; esta vista no cambia su estado de lectura en Roble.</p>
    {status === "loading" && <div className="empty-panel" role="status"><Icon name="bell" size={36} /><h2>Consultando avisos…</h2></div>}
    {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h2>Inicia sesión para ver tus avisos</h2><Link href="/login" className="solid-action">Iniciar sesión</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><Icon name="bell" size={36} /><h2>No pudimos consultar Roble</h2><p>Inténtalo de nuevo más tarde.</p></div>}
    {status === "ready" && <><div className="roble-filter-row"><div><label className="roble-search-label" htmlFor="roble-notification-search">Buscar avisos</label><input id="roble-notification-search" className="roble-project-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Título, mensaje o tipo" /></div></div>
      <div className="explore-tabs" role="tablist" aria-label="Filtrar avisos reales"><button type="button" role="tab" aria-selected={!unreadOnly} className={!unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(false)}>Todos ({notifications.length})</button><button type="button" role="tab" aria-selected={unreadOnly} className={unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(true)}>No leídos ({unread})</button></div>
      <section className="surface-panel notification-list">{visible.length === 0 ? <div className="empty-panel"><Icon name="bell" size={30} /><h2>{notifications.length ? "No hay avisos con este filtro" : "Aún no tienes avisos en Roble"}</h2></div> : visible.map(item => <article className={`notification-entry ${item.read ? "" : "unread"}`} key={item.id}><div className="notification-row roble-notification-row"><span className="project-icon"><Icon name="bell" /></span><span><strong>{item.title || typeLabel(item.type)}</strong><span>{item.message}</span><small>{typeLabel(item.type)}{dateLabel(item.createdAt) ? ` · ${dateLabel(item.createdAt)}` : ""}</small></span>{!item.read && <i aria-label="No leída" />}</div></article>)}</section>
    </>}
  </AppShell>;
}
