"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { RobleReadError } from "@/components/RobleReadError";

type Profile = { name: string; username: string; bio: string; career: string; avatarIcon: string } | null;
type Summary = { profile: Profile; stats: { projectsCreated: number; participations: number } };
type Identity = { userId: string; name: string; email: string };

export default function ProfilePage() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [errorStatus, setErrorStatus] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/profile/me", { credentials: "same-origin", cache: "no-store" }),
    ]).then(async ([auth, profile]) => {
      if (!active) return;
      if (auth.status === 401 || profile.status === 401) { setStatus("signed-out"); return; }
      if (!auth.ok || !profile.ok) { setErrorStatus(!auth.ok ? auth.status : profile.status); setStatus("error"); return; }
      const [authBody, profileBody] = await Promise.all([auth.json(), profile.json()]);
      if (active) { setIdentity(authBody.user); setSummary(profileBody); setStatus("ready"); }
    }).catch(() => { if (active) { setErrorStatus(0); setStatus("error"); } });
    return () => { active = false; };
  }, [attempt]);

  const profile = summary?.profile;
  const name = profile?.name || identity?.name || "Tu perfil";
  return <AppShell><header className="topbar"><div className="page-intro"><h1>Perfil</h1><p>Tu información compartida con la app móvil</p></div></header>
    {status === "loading" && <div className="empty-panel" role="status"><h2>Consultando tu perfil en Roble…</h2></div>}
    {status === "signed-out" && <div className="empty-panel"><h2>Inicia sesión para ver tu perfil</h2><Link className="solid-action" href="/login">Iniciar sesión</Link></div>}
    {status === "error" && <RobleReadError title="No pudimos cargar tu perfil" icon="user" status={errorStatus} onRetry={() => { setStatus("loading"); setAttempt(value => value + 1); }} />}
    {status === "ready" && identity && summary && <div className="profile-grid"><div>
      <section className="surface-panel profile-card"><ProfileAvatar name={name} avatarIcon={profile?.avatarIcon || "sprout"} /><h2>{name}</h2>
        {profile?.username && <p>@{profile.username}</p>}{profile?.career && <p>{profile.career}</p>}{profile?.bio && <p>{profile.bio}</p>}
        {!profile && <p>Completa tu perfil para mostrar más información.</p>}
        <Link className="outline-action" href="/perfil/editar"><Icon name="user" size={17} /> Editar perfil</Link></section>
      <nav className="profile-menu" aria-label="Opciones de perfil"><Link href="/mis-proyectos/roble"><Icon name="folder" />Mis proyectos<span>›</span></Link><Link href="/postulaciones/roble"><Icon name="clock" />Mis postulaciones<span>›</span></Link><Link href="/mensajes"><Icon name="chat" />Mensajes<span>›</span></Link><Link href="/notificaciones/roble"><Icon name="bell" />Notificaciones<span>›</span></Link><Link href="/perfil/ajustes"><Icon name="shield" />Configuración<span>›</span></Link><Link href="/cuenta"><Icon name="user" />Mi cuenta de Roble<span>›</span></Link></nav>
    </div><section><div className="section-heading"><h2>Resumen de trayectoria</h2><Link href="/perfil/trayectoria">Ver más ›</Link></div><div className="stats-grid"><div className="stat-card"><Icon name="folder" /><strong>{summary.stats.projectsCreated}</strong><span>Proyectos publicados</span></div><div className="stat-card"><Icon name="user" /><strong>{summary.stats.participations}</strong><span>Participaciones</span></div></div><p className="profile-muted">Datos consultados en Roble para tu cuenta.</p></section></div>}
  </AppShell>;
}
