"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
export default function VerifyEmailPage() {
  const [code, setCode] = useState(""), [message, setMessage] = useState("");
  function check(event: FormEvent) { event.preventDefault(); setMessage(/^\d{6}$/.test(code) ? "El código tiene el formato esperado. No se verificó ninguna cuenta: Roble aún no está conectado." : "Escribe los seis dígitos del código."); }
  return <AuthShell headline="Confirma tu correo para unirte a la comunidad." backHref="/registro"><h1>Verificar correo</h1><p className="auth-subtitle">Esta pantalla muestra el paso posterior al registro. Todavía no enviamos códigos.</p><form className="auth-form" onSubmit={check}><div className="auth-field"><label htmlFor="verification-code">Código de seis dígitos</label><input id="verification-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></div><button className="auth-button primary" type="submit">Revisar formato (demo)</button>{message && <p className="auth-pending" role="status">{message}</p>}</form><p className="auth-switch"><Link href="/registro">Volver al registro</Link></p></AuthShell>;
}
