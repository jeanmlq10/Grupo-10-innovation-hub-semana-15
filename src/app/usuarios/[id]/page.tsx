"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProfileAvatar } from "@/components/ProfileAvatar";

type PublicProfile = { profile: { name: string; username: string; bio: string; career: string; avatarIcon: string; contactPermission: "everyone" | "nobody" }; own: boolean; stats: { projectsCreated: number } | null };

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando perfil…</main>}><PublicProfileView params={params} /></Suspense>;
}

function PublicProfileView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "missing" | "error">("loading");
  useEffect(() => {
    let active = true;
    fetch(`/api/profile/${encodeURIComponent(id)}`, { credentials: "same-origin", cache: "no-store" }).then(async response => {
      if (!active) return;
      if (response.status === 401) { setStatus("signed-out"); return; }
      if (response.status === 404) { setStatus("missing"); return; }
      if (!response.ok) { setStatus("error"); return; }
      const body: PublicProfile = await response.json();
      if (active) { setData(body); setStatus("ready"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [id]);
  return <AppShell backHref="/explorar/roble"><header className="topbar"><div className="page-intro"><h1>Perfil de la comunidad</h1></div></header>
    {status === "loading" && <p role="status">Consultando el perfil en Roble…</p>}
    {status === "signed-out" && <div className="empty-panel"><h2>Inicia sesión para ver perfiles</h2><Link className="solid-action" href="/login">Iniciar sesión</Link></div>}
    {status === "error" && <p role="alert">No pudimos consultar el perfil. Inténtalo de nuevo.</p>}
    {status === "missing" && <div className="empty-panel"><h2>Perfil no disponible</h2><p>La persona no tiene perfil público.</p><Link href="/explorar/roble" className="outline-action">Explorar proyectos</Link></div>}
    {status === "ready" && data && <div className="profile-grid"><section className="surface-panel profile-card"><ProfileAvatar name={data.profile.name} avatarIcon={data.profile.avatarIcon} /><h2>{data.profile.name}</h2>{data.profile.username && <p>@{data.profile.username}</p>}{data.profile.career && <p>{data.profile.career}</p>}{data.profile.bio && <p>{data.profile.bio}</p>}{data.own ? <Link href="/perfil/editar" className="outline-action">Editar mi perfil</Link> : data.profile.contactPermission === "everyone" ? <Link href={`/mensajes/${encodeURIComponent(id)}`} className="outline-action">Enviar mensaje</Link> : <p className="profile-muted">No acepta mensajes</p>}</section><section className="surface-panel"><h2>Actividad</h2>{data.stats ? <p>Proyectos publicados: <strong>{data.stats.projectsCreated}</strong></p> : <p>Esta persona mantiene privada su actividad.</p>}</section></div>}
  </AppShell>;
}
