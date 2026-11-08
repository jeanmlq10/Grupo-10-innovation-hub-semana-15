import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="welcome-inner">
      <h1>¡Bienvenido!</h1>
      <BrandLogo className="welcome-logo" />
      <div className="welcome-actions">
      <p>Únete a proyectos que transforman<br className="welcome-break" /> ideas en impacto.</p>
      <div className="auth-stack">
        <Link className="auth-button primary" href="/login">Iniciar sesión</Link>
        <Link className="auth-button outline" href="/registro">¿No tienes cuenta? Regístrate</Link>
        <Link className="auth-button soft" href="/explorar">Continuar como visitante</Link>
        <span className="auth-hint">Explorar proyectos sin iniciar sesión</span>
      </div>
      </div>
      </div>
    </main>
  );
}
