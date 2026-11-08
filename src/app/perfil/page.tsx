"use client";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { useDemoProfiles } from "@/lib/profile/demo-browser";
import { trajectory } from "@/lib/profile/demo-domain";

const menu = [
  { href: "/mis-proyectos", icon: "folder" as const, label: "Mis proyectos" },
  { href: "/perfil/trayectoria", icon: "clock" as const, label: "Historial y trayectoria" },
  { href: "/mensajes", icon: "chat" as const, label: "Mensajes" },
  { href: "/perfil/ajustes", icon: "gear" as const, label: "Configuración" },
  { href: "/notificaciones", icon: "bell" as const, label: "Notificaciones" },
];
export default function ProfilePage() {
  const workspace = useDemoWorkspace(), profiles = useDemoProfiles();
  const demo = process.env.NODE_ENV === "development";
  const profile = demo ? profiles.profiles[workspace.actor] : null;
  const stats = demo ? trajectory(workspace, workspace.actor) : null;
  return <AppShell><header className="topbar"><div className="page-intro"><h1>Perfil</h1></div></header>
    <p className="preview-note">{demo ? "Demostración local · Estos datos viven solo en este navegador; no son una sesión de Roble." : "Conecta tu cuenta de Roble para consultar tu perfil."}</p>
    <div className="profile-grid"><div><section className="surface-panel profile-card">{profile ? <ProfileAvatar name={profile.name} avatarIcon={profile.avatarIcon} /> : <span className="profile-avatar">?</span>}<h2>{profile?.name ?? "Tu perfil"}</h2><p>{profile ? `@${profile.username}` : "Inicia sesión para ver tus datos"}</p>{profile?.career && <p>{profile.career}</p>}{profile?.bio && <p>{profile.bio}</p>}{profile && <Link className="outline-action" href="/perfil/editar"><Icon name="edit" size={17} /> Editar perfil</Link>}</section><nav className="profile-menu" aria-label="Opciones de perfil">{menu.map(item => <Link href={item.href} key={item.href}><Icon name={item.icon} />{item.label}<span>›</span></Link>)}</nav></div>
      <section><div className="section-heading"><h2>Resumen de trayectoria</h2><Link href="/perfil/trayectoria">Ver más ›</Link></div><div className="stats-grid"><div className="stat-card"><Icon name="folder" /><strong>{stats?.projectsCreated ?? "—"}</strong><span>Proyectos creados</span></div><div className="stat-card"><Icon name="check" /><strong>{stats?.tasksCompleted ?? "—"}</strong><span>Tareas completadas</span></div><div className="stat-card"><Icon name="user" /><strong>{stats?.participations ?? "—"}</strong><span>Participaciones</span></div><div className="stat-card"><Icon name="clock" /><strong>{stats?.commitment ?? "—"}</strong><span>Compromiso</span></div></div><p className="profile-muted">Las cifras cambian con los proyectos y solicitudes de esta demostración.</p></section></div>
  </AppShell>;
}
