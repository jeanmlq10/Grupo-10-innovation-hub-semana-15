"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { passwordHint, validPassword } from "@/lib/roble/auth-flow";
import { flowError, submitAuthFlow } from "@/lib/roble/auth-flow-browser";

export default function ResetPasswordPage() {
  const [token, setToken] = useState(""), [password, setPassword] = useState(""), [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false), [done, setDone] = useState(false), [error, setError] = useState("");
  const enabled = process.env.NODE_ENV === "development";

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const received = query.get("token") ?? fragment.get("token") ?? query.get("code") ?? fragment.get("code");
    if (received) {
      // The email token only exists in the browser URL after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(received);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;
    if (!token.trim()) { setError("Pega el token recibido por correo."); return; }
    if (!validPassword(password)) { setError(passwordHint); return; }
    if (password !== confirmation) { setError("Las contraseñas no coinciden."); return; }
    setPending(true); setError("");
    try {
      await submitAuthFlow({ action: "reset", token, newPassword: password });
      setToken(""); setPassword(""); setConfirmation(""); setDone(true);
    } catch (cause) { setError(flowError(cause)); }
    finally { setPending(false); }
  }

  return <AuthShell headline="Vuelve a tus ideas." backHref="/recuperar-contrasena">
    <h1>Nueva contraseña</h1>
    {done ? <>
      <p className="auth-success" role="status">Tu contraseña se actualizó en Roble. Ya puedes iniciar sesión con ella en la web y en la app móvil.</p>
      <Link className="auth-button primary" href="/login">Iniciar sesión</Link>
    </> : <>
      <p className="auth-subtitle">Abre el enlace recibido por correo o pega aquí el token de recuperación.</p>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-field"><label htmlFor="reset-token">Token de recuperación</label><input id="reset-token" type="text" autoComplete="off" spellCheck={false} value={token} onChange={event => setToken(event.target.value)} required disabled={!enabled || pending} /></div>
        <div className="auth-field"><label htmlFor="reset-password">Nueva contraseña</label><input id="reset-password" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={!enabled || pending} /><small className="auth-field-hint">{passwordHint}</small></div>
        <div className="auth-field"><label htmlFor="reset-confirmation">Confirma la nueva contraseña</label><input id="reset-confirmation" type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} required disabled={!enabled || pending} /></div>
        <button className="auth-button primary" type="submit" disabled={!enabled || pending}>{pending ? "Actualizando…" : "Guardar contraseña"}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!enabled && <p className="auth-pending">Este flujo web estará disponible después de validar los permisos de Roble.</p>}
      </form>
      <p className="auth-switch"><Link href="/recuperar-contrasena">Solicitar un nuevo enlace</Link></p>
    </>}
  </AuthShell>;
}
