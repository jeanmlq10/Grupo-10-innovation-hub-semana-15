import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";

export default function TrajectoryPage() {
  const demo = process.env.NODE_ENV === "development";
  const stats = [
    { label: "Proyectos completados", value: demo ? "2" : "—", icon: "folder" as const },
    { label: "Tareas completadas", value: demo ? "0" : "—", icon: "check" as const },
    { label: "Participaciones", value: demo ? "2" : "—", icon: "user" as const },
    { label: "Compromiso", value: demo ? "Medio" : "—", icon: "clock" as const },
  ];
  return <AppShell backHref="/perfil"><header className="topbar"><div className="page-intro"><h1>Resumen de trayectoria</h1><p>Tu actividad y aportes en Proyéctate</p></div></header><p className="preview-note">Vista de diseño · Estadísticas de ejemplo; las métricas reales se calcularán con los datos de Roble.</p>
    <div className="trajectory-grid"><div className="stats-grid">{stats.map(item => <div className="stat-card" key={item.label}><Icon name={item.icon} /><strong>{item.value}</strong><span>{item.label}</span></div>)}</div><section className="surface-panel performance"><h2>Tu desempeño</h2>{[{ label: "Colaboración", value: demo ? 100 : 0 }, { label: "Cumplimiento", value: 0 }, { label: "Calidad de aportes", value: demo ? 67 : 0 }].map(item => <div className="performance-row" key={item.label}><span>{item.label}</span><div className="performance-track"><i style={{ width: `${item.value}%` }} /></div><b>{demo ? `${item.value}%` : "—"}</b></div>)}<p>Estas métricas se validarán con el modelo y las reglas de la app móvil.</p></section></div>
  </AppShell>;
}
