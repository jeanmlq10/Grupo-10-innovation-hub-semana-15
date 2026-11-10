"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { Icon } from "@/components/Icon";
import { institutionalEmail, normalizeEmail, passwordHint, pendingVerificationEmailKey, validPassword } from "@/lib/roble/auth-flow";
import { flowError, submitAuthFlow } from "@/lib/roble/auth-flow-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState(""), [email, setEmail] = useState(""), [career, setCareer] = useState("");
  const [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const enabled = process.env.NODE_ENV === "development";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;
    if (!institutionalEmail(normalizeEmail(email))) { setError("Usa tu correo institucional @uninorte.edu.co."); return; }
    if (!validPassword(password)) { setError(passwordHint); return; }
    if (password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    setPending(true); setError("");
    try {
      await submitAuthFlow({ action: "register", name, email, career, password });
      try { sessionStorage.setItem(pendingVerificationEmailKey, normalizeEmail(email)); } catch { /* Email can be entered on the next screen. */ }
      setPassword(""); setConfirmation("");
      router.push("/verificar-correo");
    } catch (cause) { setError(flowError(cause)); }
    finally { setPending(false); }
  }

  return <AuthShell headline="Crea tu cuenta institucional y empieza a colaborar." backHref="/">
    <div className="auth-shield"><Icon name="shield" size={50} /></div>
    <h1 className="auth-registration-title">Crea tu cuenta institucional</h1>
    <p className="auth-subtitle">Usa el mismo correo con el que entrarás en la app móvil.</p>
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-field"><label className="sr-only" htmlFor="full-name">Nombre completo</label><input id="full-name" autoComplete="name" placeholder="Nombre completo" value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={100} required disabled={!enabled || pending} /></div>
      <div className="auth-field"><label className="sr-only" htmlFor="institutional-email">Correo institucional</label><input id="institutional-email" type="email" autoComplete="email" placeholder="Correo institucional" value={email} onChange={event => setEmail(event.target.value)} required disabled={!enabled || pending} /></div>
      <div className="auth-field"><label className="sr-only" htmlFor="program">Carrera o programa (opcional)</label><input id="program" placeholder="Carrera o programa (opcional)" value={career} onChange={event => setCareer(event.target.value)} maxLength={100} disabled={!enabled || pending} /></div>
      <div className="auth-field"><label className="sr-only" htmlFor="new-password">Contraseña</label><input id="new-password" type="password" autoComplete="new-password" placeholder="Contraseña" value={password} onChange={event => setPassword(event.target.value)} required disabled={!enabled || pending} /><small className="auth-field-hint">{passwordHint}</small></div>
      <div className="auth-field"><label className="sr-only" htmlFor="confirm-password">Confirma tu contraseña</label><input id="confirm-password" type="password" autoComplete="new-password" placeholder="Confirma tu contraseña" value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={!enabled || pending} /></div>
      <button className="auth-button primary" type="submit" disabled={!enabled || pending}>{pending ? "Enviando código…" : "Registrarme"}</button>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <p className="auth-pending" role="status">{enabled ? "Recibirás un código para verificar tu correo antes de iniciar sesión." : "El registro web estará disponible cuando validemos los permisos de Roble."}</p>
    </form>
    <p className="auth-switch">¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></p>
  </AuthShell>;
}
