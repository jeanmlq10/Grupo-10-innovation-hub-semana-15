"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { trajectory } from "@/lib/profile/demo-domain";

export default function TrajectoryPage() {
  const workspace = useDemoWorkspace(), demo = process.env.NODE_ENV === "development";
  const summary = demo ? trajectory(workspace, workspace.actor) : null;
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
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Resumen de trayectoria</h1><p>Tu actividad y aportes en Proyéctate</p></div></header><p className="preview-note">{demo ? "Métricas calculadas con las acciones de las cuentas de prueba en este navegador." : "Las métricas aparecerán cuando conectemos tu cuenta de Roble."}</p>
    <div className="trajectory-grid"><div className="stats-grid">{stats.map(item => <div className="stat-card" key={item.label}><Icon name={item.icon} /><strong>{item.value ?? "—"}</strong><span>{item.label}</span></div>)}</div><section className="surface-panel performance"><h2>Tu desempeño</h2>{[{ label: "Colaboración", value: summary?.collaboration }, { label: "Cumplimiento", value: summary?.fulfillment }, { label: "Calidad de aportes", value: summary?.quality }].map(item => <div className="performance-row" key={item.label}><span>{item.label}</span><div className="performance-track"><i style={{ width: `${Math.round((item.value ?? 0) * 100)}%` }} /></div><b>{item.value === undefined ? "—" : `${Math.round(item.value * 100)}%`}</b></div>)}<p>Los proyectos completados quedan en 0 hasta contar con un estado de proyecto terminado. <Link href="/perfil/actividad">Ver actividad ›</Link></p></section></div>
  </AppShell>;
}
