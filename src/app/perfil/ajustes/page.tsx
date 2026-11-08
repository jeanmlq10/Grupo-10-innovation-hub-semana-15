import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
export default function SettingsPage() {
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Configuración</h1><p>Preferencias de tu cuenta</p></div></header><p className="preview-note">En desarrollo puedes probar las preferencias localmente. La sincronización real espera la conexión a Roble.</p><div className="content-grid"><section className="surface-panel"><h2><Icon name="bell" /> Notificaciones</h2><p>Elige qué avisos quieres recibir de proyectos, solicitudes y mensajes.</p><Link className="outline-action" href="/perfil/ajustes/notificaciones">Editar preferencias</Link></section><section className="surface-panel"><h2><Icon name="shield" /> Privacidad</h2><p>Controla quién puede ver tu perfil y tu actividad.</p><Link className="outline-action" href="/perfil/privacidad">Editar privacidad</Link></section></div></AppShell>;
}
