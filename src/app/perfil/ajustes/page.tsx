import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

export default function SettingsPage() {
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Configuración</h1><p>Preferencias de tu cuenta</p></div></header><p className="preview-note">Vista de diseño · Tus preferencias se sincronizarán con Roble al conectar la cuenta.</p><div className="content-grid"><section className="surface-panel"><h2><Icon name="bell" /> Notificaciones</h2><p>Elegirás qué avisos recibir de proyectos, solicitudes y mensajes.</p><button type="button" className="outline-action" disabled>Editar preferencias</button></section><section className="surface-panel"><h2><Icon name="shield" /> Privacidad</h2><p>Controlarás la visibilidad de tu perfil y tu actividad.</p><button type="button" className="outline-action" disabled>Editar privacidad</button></section></div></AppShell>;
}
