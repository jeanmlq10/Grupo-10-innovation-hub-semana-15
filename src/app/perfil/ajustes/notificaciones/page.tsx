"use client";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { updateDemoProfiles, useDemoProfiles } from "@/lib/profile/demo-browser";
import { notificationCategories, saveNotifications, type DemoProfile, type NotificationCategory } from "@/lib/profile/demo-domain";
function Form({ profile }: { profile: DemoProfile }) {
  const [enabled, setEnabled] = useState(profile.notificationsEnabled), [muted, setMuted] = useState(profile.mutedNotifications), [message, setMessage] = useState("");
  function toggle(id: NotificationCategory) { setMuted(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  function submit(event: FormEvent) { event.preventDefault(); try { updateDemoProfiles(current => saveNotifications(current, profile.userId, profile.userId, enabled, muted, new Date().toISOString())); setMessage("Preferencias guardadas en este navegador. No se envían avisos reales."); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); } }
  return <form className="surface-panel profile-form" onSubmit={submit}><label className="profile-check"><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} /> Activar notificaciones</label><fieldset disabled={!enabled}><legend>Categorías</legend>{notificationCategories.map(item => <label className="profile-check" key={item.id}><input type="checkbox" checked={!muted.includes(item.id)} onChange={() => toggle(item.id)} /> {item.label}</label>)}</fieldset>{message && <p role="status" className="auth-pending">{message}</p>}<button type="submit" className="solid-action">Guardar preferencias</button></form>;
}
export default function NotificationSettingsPage() { const workspace = useDemoWorkspace(), profiles = useDemoProfiles(); const profile = process.env.NODE_ENV === "development" ? profiles.profiles[workspace.actor] : null; return <AppShell backHref="/perfil/ajustes"><header className="topbar"><div className="page-intro"><h1>Notificaciones</h1><p>Escoge los avisos que quieres recibir</p></div></header><p className="preview-note">Estas opciones solo se guardan localmente hasta que conectemos Roble.</p>{profile ? <Form key={profile.userId} profile={profile} /> : <p>Las preferencias estarán disponibles al conectar Roble.</p>}</AppShell>; }
