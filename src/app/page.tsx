import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default function WelcomePage() {
  return (
    <AuthShell headline="Únete a proyectos que transforman ideas en impacto." centered>
      <h1>¡Bienvenido!</h1>
      <p className="auth-subtitle">Elige cómo quieres empezar.</p>
      <div className="auth-stack">
        <Link className="auth-button primary" href="/login">Iniciar sesión</Link>
        <Link className="auth-button outline" href="/registro">¿No tienes cuenta? Regístrate</Link>
        <Link className="auth-button soft" href="/explorar">Continuar como visitante</Link>
        <span className="auth-hint">Explorar proyectos sin iniciar sesión</span>
      </div>
    </AuthShell>
  );
}
