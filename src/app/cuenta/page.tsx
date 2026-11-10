"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

type User = { userId: string; email: string; name: string };

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
      .then(async response => {
        if (!active) return;
        if (response.status === 401) { setStatus("signed-out"); return; }
        if (!response.ok) { setStatus("error"); return; }
        const body: { user: User } = await response.json();
        if (active) { setUser(body.user); setStatus("ready"); }
      })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);

  async function logout() {
    setBusy(true);
    try {
      const response = await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) { setStatus("error"); return; }
      setUser(null);
      router.replace("/login");
    } catch { setStatus("error"); }
    finally { setBusy(false); }
  }

  return <AuthShell headline="Tu identidad en Proyéctate." backHref="/perfil">
    <h1>Mi cuenta</h1>
    {status === "loading" && <p className="auth-subtitle" role="status">Verificando tu sesión con Roble…</p>}
    {status === "signed-out" && <><p className="auth-subtitle">No hay una sesión activa.</p><Link className="auth-button primary" href="/login">Iniciar sesión</Link></>}
    {status === "error" && <p className="auth-error" role="alert">No pudimos verificar la sesión. Recarga la página para intentarlo de nuevo.</p>}
    {status === "ready" && user && <>
      <p className="auth-subtitle">Esta identidad viene de Roble, el servicio compartido con la app móvil.</p>
      <dl className="account-details">
        {user.name && <><dt>Nombre</dt><dd>{user.name}</dd></>}
        {user.email && <><dt>Correo</dt><dd>{user.email}</dd></>}
        <dt>ID de usuario en Roble</dt><dd className="account-user-id">{user.userId}</dd>
      </dl>
      <p className="auth-pending">Ya puedes consultar tus proyectos reales en desarrollo, en modo de solo lectura. Los demás flujos siguen como demostración local mientras se corrigen los permisos de Roble.</p>
      {process.env.NODE_ENV === "development" && <Link className="auth-button primary" href="/mis-proyectos/roble">Ver mis proyectos en Roble</Link>}
      <button className="auth-button outline account-logout" type="button" onClick={logout} disabled={busy}>{busy ? "Cerrando sesión…" : "Cerrar sesión"}</button>
      <p className="auth-switch"><Link href="/explorar">Explorar la demostración</Link></p>
    </>}
  </AuthShell>;
}
