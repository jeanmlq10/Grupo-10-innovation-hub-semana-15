import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

export default function MessagesPage() {
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Mensajes</h1><p>Conversaciones con tu comunidad</p></div></header><p className="preview-note">Vista de diseño · Los mensajes requieren sesión y permisos de lectura privados en Roble.</p><div className="empty-panel"><Icon name="chat" size={36} /><h2>Tus conversaciones aparecerán aquí</h2><p>Podrás escribir a otros miembros cuando conectemos tu cuenta.</p></div></AppShell>;
}
