"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { updateDemoProfiles, useDemoProfiles } from "@/lib/profile/demo-browser";
import { saveProfile, type DemoProfile } from "@/lib/profile/demo-domain";

function Form({ profile }: { profile: DemoProfile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name), [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio), [career, setCareer] = useState(profile.career);
  const [avatarIcon, setAvatarIcon] = useState(profile.avatarIcon), [message, setMessage] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      updateDemoProfiles(current => saveProfile(current, profile.userId, profile.userId, { name, username, bio, career, avatarIcon }, new Date().toISOString()));
      router.push("/perfil");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar."); }
  }
  return <form className="surface-panel profile-form" onSubmit={submit}><label>Nombre completo<input value={name} onChange={event => setName(event.target.value)} maxLength={80} required /></label><label>Usuario<input value={username} onChange={event => setUsername(event.target.value)} maxLength={24} required /></label><label>Correo electrónico<input value={profile.email} readOnly /><small>El correo pertenece a la identidad y no se cambia desde el perfil.</small></label><label>Carrera o programa<input value={career} onChange={event => setCareer(event.target.value)} maxLength={100} /></label><label>Biografía<textarea value={bio} onChange={event => setBio(event.target.value)} maxLength={280} rows={4} /><small>{bio.length}/280</small></label><label>Avatar<select value={avatarIcon} onChange={event => setAvatarIcon(event.target.value)}><option value="sprout">Brote</option><option value="star">Estrella</option><option value="idea">Idea</option></select></label>{message && <p role="alert" className="profile-error">{message}</p>}<button type="submit" className="solid-action">Guardar cambios</button></form>;
}
export default function EditProfilePage() {
  const workspace = useDemoWorkspace(), profiles = useDemoProfiles();
  const profile = process.env.NODE_ENV === "development" ? profiles.profiles[workspace.actor] : null;
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Editar perfil</h1><p>Presenta tu experiencia a la comunidad</p></div></header><p className="preview-note">Los cambios de esta demostración se guardan únicamente en este navegador.</p>{profile ? <Form key={profile.userId} profile={profile} /> : <p>La edición estará disponible al conectar Roble.</p>}</AppShell>;
}
