import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

const menu = [
  { href: "/mis-proyectos", icon: "folder" as const, label: "Mis proyectos" },
  { href: "/perfil/trayectoria", icon: "clock" as const, label: "Historial y trayectoria" },
  { href: "/mensajes", icon: "chat" as const, label: "Mensajes" },
  { href: "/perfil/ajustes", icon: "gear" as const, label: "Configuración" },
  { href: "/notificaciones", icon: "bell" as const, label: "Notificaciones" },
];

export default function ProfilePage() {
  const demo = process.env.NODE_ENV === "development";
  return <AppShell><header className="topbar"><div className="page-intro"><h1>Perfil</h1></div></header><p className="preview-note">Vista de diseño · El perfil real se identificará con el `userId` de Roble al conectar la cuenta.</p>
    <div className="profile-grid"><div><section className="surface-panel profile-card"><span className="profile-avatar">{demo ? "D" : "?"}</span><h2>{demo ? "Usuario de ejemplo" : "Tu perfil"}</h2><p>{demo ? "Creador/a de proyectos" : "Inicia sesión para ver tus datos"}</p><button className="outline-action" type="button" disabled><Icon name="edit" size={17} /> Editar perfil</button></section><nav className="profile-menu" aria-label="Opciones de perfil">{menu.map(item => <Link href={item.href} key={item.href}><Icon name={item.icon} />{item.label}<span>›</span></Link>)}</nav></div>
    <section><div className="section-heading"><h2>Resumen de trayectoria</h2><Link href="/perfil/trayectoria">Ver más ›</Link></div><div className="stats-grid"><div className="stat-card"><Icon name="folder" /><strong>{demo ? "2" : "—"}</strong><span>Proyectos completados</span></div><div className="stat-card"><Icon name="check" /><strong>{demo ? "0" : "—"}</strong><span>Tareas completadas</span></div><div className="stat-card"><Icon name="user" /><strong>{demo ? "2" : "—"}</strong><span>Participaciones</span></div><div className="stat-card"><Icon name="clock" /><strong>{demo ? "Medio" : "—"}</strong><span>Compromiso</span></div></div></section></div>
  </AppShell>;
}
