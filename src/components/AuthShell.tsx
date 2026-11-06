import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/Icon";

function CloudMascot({ accessory }: { accessory: "lock" | "bulb" }) {
  return (
    <svg className="auth-mascot" viewBox="0 0 320 300" role="img" aria-label="Nube de Innovation Hub">
      <g fill="#fff" stroke="#14123a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M70 120c-8-24 8-50 34-52 8-22 40-30 58-14 20-10 46 4 48 28 22 8 30 36 14 54 10 22-6 46-30 48-8 22-40 28-58 12-20 10-48-4-48-28-24-8-30-34-18-48z" />
        <path d="M130 232v46l-18 14h-8M170 232v46l16 14h12" fill="none" />
        <path d="M62 192c-18 4-34-2-40-14" fill="none" />
        <path d="M232 140c14-4 22-8 34-12" fill="none" />
      </g>
      <circle cx="130" cy="148" r="5" fill="#14123a" /><circle cx="170" cy="148" r="5" fill="#14123a" />
      <path d="M138 166c8 7 16 7 24 0" fill="none" stroke="#14123a" strokeWidth="2.5" strokeLinecap="round" />
      {accessory === "lock" ? (
        <g stroke="#14123a" strokeWidth="2.2" fill="#fff"><rect x="262" y="104" width="38" height="46" rx="8" /><path d="M270 104v-10a11 11 0 0 122 0v10" fill="none" /><path d="M281 120v10" strokeWidth="4" /></g>
      ) : (
        <g stroke="#14123a" strokeWidth="2" fill="#fff"><circle cx="276" cy="112" r="14" /><path d="M270 128h12M272 133h8" fill="none" /><path d="M276 84v-6M258 90l-4-4M294 90l4-4" fill="none" /></g>
      )}
    </svg>
  );
}

export function AuthShell({ headline, children, centered = false, backHref, accessory = "lock" }: { headline: string; children: ReactNode; centered?: boolean; backHref?: string; accessory?: "lock" | "bulb" }) {
  return (
    <main className="auth-split">
      <section className="auth-art" aria-label="Innovation Hub">
        <Link className="auth-brand" href="/"><span className="auth-brand-mark"><Icon name="leaf" /></span>Innovation Hub</Link>
        <CloudMascot accessory={accessory} />
        <h2>{headline}</h2>
      </section>
      <section className="auth-main">
        {backHref && <Link className="auth-back" href={backHref} aria-label="Volver a bienvenida"><Icon name="back" /></Link>}
        <div className={centered ? "auth-card centered" : "auth-card"}>{children}</div>
      </section>
    </main>
  );
}
