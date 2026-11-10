"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { RobleMessage } from "@/lib/roble/messages";

export default function MessagesPage() {
  const [messages, setMessages] = useState<RobleMessage[]>([]);
  const [userId, setUserId] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  useEffect(() => {
    let active = true;
    fetch("/api/messages", { credentials: "same-origin", cache: "no-store" }).then(async response => {
      if (!active) return;
      if (response.status === 401) { setStatus("signed-out"); return; }
      if (!response.ok) { setStatus("error"); return; }
      const body: { messages: RobleMessage[]; userId: string } = await response.json();
      if (active) { setMessages(body.messages); setUserId(body.userId); setStatus("ready"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);
  const latest = new Map<string, RobleMessage>();
  for (const message of messages) latest.set(message.fromUserId === userId ? message.toUserId : message.fromUserId, message);
  const conversations = [...latest.entries()].reverse().filter(([, message]) => {
    const name = message.fromUserId === userId ? message.toName : message.fromName;
    return `${name} ${message.text}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"));
  });
  return <AppShell><header className="topbar"><div className="page-intro"><h1>Mensajes</h1><p>Conversaciones de tu cuenta de Roble</p></div><div className="topbar-spacer" /><label className="search-box"><Icon name="search" /><span className="sr-only">Buscar conversaciones</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar conversaciones…" /></label></header>
    {status === "loading" && <div className="empty-panel" role="status"><h2>Consultando mensajes…</h2></div>}
    {status === "signed-out" && <div className="empty-panel"><h2>Inicia sesión para ver tus mensajes</h2><Link className="solid-action" href="/login">Iniciar sesión</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><h2>No pudimos consultar tus mensajes</h2><p>Comprueba tu sesión y vuelve a intentarlo.</p></div>}
    {status === "ready" && <section className="surface-panel conversation-list">{conversations.length ? conversations.map(([other, message]) => {
      const name = message.fromUserId === userId ? message.toName : message.fromName;
      return <Link href={`/mensajes/${encodeURIComponent(other)}`} className="conversation-row" key={other}><span className="conversation-avatar"><Icon name="user" /></span><span className="conversation-copy"><strong>{name || "Usuario"}</strong><span>{message.fromUserId === userId ? "Tú: " : ""}{message.text}</span></span><span className="conversation-meta"><time>{message.createdAt ? new Date(message.createdAt).toLocaleDateString("es-CO") : ""}</time></span></Link>;
    }) : <div className="empty-panel"><Icon name="chat" size={36} /><h2>Todavía no tienes conversaciones</h2><p>Cuando recibas un mensaje en la app móvil, aparecerá aquí con esta misma cuenta.</p></div>}</section>}
  </AppShell>;
}
