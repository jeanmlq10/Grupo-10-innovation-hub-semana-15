"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Comment = { id: string; authorUserId: string; authorName: string; text: string; createdAt: string; parentId: string };
type Social = { comments: Comment[]; following: boolean };

export function RobleProjectSocial({ projectId }: { projectId: string }) {
  const [data, setData] = useState<Social | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/projects/explore/${encodeURIComponent(projectId)}/social`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("No pudimos consultar los comentarios y el seguimiento.");
    setData(await response.json());
  }, [projectId]);
  useEffect(() => {
    let active = true;
    fetch(`/api/projects/explore/${encodeURIComponent(projectId)}/social`, { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("No pudimos consultar los comentarios y el seguimiento.");
        const result: Social = await response.json();
        if (active) setData(result);
      }).catch(cause => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [projectId]);
  async function act(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects/explore/${encodeURIComponent(projectId)}/social`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No pudimos guardar el cambio.");
      if (body.action === "comment") { setText(""); setReplyTo(""); }
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No pudimos guardar el cambio."); }
    finally { setBusy(false); }
  }
  return <section className="surface-panel" style={{ marginTop: 24 }}><div className="section-heading"><h2>Conversación</h2>{data && <button type="button" className="outline-action" disabled={busy} onClick={() => act({ action: "follow", follow: !data.following })}>{data.following ? "Siguiendo · dejar de seguir" : "Seguir proyecto"}</button>}</div>
    {error && <p role="alert" className="wizard-error">{error}</p>}
    {!data && !error && <p role="status">Cargando comentarios…</p>}
    {data && <><div className="profile-activity">{data.comments.length ? data.comments.map(item => <article key={item.id} className="notification-entry"><strong><Link href={`/usuarios/${encodeURIComponent(item.authorUserId)}`}>{item.authorName}</Link></strong>{item.parentId && <small> · Respuesta</small>}<p>{item.text}</p>{item.createdAt && <small>{new Date(item.createdAt).toLocaleDateString("es-CO")}</small>}<button type="button" className="outline-action" onClick={() => setReplyTo(item.id)}>Responder</button></article>) : <p>Sé la primera persona en comentar.</p>}</div>
      <form className="profile-form" onSubmit={event => { event.preventDefault(); void act({ action: "comment", text, ...(replyTo ? { parentId: replyTo } : {}) }); }}>
        <label>{replyTo ? "Responder comentario" : "Escribir comentario"}<textarea value={text} onChange={event => setText(event.target.value)} maxLength={1000} rows={3} required /></label>
        {replyTo && <button type="button" className="outline-action" onClick={() => setReplyTo("")}>Cancelar respuesta</button>}
        <button type="submit" className="solid-action" disabled={busy || !text.trim()}>{busy ? "Enviando…" : "Publicar comentario"}</button>
      </form></>}
  </section>;
}
