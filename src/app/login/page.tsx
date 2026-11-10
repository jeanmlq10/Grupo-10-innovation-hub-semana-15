"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const enabled = process.env.NODE_ENV === "development";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }), credentials: "same-origin", cache: "no-store",
      });
      if (!response.ok) {
        const body: { error?: string } = await response.json().catch(() => ({}));
        setError(body.error ?? "No pudimos iniciar sesión. Inténtalo de nuevo.");
        return;
      }
      setPassword("");
      router.replace("/cuenta");
    } catch { setError("No pudimos conectar. Revisa tu conexión e inténtalo de nuevo."); }
    finally { setPending(false); }
  }

  return (
    <AuthShell headline="Tu próxima gran idea empieza aquí." backHref="/">
      <h1>Iniciar sesión</h1>
      <p className="auth-subtitle">Usa la misma cuenta de Proyéctate que tienes en la app móvil.</p>
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-field">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="email" placeholder="ejemplo@correo.com" value={email} onChange={event => setEmail(event.target.value)} required disabled={!enabled || pending} />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" value={password} onChange={event => setPassword(event.target.value)} required disabled={!enabled || pending} />
        </div>
        <p className="auth-forgot"><Link href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></p>
        <button className="auth-button primary" type="submit" disabled={!enabled || pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <p className="auth-pending" role="status">{enabled ? "Acceso de desarrollo: usarás la misma cuenta de Roble que en la app móvil. La publicación web espera la corrección de permisos del contrato." : "El acceso web estará disponible cuando validemos los permisos de Roble."}</p>
      </form>
      <p className="auth-switch">¿No tienes cuenta? <Link href="/registro">Regístrate</Link></p>
    </AuthShell>
  );
}
