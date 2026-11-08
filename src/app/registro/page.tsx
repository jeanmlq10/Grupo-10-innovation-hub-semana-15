import { AuthShell } from "@/components/AuthShell";
import { Icon } from "@/components/Icon";

export default function RegisterPage() {
  return (
    <AuthShell headline="Crea tu cuenta institucional y empieza a colaborar." backHref="/">
      <div className="auth-shield"><Icon name="shield" size={50} /></div>
      <h1 className="auth-registration-title">Crea tu cuenta institucional</h1>
      <p className="auth-subtitle">Alta institucional</p>
      <form className="auth-form">
        <div className="auth-field"><label className="sr-only" htmlFor="full-name">Nombre completo</label><input id="full-name" autoComplete="name" placeholder="Nombre completo" /></div>
        <div className="auth-field"><label className="sr-only" htmlFor="institutional-email">Correo institucional</label><input id="institutional-email" type="email" autoComplete="email" placeholder="Correo institucional" /></div>
        <div className="auth-field"><label className="sr-only" htmlFor="program">Carrera o programa (opcional)</label><input id="program" placeholder="Carrera o programa (opcional)" /></div>
        <div className="auth-field"><label className="sr-only" htmlFor="new-password">Contraseña</label><input id="new-password" type="password" autoComplete="new-password" placeholder="Contraseña" /></div>
        <button className="auth-button primary" type="button" disabled>Registrarme</button>
        <p className="auth-pending" role="status">El registro web estará disponible cuando validemos la conexión y los permisos de Roble.</p>
      </form>
    </AuthShell>
  );
}
