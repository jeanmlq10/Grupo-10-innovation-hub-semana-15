"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";

const items = [
  { href: "/explorar/roble", label: "Explorar", icon: "compass" as const },
  { href: "/mis-proyectos/roble", label: "Mis proyectos", icon: "folder" as const },
  { href: "/notificaciones/roble", label: "Notificaciones", icon: "bell" as const },
  { href: "/mensajes", label: "Mensajes", icon: "chat" as const },
  { href: "/perfil", label: "Perfil", icon: "user" as const },
];

function isActive(path: string, href: string): boolean {
  if (href === "/explorar/roble") return path === "/explorar" || path.startsWith("/explorar/roble/") || path === href;
  if (href === "/mis-proyectos/roble") return path === "/mis-proyectos" || path.startsWith("/mis-proyectos/roble/") || path === href || path.startsWith("/proyectos/roble/");
  if (href === "/notificaciones/roble") return path === "/notificaciones" || path === href;
  if (href === "/perfil") return path === href || path.startsWith("/perfil/") || path === "/cuenta" || path === "/postulaciones/roble";
  return path === href || path.startsWith(`${href}/`);
}

export function AppShell({ children, backHref }: { children: ReactNode; backHref?: string }) {
  const path = usePathname();
  return <div className="app-shell">
    <aside className="side-nav" aria-label="Navegación principal">
      <Link href="/explorar/roble" className="side-brand"><BrandLogo /></Link>
      <nav>{items.map(item => {
        const active = isActive(path, item.href);
        return <Link key={item.href} href={item.href} className={`nav-item ${active ? "selected" : ""}`} aria-current={active ? "page" : undefined}><Icon name={item.icon} />{item.label}</Link>;
      })}</nav>
      <div className="side-spacer" />
      <Link href="/cuenta" className="nav-account-link">Mi cuenta de Roble</Link>
    </aside>
    <main className="main-content">
      {backHref && <Link className="page-back" href={backHref}><Icon name="back" size={18} /> Volver</Link>}
      {children}
    </main>
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {items.map(item => {
        const active = isActive(path, item.href);
        return <Link key={item.href} href={item.href} className={`bottom-item ${active ? "selected" : ""}`} aria-label={item.label} aria-current={active ? "page" : undefined}><Icon name={item.icon} size={26} /></Link>;
      })}
    </nav>
  </div>;
}
