"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { Icon } from "@/components/Icon";

const steps = ["Comencemos", "Información básica", "Equipo necesario", "Tiempo estimado", "Audiencia", "Revisar y publicar"] as const;
const roleOptions = ["Diseñador/a", "Desarrollador/a", "Investigador/a", "Comunicador/a", "Líder de proyecto"];
type Task = { title: string; description: string; requiredCount: number; deadline: string };

export default function NewProjectPage() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState<Record<string, number>>({});
  const [teamDeadline, setTeamDeadline] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [duration, setDuration] = useState("Semanas");
  const [audience, setAudience] = useState("Toda la comunidad");
  const [error, setError] = useState("");
  const updateTask = (index: number, update: Partial<Task>) => setTasks(current => current.map((task, at) => at === index ? { ...task, ...update } : task));
  const next = () => {
    if (step === 0 && !name.trim()) { setError("Escribe el nombre de tu idea para continuar."); return; }
    if (step === 1 && !name.trim()) { setError("Escribe el nombre del proyecto para continuar."); return; }
    if (step === 1 && !description.trim()) { setError("Añade una descripción para continuar."); return; }
    setError(""); setStep(current => Math.min(current + 1, steps.length - 1));
  };
  return <main className="wizard-shell">
    <aside className="wizard-sidebar"><Link href="/explorar" className="page-back"><Icon name="back" size={18} /> Volver a Explorar</Link><BrandLogo className="wizard-brand" /><h1>Crear proyecto</h1><p>Convierte tu idea en un proyecto real</p><ol>{steps.map((item, index) => <li className={index === step ? "current" : index < step ? "done" : ""} key={item}><span>{index < step ? <Icon name="check" size={16} /> : index + 1}</span>{item}</li>)}</ol></aside>
    <div className="wizard-main"><div className="wizard-progress"><div><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><span>{step + 1}/{steps.length}</span></div>
      <div className={`wizard-content ${step === 0 ? "idea-intro" : ""}`}>
        {step === 0 && <><div className="wizard-intro-copy"><Link className="wizard-mobile-back" href="/explorar" aria-label="Volver"><Icon name="back" size={24} /></Link><h2>Comencemos</h2><p>Tu idea puede generar un gran cambio. Cuéntanos un poco sobre ella.</p></div><BrandLogo variant="symbol" className="wizard-idea-symbol" /><div className="wizard-intro-field"><label className="sr-only" htmlFor="idea-name">Nombre de tu idea</label><input id="idea-name" value={name} onChange={event => setName(event.target.value)} placeholder="Nombre de tu idea" /></div></>}
        {step === 1 && <><h2>Información básica</h2><p className="wizard-lead">Cuéntanos sobre tu proyecto</p><div className="wizard-form-field"><label htmlFor="project-name">Nombre del proyecto</label><input id="project-name" value={name} onChange={event => setName(event.target.value)} /></div><div className="wizard-form-field"><label htmlFor="project-description">Descripción</label><textarea id="project-description" value={description} onChange={event => setDescription(event.target.value)} placeholder="¿Qué problema resuelve y cómo funcionará?" rows={6} /></div></>}
        {step === 2 && <><h2>Equipo necesario</h2><p className="wizard-lead">¿Qué miembros necesitas?</p><div className="wizard-roles">{roleOptions.map(role => <div className="wizard-role" key={role}><span><Icon name="user" />{role}</span><div><button type="button" aria-label={`Restar ${role}`} onClick={() => setRoles(current => ({ ...current, [role]: Math.max(0, (current[role] || 0) - 1) }))}>−</button><strong>{roles[role] || 0}</strong><button type="button" aria-label={`Sumar ${role}`} onClick={() => setRoles(current => ({ ...current, [role]: (current[role] || 0) + 1 }))}>+</button></div></div>)}</div><div className="wizard-form-field"><label htmlFor="team-deadline">Fecha límite para postularse al equipo</label><input id="team-deadline" type="date" value={teamDeadline} onChange={event => setTeamDeadline(event.target.value)} /></div><div className="wizard-task-list"><h3>Información de tareas</h3><p>Configura las tareas de tu proyecto</p>{tasks.map((task, index) => <div className="wizard-task" key={index}><div className="wizard-task-title"><strong>Tarea {index + 1}</strong><button type="button" onClick={() => setTasks(current => current.filter((_, at) => at !== index))} aria-label={`Eliminar tarea ${index + 1}`}>Eliminar</button></div><label>Título<input value={task.title} onChange={event => updateTask(index, { title: event.target.value })} placeholder="Nombre de la tarea" /></label><label>Descripción<input value={task.description} onChange={event => updateTask(index, { description: event.target.value })} placeholder="Qué hay que hacer" /></label><div className="wizard-task-fields"><label>Personas necesarias<input type="number" min="1" value={task.requiredCount} onChange={event => updateTask(index, { requiredCount: Math.max(1, Number(event.target.value)) })} /></label><label>Disponible hasta<input type="date" value={task.deadline} onChange={event => updateTask(index, { deadline: event.target.value })} /></label></div></div>)}<button type="button" className="outline-action" onClick={() => setTasks(current => [...current, { title: "", description: "", requiredCount: 1, deadline: "" }])}><Icon name="plus" size={16} /> Agregar otra tarea</button></div></>}
        {step === 3 && <><h2>Tiempo estimado</h2><p className="wizard-lead">¿Cuánto tiempo crees que tomará?</p><div className="choice-list">{[["Días", "1–30 días"], ["Semanas", "1–12 semanas"], ["Meses", "1–12 meses"], ["Años", "Más de 1 año"]].map(([value, subtitle]) => <button type="button" className={duration === value ? "choice selected" : "choice"} key={value} onClick={() => setDuration(value)}><Icon name="clock" /><span><strong>{value}</strong><small>{subtitle}</small></span><i /></button>)}</div></>}
        {step === 4 && <><h2>Audiencia</h2><p className="wizard-lead">¿Quién puede ver tu proyecto?</p><div className="choice-list">{[["Solo yo", "Tu proyecto será privado"], ["Toda la comunidad", "Tu proyecto será visible para todos los usuarios"]].map(([value, subtitle]) => <button type="button" className={audience === value ? "choice selected" : "choice"} key={value} onClick={() => setAudience(value)}><Icon name={value === "Solo yo" ? "shield" : "user"} /><span><strong>{value}</strong><small>{subtitle}</small></span><i /></button>)}</div></>}
        {step === 5 && <><h2>Revisar y publicar</h2><p className="wizard-lead">Confirma la información de tu proyecto</p><div className="review-list"><div><span>Nombre</span><strong>{name}</strong></div><div><span>Descripción</span><strong>{description}</strong></div><div><span>Equipo</span><strong>{Object.entries(roles).filter(([, count]) => count > 0).map(([role, count]) => `${count} ${role}`).join(" · ") || "Sin roles definidos"}</strong></div><div><span>Postulaciones hasta</span><strong>{teamDeadline || "Sin fecha"}</strong></div><div><span>Tareas</span><strong>{tasks.length}</strong></div><div><span>Tiempo estimado</span><strong>{duration}</strong></div><div><span>Audiencia</span><strong>{audience}</strong></div></div><p className="auth-pending">Vista de diseño: publicar estará disponible cuando conectemos Roble y validemos permisos.</p></>}
      </div>
      <footer className="wizard-footer">{error && <p role="alert" className="wizard-error">{error}</p>}{step > 0 && <button type="button" className="outline-action" onClick={() => { setError(""); setStep(current => current - 1); }}>Anterior</button>}{step < steps.length - 1 ? <button type="button" className="solid-action" onClick={next}>Continuar</button> : <button type="button" className="solid-action" disabled>Publicar proyecto</button>}</footer>
    </div>
  </main>;
}
