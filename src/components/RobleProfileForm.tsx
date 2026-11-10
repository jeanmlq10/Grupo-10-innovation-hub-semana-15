"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { notificationCategories } from "@/lib/profile/demo-domain";
import { emptyProfile, useOwnProfile, type OwnProfile } from "@/lib/roble/use-own-profile";

type Mode = "details" | "privacy" | "notifications";
const config = {
  details: { title: "Editar perfil", subtitle: "Tu información se comparte con la app móvil", back: "/perfil" },
  privacy: { title: "Privacidad", subtitle: "Decide qué compartes con otras personas", back: "/perfil/ajustes" },
  notifications: { title: "Notificaciones", subtitle: "Escoge los avisos que quieres recibir", back: "/perfil/ajustes" },
};

function Form({ mode, profile, email, userId, save, message, busy }: { mode: Mode; profile: OwnProfile; email: string; userId: string; save: (body: Record<string, unknown>) => Promise<boolean>; message: string; busy: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name), [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio), [career, setCareer] = useState(profile.career), [avatarIcon, setAvatarIcon] = useState(profile.avatarIcon);
  const [visibility, setVisibility] = useState(profile.profileVisibility), [contact, setContact] = useState(profile.contactPermission), [activity, setActivity] = useState(profile.activityVisibility);
  const [enabled, setEnabled] = useState(profile.notificationsEnabled), [muted, setMuted] = useState(profile.mutedNotifications);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const body = mode === "details" ? { kind: mode, name, username, bio, career, avatarIcon } : mode === "privacy"
      ? { kind: mode, profileVisibility: visibility, contactPermission: contact, activityVisibility: activity }
      : { kind: mode, notificationsEnabled: enabled, mutedNotifications: muted };
    if (await save(body) && mode === "details") router.push("/perfil");
  }
  return <form className="surface-panel profile-form" onSubmit={submit}>
    {mode === "details" && <>
      <label>Nombre completo<input value={name} onChange={event => setName(event.target.value)} maxLength={80} required /></label>
      <label>Usuario<input value={username} onChange={event => setUsername(event.target.value)} maxLength={24} required /></label>
      <label>Correo electrónico<input value={email} readOnly /><small>El correo de tu cuenta no cambia desde el perfil.</small></label>
      <label>Carrera o programa<input value={career} onChange={event => setCareer(event.target.value)} maxLength={100} /></label>
      <label>Biografía<textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={280} rows={4} /><small>{bio.length}/280</small></label>
      <label>Avatar<select value={avatarIcon} onChange={event => setAvatarIcon(event.target.value)}>{[["person", "Persona"], ["face", "Rostro"], ["smile", "Sonrisa"], ["school", "Estudios"], ["code", "Código"], ["palette", "Diseño"], ["science", "Ciencia"], ["campaign", "Comunicación"], ["lightbulb", "Idea"], ["rocket", "Cohete"], ["eco", "Naturaleza"], ["music", "Música"], ["sports", "Deporte"], ["camera", "Cámara"], ["pets", "Mascota"], ["star", "Estrella"]].map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
    </>}
    {mode === "privacy" && <>
      <label>Visibilidad del perfil<select value={visibility} onChange={event => setVisibility(event.target.value as OwnProfile["profileVisibility"])}><option value="public">Público</option><option value="private">Privado</option></select></label>
      <label>Quién puede contactarte<select value={contact} onChange={event => setContact(event.target.value as OwnProfile["contactPermission"])}><option value="everyone">Toda la comunidad</option><option value="nobody">Nadie</option></select></label>
      <label>Quién puede ver tu actividad<select value={activity} onChange={event => setActivity(event.target.value as OwnProfile["activityVisibility"])}><option value="everyone">Toda la comunidad</option><option value="onlyMe">Solo yo</option></select></label>
    </>}
    {mode === "notifications" && <>
      <label className="profile-check"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Activar notificaciones</label>
      <fieldset disabled={!enabled}><legend>Categorías</legend>{notificationCategories.map(item => <label className="profile-check" key={item.id}><input type="checkbox" checked={!muted.includes(item.id)} onChange={() => setMuted(current => current.includes(item.id) ? current.filter(value => value !== item.id) : [...current, item.id])} /> {item.label}</label>)}</fieldset>
    </>}
    {message && <p role="status" className="auth-pending">{message}</p>}
    <button type="submit" className="solid-action" disabled={busy}>{busy ? "Guardando…" : mode === "privacy" ? "Guardar privacidad" : mode === "notifications" ? "Guardar preferencias" : "Guardar cambios"}</button>
    {mode === "privacy" && <Link href={`/usuarios/${encodeURIComponent(userId)}`} className="outline-action">Ver mi perfil público</Link>}
  </form>;
}

export function RobleProfileForm({ mode }: { mode: Mode }) {
  const state = useOwnProfile();
  const current = state.profile ?? { ...emptyProfile, name: state.identity?.name || "", username: state.identity?.email.split("@")[0] || "" };
  const info = config[mode];
  return <AppShell backHref={info.back}><header className="topbar"><div className="page-intro"><h1>{info.title}</h1><p>{info.subtitle}</p></div></header>
    {state.status === "loading" && <p role="status">Consultando tu perfil en Roble…</p>}
    {state.status === "signed-out" && <div className="empty-panel"><p>Inicia sesión para continuar.</p><Link className="solid-action" href="/login">Iniciar sesión</Link></div>}
    {state.status === "error" && <p role="alert">No pudimos cargar tu perfil de Roble.</p>}
    {state.status === "ready" && state.identity && <Form mode={mode} profile={current} email={state.identity.email} userId={state.identity.userId} save={state.save} message={state.message} busy={state.busy} />}
  </AppShell>;
}
