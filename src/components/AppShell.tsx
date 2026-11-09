"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";
import { DemoAccountToolbar } from "@/components/DemoAccountToolbar";
import { useDemoWorkspace } from "@/lib/projects/demo-browser";
import { useDemoProfiles } from "@/lib/profile/demo-browser";
import { useDemoComms } from "@/lib/comms/demo-browser";
import { notificationsFor } from "@/lib/comms/demo-domain";

const items = [
  { href: "/explorar", label: "Explorar", icon: "compass" as const },
  { href: "/mis-proyectos", label: "Mis proyectos", icon: "folder" as const },
  { href: "/notificaciones", label: "Notificaciones", icon: "bell" as const },
  { href: "/mensajes", label: "Mensajes", icon: "chat" as const },
  { href: "/perfil", label: "Perfil", icon: "user" as const },
];

export function AppShell({ children, backHref }: { children: ReactNode; backHref?: string }) {
  const path = usePathname();
  const workspace = useDemoWorkspace(), profiles = useDemoProfiles(), comms = useDemoComms();
  const unreadNotifications = process.env.NODE_ENV === "development" ? notificationsFor(workspace, comms, profiles, workspace.actor).filter(item => !(comms.readNotificationIds[workspace.actor] ?? []).includes(item.id)).length : 0;
  const unreadMessages = process.env.NODE_ENV === "development" ? comms.messages.filter(message => message.toUserId === workspace.actor && !message.read).length : 0;
  const unread = { "/notificaciones": unreadNotifications, "/mensajes": unreadMessages } as Record<string, number>;
  return <div className="app-shell">
    <aside className="side-nav" aria-label="Navegación principal">
      <Link href="/" className="side-brand"><BrandLogo /></Link>
      <nav>{items.map(item => {
        const active = path === item.href || (item.href === "/mensajes" && path.startsWith("/mensajes/")) || (item.href === "/explorar" && path.startsWith("/proyectos/") && !path.endsWith("/nuevo"));
        return <Link key={item.href} href={item.href} className={`nav-item ${active ? "selected" : ""}`} aria-current={active ? "page" : undefined}><Icon name={item.icon} />{item.label}{unread[item.href] > 0 && <span className="nav-badge">{unread[item.href]}</span>}</Link>;
      })}</nav>
      <div className="side-spacer" />
      <DemoAccountToolbar compact />
    </aside>
    <main className="main-content">
      <div className="mobile-demo-toolbar"><DemoAccountToolbar /></div>
      {backHref && <Link className="page-back" href={backHref}><Icon name="back" size={18} /> Volver</Link>}
      {children}
    </main>
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {items.map(item => {
        const active = path === item.href || (item.href === "/mensajes" && path.startsWith("/mensajes/"));
        return <Link key={item.href} href={item.href} className={`bottom-item ${active ? "selected" : ""}`} aria-label={`${item.label}${unread[item.href] > 0 ? `, ${unread[item.href]} sin leer` : ""}`} aria-current={active ? "page" : undefined}><Icon name={item.icon} size={26} />{unread[item.href] > 0 && <span className="bottom-badge">{unread[item.href]}</span>}</Link>;
      })}
    </nav>
  </div>;
}
