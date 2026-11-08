"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";

const items = [
  { href: "/explorar", label: "Explorar", icon: "compass" as const },
  { href: "/mis-proyectos", label: "Mis proyectos", icon: "folder" as const },
  { href: "/notificaciones", label: "Notificaciones", icon: "bell" as const },
  { href: "/perfil", label: "Perfil", icon: "user" as const },
];

export function AppShell({ children, backHref }: { children: ReactNode; backHref?: string }) {
  const path = usePathname();
  return <div className="app-shell">
    <aside className="side-nav" aria-label="Navegación principal">
      <Link href="/" className="side-brand"><BrandLogo /></Link>
      <nav>{items.map(item => {
        const active = path === item.href || (item.href === "/explorar" && path.startsWith("/proyectos/") && !path.endsWith("/nuevo"));
        return <Link key={item.href} href={item.href} className={`nav-item ${active ? "selected" : ""}`} aria-current={active ? "page" : undefined}><Icon name={item.icon} />{item.label}</Link>;
      })}</nav>
      <div className="side-spacer" />
      <div className="user-mini"><span className="avatar">D</span><span><strong>Vista de diseño</strong><small>Datos de ejemplo</small></span></div>
    </aside>
    <main className="main-content">
      {backHref && <Link className="page-back" href={backHref}><Icon name="back" size={18} /> Volver</Link>}
      {children}
    </main>
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {items.map(item => {
        const active = path === item.href;
        return <Link key={item.href} href={item.href} className={`bottom-item ${active ? "selected" : ""}`} aria-label={item.label} aria-current={active ? "page" : undefined}><Icon name={item.icon} size={26} /></Link>;
      })}
    </nav>
  </div>;
}
