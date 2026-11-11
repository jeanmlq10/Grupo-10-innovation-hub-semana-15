import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { BrandLogo } from "@/components/BrandLogo";

export function AuthShell({ headline, children, centered = false, backHref }: { headline: string; children: ReactNode; centered?: boolean; backHref?: string }) {
  return (
    <main className="auth-split">
      <section className="auth-art" aria-label="Innovation Hub">
        <Link className="auth-brand" href="/"><BrandLogo /></Link>
        <BrandLogo variant="symbol" className="auth-illustration" />
        <h2>{headline}</h2>
      </section>
      <section className="auth-main">
        {backHref && <Link className="auth-back" href={backHref} aria-label="Volver a bienvenida"><Icon name="back" /></Link>}
        <div className={centered ? "auth-card centered" : "auth-card"}>{children}</div>
      </section>
    </main>
  );
}
