"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { institutionalEmail, normalizeEmail, pendingVerificationEmailKey } from "@/lib/roble/auth-flow";
import { flowError, submitAuthFlow } from "@/lib/roble/auth-flow-browser";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState(""), [code, setCode] = useState("");
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false), [verified, setVerified] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const enabled = process.env.NODE_ENV === "development";

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(pendingVerificationEmailKey);
      if (saved) {
        // Browser-only registration state is available after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(saved);
        setResendSeconds(45);
      }
    } catch { /* Email can also be entered manually. */ }
  }, []);
  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;
    if (!institutionalEmail(normalizeEmail(email))) { setError("Escribe tu correo institucional."); return; }
    if (!/^\d{6}$/.test(code)) { setError("Escribe los seis dígitos del código."); return; }
    setPending(true); setError(""); setNotice("");
    try {
      await submitAuthFlow({ action: "verify", email, code });
      try { sessionStorage.removeItem(pendingVerificationEmailKey); } catch { /* No persisted email. */ }
      setCode(""); setVerified(true);
    } catch (cause) { setError(flowError(cause)); }
    finally { setPending(false); }
  }

  async function resend() {
    if (!enabled || pending || resendSeconds > 0) return;
    if (!institutionalEmail(normalizeEmail(email))) { setError("Escribe tu correo institucional."); return; }
    setPending(true); setError(""); setNotice("");
    try {
      await submitAuthFlow({ action: "resend", email });
      setNotice("Si hay un registro pendiente, recibirás un nuevo código en tu correo.");
      setResendSeconds(45);
    } catch (cause) { setError(flowError(cause)); }
    finally { setPending(false); }
  }

  return <AuthShell headline="Confirma tu correo para unirte a la comunidad." backHref="/registro">
    <h1>Verificar correo</h1>
    {verified ? <>
      <p className="auth-success" role="status">Tu cuenta quedó verificada. Ya puedes entrar con tu correo y contraseña en la web o en la app móvil.</p>
      <Link className="auth-button primary" href="/login">Iniciar sesión</Link>
    </> : <>
      <p className="auth-subtitle">Escribe el código de seis dígitos enviado a tu correo institucional.</p>
      <form className="auth-form" onSubmit={verify}>
        <div className="auth-field"><label htmlFor="verification-email">Correo institucional</label><input id="verification-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required disabled={!enabled || pending} /></div>
        <div className="auth-field"><label htmlFor="verification-code">Código de seis dígitos</label><input id="verification-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required disabled={!enabled || pending} /></div>
        <button className="auth-button primary" type="submit" disabled={!enabled || pending}>{pending ? "Verificando…" : "Verificar cuenta"}</button>
        <button className="auth-link-button" type="button" onClick={resend} disabled={!enabled || pending || resendSeconds > 0}>{resendSeconds > 0 ? `Reenviar código en ${resendSeconds} s` : "Reenviar código"}</button>
        {notice && <p className="auth-success" role="status">{notice}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {!enabled && <p className="auth-pending">La verificación web estará disponible después de validar los permisos de Roble.</p>}
      </form>
      <p className="auth-switch"><Link href="/registro">Volver al registro</Link></p>
    </>}
  </AuthShell>;
}
