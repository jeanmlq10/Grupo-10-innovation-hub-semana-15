"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
export default function RecoveryPage() {
  const [email, setEmail] = useState(""), [message, setMessage] = useState("");
  function check(event: FormEvent) { event.preventDefault(); setMessage(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? "El formato del correo es válido. No se envió ningún mensaje: Roble aún no está conectado." : "Escribe un correo válido."); }
  return <AuthShell headline="Recupera el acceso a tus ideas." backHref="/login"><h1>Recuperar contraseña</h1><p className="auth-subtitle">En la app conectada recibirás un enlace para restablecerla.</p><form className="auth-form" onSubmit={check}><div className="auth-field"><label htmlFor="recovery-email">Correo electrónico</label><input id="recovery-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div><button className="auth-button primary" type="submit">Revisar formato (demo)</button>{message && <p className="auth-pending" role="status">{message}</p>}</form><p className="auth-switch"><Link href="/login">Volver a iniciar sesión</Link></p></AuthShell>;
}
