"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
export default function ActivityPage() {
  const workspace = useDemoWorkspace(), demo = process.env.NODE_ENV === "development";
  const entries = demo ? workspace.projects.flatMap(project => [
    ...(project.ownerId === workspace.actor ? [{ key: `${project.id}-created`, date: project.createdAt, text: `Creaste ${project.name}`, href: `/proyectos/${project.id}` }] : []),
    ...project.comments.filter(comment => comment.authorId === workspace.actor).map(comment => ({ key: comment.id, date: comment.createdAt, text: `Comentaste en ${project.name}`, href: `/proyectos/${project.id}` })),
    ...project.requests.filter(request => request.applicantId === workspace.actor).map(request => ({ key: request.id, date: request.createdAt, text: `Solicitud ${request.status === "pending" ? "pendiente" : request.status === "accepted" ? "aceptada" : "rechazada"} en ${project.name}`, href: `/proyectos/${project.id}` })),
  ]).sort((a, b) => b.date.localeCompare(a.date)) : [];
  return <AppShell backHref="/perfil/trayectoria"><header className="topbar"><div className="page-intro"><h1>Mi actividad</h1><p>Acciones registradas en los proyectos de prueba</p></div></header><p className="preview-note">Historial local; se perderá al reiniciar los datos de demostración.</p><section className="surface-panel"><div className="profile-activity">{entries.length ? entries.map(entry => <Link href={entry.href} key={entry.key}><span>{entry.text}</span><time>{new Date(entry.date).toLocaleDateString("es-CO")}</time></Link>) : <p>Aún no hay actividad en esta cuenta.</p>}</div></section></AppShell>;
}
