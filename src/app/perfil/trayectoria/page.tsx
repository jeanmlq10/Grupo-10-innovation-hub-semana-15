"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { useOwnTrajectory } from "@/lib/roble/use-own-trajectory";

export default function TrajectoryPage() {
  const { data, status } = useOwnTrajectory();
  const summary = data?.summary;
  const stats = [
    { label: "Proyectos creados", value: summary?.projectsCreated, icon: "folder" as const },
    { label: "Proyectos completados", value: summary?.projectsCompleted, icon: "check" as const },
    { label: "Tareas asignadas", value: summary?.tasksAssigned, icon: "folder" as const },
    { label: "Tareas completadas", value: summary?.tasksCompleted, icon: "check" as const },
    { label: "Participaciones", value: summary?.participations, icon: "user" as const },
    { label: "Comentarios", value: summary?.comments, icon: "chat" as const },
    { label: "Solicitudes enviadas", value: summary?.requestsSent, icon: "clock" as const },
    { label: "Solicitudes aceptadas", value: summary?.requestsAccepted, icon: "check" as const },
  ];
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Resumen de trayectoria</h1><p>Tu actividad y aportes en Proyéctate</p></div></header>
    {status === "loading" && <p role="status">Consultando tu trayectoria en Roble…</p>}
    {status === "signed-out" && <Link className="solid-action" href="/login">Iniciar sesión</Link>}
    {status === "error" && <p role="alert">No pudimos consultar tu trayectoria en Roble.</p>}
    {status === "ready" && <div className="trajectory-grid"><div className="stats-grid">{stats.map(item => <div className="stat-card" key={item.label}><Icon name={item.icon} /><strong>{item.value ?? "—"}</strong><span>{item.label}</span></div>)}</div><section className="surface-panel performance"><h2>Tu desempeño</h2>{[{ label: "Colaboración", value: summary?.collaboration ?? null }, { label: "Cumplimiento", value: summary?.fulfillment ?? null }, { label: "Calidad de aportes", value: summary?.quality ?? null }].map(item => <div className="performance-row" key={item.label}><span>{item.label}</span><div className="performance-track"><i style={{ width: `${Math.round((item.value ?? 0) * 100)}%` }} /></div><b>{item.value === null ? "—" : `${Math.round(item.value * 100)}%`}</b></div>)}<p>Los proyectos completados quedan en 0 hasta contar con un estado de proyecto terminado. <Link href="/perfil/actividad">Ver actividad ›</Link></p></section></div>}
  </AppShell>;
}
