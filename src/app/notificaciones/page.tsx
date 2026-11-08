"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { demoNotifications } from "@/lib/demo/data";

export default function NotificationsPage() {
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const demo = process.env.NODE_ENV === "development";
  const visible = demo ? demoNotifications.filter(item => (!unreadOnly || !readIds.includes(item.id)) && `${item.title} ${item.body}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))) : [];
  return <AppShell><header className="topbar"><div className="page-intro"><h1>Notificaciones</h1></div><div className="topbar-spacer" /><label className="search-box"><Icon name="search" /><span className="sr-only">Buscar notificaciones</span><input placeholder="Buscar notificaciones…" value={query} onChange={event => setQuery(event.target.value)} /></label></header>
    <p className="preview-note">Vista de diseño · Las notificaciones siguientes son ejemplos y el estado leído solo cambia en esta pantalla.</p>
    <section className="surface-panel notification-list"><div className="explore-tabs" role="tablist" aria-label="Filtrar notificaciones"><button type="button" role="tab" aria-selected={!unreadOnly} className={!unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(false)}>Todas</button><button type="button" role="tab" aria-selected={unreadOnly} className={unreadOnly ? "active" : ""} onClick={() => setUnreadOnly(true)}>No leídas</button></div>
      {visible.length ? visible.map(item => <button className={`notification-row ${readIds.includes(item.id) ? "" : "unread"}`} type="button" onClick={() => setReadIds(ids => ids.includes(item.id) ? ids : [...ids, item.id])} key={item.id}><span className="project-icon"><Icon name={item.icon} /></span><span><strong>{item.title}</strong><span>{item.body}</span><small>{item.time}</small></span>{!readIds.includes(item.id) && <i aria-label="No leída" />}</button>) : <div className="empty-panel"><h2>{demo ? "No hay notificaciones con ese filtro" : "Tus notificaciones aparecerán aquí"}</h2></div>}
    </section>
  </AppShell>;
}
