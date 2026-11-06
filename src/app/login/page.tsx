import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell headline="Tu próxima gran idea empieza aquí." backHref="/">
      <h1>Iniciar sesión</h1>
      <p className="auth-subtitle">Ingresa tus datos para continuar.</p>
      <form className="auth-form">
        <div className="auth-field">
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="email" placeholder="ejemplo@correo.com" />
        </div>
        <div className="auth-field">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" />
        </div>
        <p className="auth-forgot">Recuperación de contraseña disponible próximamente</p>
        <button className="auth-button primary" type="button" disabled>Ingresar</button>
        <p className="auth-pending" role="status">El acceso web estará disponible cuando validemos la conexión y los permisos de Roble.</p>
      </form>
      <p className="auth-switch">¿No tienes cuenta? <Link href="/registro">Regístrate</Link></p>
    </AuthShell>
  );
}
