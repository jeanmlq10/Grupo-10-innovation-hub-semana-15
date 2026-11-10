"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { useDemoProfiles } from "@/lib/profile/demo-browser";
import { useDemoComms, updateDemoComms } from "@/lib/comms/demo-browser";
import { markNotificationsRead, notificationsFor } from "@/lib/comms/demo-domain";
import { notificationCategories, type NotificationCategory } from "@/lib/profile/demo-domain";

export default function NotificationsPage() {
  const [query, setQuery] = useState(""), [unreadOnly, setUnreadOnly] = useState(false);
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const workspace = useDemoWorkspace(), profiles = useDemoProfiles(), comms = useDemoComms();
  const demo = process.env.NODE_ENV === "development";
  const notifications = demo ? notificationsFor(workspace, comms, profiles, workspace.actor) : [];
  const readIds = comms.readNotificationIds[workspace.actor] ?? [];
  const visible = notifications.filter(item => (category === "all" || item.category === category) && (!unreadOnly || !readIds.includes(item.id)) && `${item.title} ${item.body}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  function mark(ids: string[]) { updateDemoComms(current => markNotificationsRead(current, workspace.actor, ids, notifications)); }
  return <AppShell><header className="topbar"><div className="page-intro"><h1>Notificaciones</h1><p>Lo que ocurre en tus proyectos y conversaciones</p></div><div className="topbar-spacer" /><label className="search-box"><Icon name="search" /><span className="sr-only">Buscar notificaciones</span><input placeholder="Buscar notificaciones…" value={query} onChange={event => setQuery(event.target.value)} /></label></header>
    <p className="preview-note">{demo ? <>Avisos derivados de acciones A/B y guardados como leídos en este navegador. Las preferencias filtran qué avisos ves. <Link href="/notificaciones/roble">Ver mis avisos reales en Roble ›</Link></> : "Los avisos aparecerán cuando conectemos Roble."}</p>
    <section className="surface-panel notification-list"><div className="notification-controls"><div className="explore-tabs" role="tablist" aria-label="Filtrar notificaciones"><button type="button" role="tab" aria-selected={!unreadOnly} className={!unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(false)}>Todas</button><button type="button" role="tab" aria-selected={unreadOnly} className={unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(true)}>No leídas</button></div><label className="notification-category">Tipo <select value={category} onChange={event => setCategory(event.target.value as NotificationCategory | "all")}><option value="all">Todos</option>{notificationCategories.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label></div><div className="notification-tools"><Link href="/perfil/ajustes/notificaciones">Preferencias de avisos</Link>{visible.some(item => !readIds.includes(item.id)) && <button type="button" onClick={() => mark(visible.map(item => item.id))}>Marcar visibles como leídas</button>}</div>
      {visible.length ? visible.map(item => <div className={`notification-entry ${readIds.includes(item.id) ? "" : "unread"}`} key={item.id}><Link className="notification-row" href={item.href} onClick={() => mark([item.id])}><span className="project-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><span>{item.body}</span><small>{new Date(item.createdAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</small></span>{!readIds.includes(item.id) && <i aria-label="No leída" />}</Link>{!readIds.includes(item.id) && <button className="notification-read-action" type="button" onClick={() => mark([item.id])}>Marcar leída</button>}</div>) : <div className="empty-panel"><h2>{demo ? "No hay avisos con este filtro" : "Tus notificaciones aparecerán aquí"}</h2><p>{demo ? "Prueba una solicitud, un comentario o un mensaje desde la otra cuenta." : "Requiere conectar tu cuenta de Roble."}</p></div>}
    </section>
  </AppShell>;
}
