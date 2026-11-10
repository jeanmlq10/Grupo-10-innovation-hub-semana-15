"use client";

import { Suspense, use, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import type { RobleMessage } from "@/lib/roble/messages";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando conversación…</main>}><ChatRoute params={params} /></Suspense>;
}
function ChatRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ChatContent key={id} id={id} />;
}
function ChatContent({ id }: { id: string }) {
  const [messages, setMessages] = useState<RobleMessage[]>([]);
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [draft, setDraft] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/messages", { credentials: "same-origin", cache: "no-store" });
    if (response.status === 401) { setStatus("signed-out"); return; }
    if (!response.ok) { setStatus("error"); return; }
    const body: { messages: RobleMessage[]; userId: string } = await response.json();
    setMessages(body.messages.filter(message => (message.fromUserId === body.userId && message.toUserId === id) ||
      (message.toUserId === body.userId && message.fromUserId === id)));
    setUserId(body.userId); setStatus("ready");
  }, [id]);
  useEffect(() => {
    const initial = window.setTimeout(() => { void load().catch(() => setStatus("error")); }, 0);
    const interval = setInterval(() => { if (document.visibilityState === "visible") void load().catch(() => {}); }, 5000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [load]);
  const name = messages.length ? (messages[0].fromUserId === userId ? messages[0].toName : messages[0].fromName) : "Conversación";
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!draft.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/messages", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toUserId: id, text: draft }) });
      const body: { error?: string } = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudo enviar el mensaje.");
      setDraft(""); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo enviar el mensaje."); }
    finally { setBusy(false); }
  }
  return <AppShell backHref="/mensajes"><header className="topbar"><div className="page-intro"><h1>{name || "Conversación"}</h1><p>Mensajes guardados en Roble</p></div></header>
    {status === "loading" && <div className="empty-panel" role="status">Consultando conversación…</div>}
    {status === "signed-out" && <div className="empty-panel"><h2>Inicia sesión para ver tus mensajes</h2><Link className="solid-action" href="/login">Iniciar sesión</Link></div>}
    {status === "error" && <div className="empty-panel" role="alert"><h2>No pudimos consultar tus mensajes</h2></div>}
    {status === "ready" && <section className="surface-panel chat-panel"><div className="chat-history" aria-label="Historial de mensajes">{messages.length ? messages.map(message => <div className={`chat-bubble ${message.fromUserId === userId ? "mine" : "theirs"}`} key={message.id}><p>{message.text}</p><time>{message.createdAt ? new Date(message.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" }) : ""}</time></div>) : <div className="empty-panel"><Icon name="chat" size={32} /><p>Escribe el primer mensaje.</p></div>}</div><form className="chat-compose" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Escribe un mensaje</label><textarea id="chat-message" value={draft} onChange={event => setDraft(event.target.value)} maxLength={1000} placeholder="Escribe un mensaje…" rows={2} /><button type="submit" className="solid-action" disabled={!draft.trim() || busy}>{busy ? "Enviando…" : "Enviar"}</button></form>{error && <p className="profile-error" role="alert">{error}</p>}</section>}
  </AppShell>;
}
