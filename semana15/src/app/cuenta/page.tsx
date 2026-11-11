"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

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

  return <AppShell backHref="/perfil">
    <div className="account-page">
      <header className="page-intro"><h1>Mi cuenta</h1><p>Tu identidad en Proyéctate</p></header>
      {status === "loading" && <div className="empty-panel" role="status"><h2>Verificando tu sesión…</h2></div>}
      {status === "signed-out" && <div className="empty-panel"><Icon name="user" size={36} /><h2>Inicia sesión para ver tu cuenta</h2><Link className="solid-action" href="/login">Iniciar sesión</Link></div>}
      {status === "error" && <p className="auth-error" role="alert">No pudimos verificar la sesión. Recarga la página para intentarlo de nuevo.</p>}
      {status === "ready" && user && <section className="surface-panel account-profile-card">
        <div className="account-profile-heading"><span className="profile-avatar"><Icon name="user" size={30} /></span><div><h2>{user.name || "Tu cuenta"}</h2><p>Cuenta conectada a Roble</p></div></div>
        <dl className="account-details">
          {user.email && <><dt>Correo</dt><dd>{user.email}</dd></>}
          <dt>ID de usuario</dt><dd className="account-user-id">{user.userId}</dd>
        </dl>
        <p className="account-explanation">Esta identidad es la que utilizas para consultar tus proyectos, solicitudes y mensajes.</p>
        <button className="account-signout-link" type="button" onClick={logout} disabled={busy}>{busy ? "Cerrando sesión…" : "Cerrar sesión"}</button>
      </section>}
    </div>
  </AppShell>;
}
