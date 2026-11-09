"use client";
import { Suspense, use, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { useDemoProfiles } from "@/lib/profile/demo-browser";
import { updateDemoComms, useDemoComms } from "@/lib/comms/demo-browser";
import { markThreadRead, sendMessage, thread } from "@/lib/comms/demo-domain";
import type { DemoActor } from "@/lib/projects/demo-domain";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando conversación…</main>}><ChatRoute params={params} /></Suspense>;
}
function ChatRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params), workspace = useDemoWorkspace();
  return <ChatContent key={`${workspace.actor}:${id}`} id={id} />;
}
function ChatContent({ id }: { id: string }) {
  const workspace = useDemoWorkspace(), profiles = useDemoProfiles(), comms = useDemoComms();
  const [text, setText] = useState(""), [error, setError] = useState("");
  const target = id === "demo-a" || id === "demo-b" ? id as DemoActor : null;
  const demo = process.env.NODE_ENV === "development";
  const valid = demo && target && target !== workspace.actor;
  const messages = valid ? thread(comms, workspace.actor, target) : [];
  const unread = valid && messages.some(message => message.toUserId === workspace.actor && !message.read);
  useEffect(() => { if (unread && target) updateDemoComms(current => markThreadRead(current, workspace.actor, target)); }, [unread, target, workspace.actor]);
  const recipient = valid && target ? profiles.profiles[target] : null;
  const canSend = recipient?.contact === "everyone";
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!target) return;
    try { updateDemoComms(current => sendMessage(current, profiles, workspace.actor, target, text, crypto.randomUUID(), new Date().toISOString())); setText(""); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo enviar."); }
  }
  return <AppShell backHref="/mensajes"><header className="topbar"><div className="page-intro"><h1>{recipient?.name ?? "Conversación"}</h1>{recipient && <Link href={`/usuarios/${target}`} className="profile-link">Ver perfil ›</Link>}</div></header><p className="preview-note">{demo ? "Mensajes de demostración local · Ningún contenido se envía a Roble." : "Los mensajes requieren una sesión real de Roble."}</p>
    {recipient ? <section className="surface-panel chat-panel"><div className="chat-history" aria-label="Historial de mensajes">{messages.length ? messages.map(message => <div className={`chat-bubble ${message.fromUserId === workspace.actor ? "mine" : "theirs"}`} key={message.id}><p>{message.text}</p><time>{new Date(message.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</time></div>) : <div className="empty-panel"><Icon name="chat" size={32} /><p>Escribe el primer mensaje.</p></div>}</div>{canSend ? <form className="chat-compose" onSubmit={submit}><label className="sr-only" htmlFor="chat-message">Escribe un mensaje</label><textarea id="chat-message" value={text} onChange={event => setText(event.target.value)} maxLength={1000} placeholder="Escribe un mensaje…" rows={2} /><button type="submit" className="solid-action" disabled={!text.trim()}>Enviar</button></form> : <p className="auth-pending">Esta persona no recibe mensajes. Puedes consultar el historial, pero no escribirle.</p>}{error && <p className="profile-error" role="alert">{error}</p>}</section> : <div className="empty-panel"><h2>Conversación no disponible</h2><p>Selecciona una persona desde su perfil o conecta Roble.</p><Link href="/mensajes" className="outline-action">Volver a mensajes</Link></div>}
  </AppShell>;
}
