"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useOwnTrajectory } from "@/lib/roble/use-own-trajectory";

export default function ActivityPage() {
  const { data, status } = useOwnTrajectory();
  return <AppShell backHref="/perfil/trayectoria"><header className="topbar"><div className="page-intro"><h1>Mi actividad</h1><p>Acciones registradas en Roble</p></div></header>
    {status === "loading" && <p role="status">Consultando tu actividad…</p>}
    {status === "signed-out" && <Link className="solid-action" href="/login">Iniciar sesión</Link>}
    {status === "error" && <p role="alert">No pudimos consultar tu actividad en Roble.</p>}
    {status === "ready" && <section className="surface-panel"><div className="profile-activity">{data?.entries.length ? data.entries.map(entry => <Link href={entry.href} key={entry.id}><span>{entry.text}</span><time>{new Date(entry.date).toLocaleDateString("es-CO")}</time></Link>) : <p>Aún no hay actividad en esta cuenta.</p>}</div></section>}
  </AppShell>;
}
