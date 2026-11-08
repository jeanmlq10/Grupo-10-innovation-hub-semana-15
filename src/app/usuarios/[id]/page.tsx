"use client";
import { Suspense, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { useDemoProfiles } from "@/lib/profile/demo-browser";
import { visibleProfile, trajectory } from "@/lib/profile/demo-domain";
import type { DemoActor } from "@/lib/projects/demo-domain";
export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando perfil…</main>}><PublicProfile params={params} /></Suspense>;
}
function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params), workspace = useDemoWorkspace(), profiles = useDemoProfiles();
  const target = id === "demo-a" || id === "demo-b" ? id as DemoActor : null;
  const profile = process.env.NODE_ENV === "development" && target ? visibleProfile(profiles, workspace.actor, target) : null;
  const own = workspace.actor === target, showActivity = profile && (own || profile.activityVisibility === "everyone");
  const stats = showActivity && target ? trajectory(workspace, target) : null;
  return <AppShell backHref="/explorar"><header className="topbar"><div className="page-intro"><h1>Perfil de la comunidad</h1></div></header><p className="preview-note">Vista de demostración local · La privacidad real deberá validarse en Roble.</p>{profile ? <div className="profile-grid"><section className="surface-panel profile-card"><ProfileAvatar name={profile.name} avatarIcon={profile.avatarIcon} /><h2>{profile.name}</h2><p>@{profile.username}</p>{profile.career && <p>{profile.career}</p>}{profile.bio && <p>{profile.bio}</p>}{own ? <Link href="/perfil/editar" className="outline-action">Editar mi perfil</Link> : <p className="profile-muted">{profile.contact === "nobody" ? "No acepta contactos" : "Acepta contactos de la comunidad · Mensajes aún no conectados"}</p>}</section><section className="surface-panel"><h2>Actividad</h2>{stats ? <div className="profile-facts"><p>Proyectos creados: <strong>{stats.projectsCreated}</strong></p><p>Participaciones: <strong>{stats.participations}</strong></p><p>Comentarios: <strong>{stats.comments}</strong></p></div> : <p>Esta persona mantiene privada su actividad.</p>}</section></div> : <section className="surface-panel"><h2>Perfil no disponible</h2><p>La cuenta no existe, es privada o requiere conexión a Roble.</p><Link href="/explorar" className="outline-action">Explorar proyectos</Link></section>}</AppShell>;
}
