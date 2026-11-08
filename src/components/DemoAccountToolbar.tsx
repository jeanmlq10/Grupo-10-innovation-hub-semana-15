"use client";

import { actors, setActor, type DemoActor } from "@/lib/projects/demo-domain";
import { resetDemoWorkspace, updateDemoWorkspace, useDemoWorkspace } from "@/lib/projects/demo-browser";

export function DemoAccountToolbar({ compact = false }: { compact?: boolean }) {
  const state = useDemoWorkspace();
  if (process.env.NODE_ENV !== "development") return null;
  return <div className={compact ? "demo-account compact" : "demo-account"}>
    <span><strong>Demostración local</strong><small>Sin conexión a Roble</small></span>
    <label><span className="sr-only">Cuenta de prueba</span><select value={state.actor} onChange={event => updateDemoWorkspace(current => setActor(current, event.target.value as DemoActor))}>
      {Object.entries(actors).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
    </select></label>
    <button type="button" onClick={() => { if (window.confirm("¿Restablecer los proyectos de demostración de este navegador?")) resetDemoWorkspace(); }}>Reiniciar</button>
  </div>;
}
