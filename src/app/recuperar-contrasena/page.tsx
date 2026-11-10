"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { validEmail } from "@/lib/roble/auth-flow";
import { flowError, submitAuthFlow } from "@/lib/roble/auth-flow-browser";

export default function RecoveryPage() {
  const [email, setEmail] = useState(""), [error, setError] = useState("");
  const [pending, setPending] = useState(false), [sent, setSent] = useState(false);
  const enabled = process.env.NODE_ENV === "development";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;
    if (!validEmail(email.trim())) { setError("Escribe un correo válido."); return; }
    setPending(true); setError("");
    try { await submitAuthFlow({ action: "recover", email }); setSent(true); }
    catch (cause) { setError(flowError(cause)); }
    finally { setPending(false); }
  }

  return <AuthShell headline="Recupera el acceso a tus ideas." backHref="/login">
    <h1>Recuperar contraseña</h1>
    {sent ? <>
      <p className="auth-success" role="status">Si el correo está registrado, Roble enviará un enlace o token para restablecer la contraseña. Revisa también la carpeta de spam.</p>
      <Link className="auth-button primary" href="/restablecer-contrasena">Ya tengo el enlace o token</Link>
      <button className="auth-link-button" type="button" onClick={() => setSent(false)}>Usar otro correo</button>
    </> : <>
      <p className="auth-subtitle">Te enviaremos instrucciones al correo de tu cuenta de Proyéctate.</p>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-field"><label htmlFor="recovery-email">Correo electrónico</label><input id="recovery-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={!enabled || pending} /></div>
        <button className="auth-button primary" type="submit" disabled={!enabled || pending}>{pending ? "Solicitando…" : "Enviar instrucciones"}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!enabled && <p className="auth-pending">La recuperación web estará disponible después de validar los permisos de Roble.</p>}
      </form>
    </>}
    <p className="auth-switch"><Link href="/login">Volver a iniciar sesión</Link></p>
  </AuthShell>;
}
