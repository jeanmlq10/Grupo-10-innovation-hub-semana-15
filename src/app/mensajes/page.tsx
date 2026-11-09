"use client";
import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { useDemoProfiles } from "@/lib/profile/demo-browser";
import { useDemoComms } from "@/lib/comms/demo-browser";
import { conversations } from "@/lib/comms/demo-domain";

export default function MessagesPage() {
  const [query, setQuery] = useState("");
  const workspace = useDemoWorkspace(), profiles = useDemoProfiles(), comms = useDemoComms();
  const demo = process.env.NODE_ENV === "development";
  const other = workspace.actor === "demo-a" ? "demo-b" : "demo-a";
  const items = demo ? conversations(comms, workspace.actor, profiles).filter(item => `${item.name} ${item.last.text}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))) : [];
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Mensajes</h1><p>Conversaciones con tu comunidad</p></div><div className="topbar-spacer" /><label className="search-box"><Icon name="search" /><span className="sr-only">Buscar conversaciones</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar conversaciones…" /></label></header>
    <p className="preview-note">{demo ? "Demostración local · Los mensajes A/B se guardan solo en este navegador." : "Las conversaciones estarán disponibles al conectar tu cuenta de Roble."}</p>
    <section className="surface-panel conversation-list">{items.length ? items.map(item => <Link href={`/mensajes/${item.other}`} className="conversation-row" key={item.other}><span className="conversation-avatar"><Icon name="user" /></span><span className="conversation-copy"><strong>{item.name}</strong><span>{item.last.fromUserId === workspace.actor ? "Tú: " : ""}{item.last.text}</span></span><span className="conversation-meta"><time>{new Date(item.last.createdAt).toLocaleDateString("es-CO")}</time>{item.unreadCount > 0 && <b aria-label={`${item.unreadCount} mensajes no leídos`}>{item.unreadCount}</b>}</span></Link>) : <div className="empty-panel"><Icon name="chat" size={36} /><h2>{demo && query ? "No hay conversaciones con esa búsqueda" : "Todavía no tienes conversaciones"}</h2><p>{demo ? "Empieza una conversación desde el perfil de otra persona." : "Podrás escribir a otros miembros cuando conectemos Roble."}</p>{demo && <Link href={`/usuarios/${other}`} className="outline-action">Ver perfil de {profiles.profiles[other].name}</Link>}</div>}</section>
  </AppShell>;
}
