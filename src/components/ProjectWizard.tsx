"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { DemoAccountToolbar } from "@/components/DemoAccountToolbar";
import { Icon } from "@/components/Icon";
import { saveProject, type ProjectInput, type ProjectRecord, type ProjectTask } from "@/lib/projects/demo-domain";
import { updateDemoWorkspace, useDemoWorkspace } from "@/lib/projects/demo-browser";

const steps = ["Comencemos", "Información básica", "Equipo necesario", "Tiempo estimado", "Audiencia", "Revisar y publicar"] as const;
const roleOptions = ["Diseñador/a", "Desarrollador/a", "Investigador/a", "Comunicador/a", "Líder de proyecto"];
const blank: ProjectInput = { name: "", description: "", categories: [], audience: "Toda la comunidad", duration: "Semanas", teamRoles: {}, teamDeadline: "", tasks: [] };

export function ProjectWizard({ projectId }: { projectId?: string }) {
  const state = useDemoWorkspace();
  const existing = projectId ? state.projects.find(project => project.id === projectId && project.ownerId === state.actor) : undefined;
  if (process.env.NODE_ENV !== "development") return <main className="empty-panel"><h1>Creación pendiente</h1><p>Se habilitará cuando validemos la sesión y los permisos de Roble.</p></main>;
  if (projectId && !existing) return <main className="empty-panel"><h1>No puedes editar este proyecto</h1><p>Selecciona la cuenta de prueba creadora o vuelve a Mis proyectos.</p><Link href="/mis-proyectos" className="solid-action">Mis proyectos</Link><DemoAccountToolbar /></main>;
  return <WizardForm key={`${projectId ?? "new"}-${state.actor}`} existing={existing} />;
}

function WizardForm({ existing }: { existing?: ProjectRecord }) {
  const router = useRouter();
  const [step, setStep] = useState(existing ? 1 : 0);
  const [form, setForm] = useState<ProjectInput>(() => existing ? { name: existing.name, description: existing.description, categories: existing.categories, audience: existing.audience, duration: existing.duration, teamRoles: existing.teamRoles, teamDeadline: existing.teamDeadline, tasks: existing.tasks } : blank);
  const [categoryText, setCategoryText] = useState(() => existing?.categories.join(", ") ?? "");
  const [error, setError] = useState("");
  const set = (change: Partial<ProjectInput>) => setForm(current => ({ ...current, ...change }));
  const updateTask = (index: number, update: Partial<ProjectTask>) => setForm(current => ({ ...current, tasks: current.tasks.map((task, at) => at === index ? { ...task, ...update } : task) }));
  const save = (publish: boolean) => {
    try {
      const id = existing?.id ?? crypto.randomUUID();
      updateDemoWorkspace(current => saveProject(current, { ...form, categories: categoryText.split(",").map(value => value.trim()).filter(Boolean) }, id, publish, new Date().toISOString()));
      router.push(publish && form.audience === "Toda la comunidad" ? `/proyectos/${id}` : "/mis-proyectos");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo guardar el proyecto."); }
  };
  const next = () => {
    if (!form.name.trim()) { setError("Escribe el nombre de tu idea para continuar."); return; }
    if (step === 1 && !form.description.trim()) { setError("Añade una descripción para continuar."); return; }
    setError(""); setStep(current => Math.min(current + 1, steps.length - 1));
  };
  return <main className="wizard-shell">
    <aside className="wizard-sidebar"><Link href="/mis-proyectos" className="page-back"><Icon name="back" size={18} /> Mis proyectos</Link><BrandLogo className="wizard-brand" /><h1>{existing ? "Editar proyecto" : "Crear proyecto"}</h1><p>Convierte tu idea en un proyecto real</p><ol>{steps.map((item, index) => <li className={index === step ? "current" : index < step ? "done" : ""} key={item}><span>{index < step ? <Icon name="check" size={16} /> : index + 1}</span>{item}</li>)}</ol><DemoAccountToolbar compact /></aside>
    <div className="wizard-main"><div className="wizard-progress"><div><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><span>{step + 1}/{steps.length}</span></div>{step > 0 && <div className="wizard-mobile-demo"><DemoAccountToolbar /></div>}
      <div className={`wizard-content ${step === 0 ? "idea-intro" : ""}`}>
        {step === 0 && <><div className="wizard-intro-copy"><Link className="wizard-mobile-back" href="/explorar" aria-label="Volver"><Icon name="back" size={24} /></Link><h2>Comencemos</h2><p>Tu idea puede generar un gran cambio. Cuéntanos un poco sobre ella.</p></div><BrandLogo variant="symbol" className="wizard-idea-symbol" /><div className="wizard-intro-field"><label className="sr-only" htmlFor="idea-name">Nombre de tu idea</label><input id="idea-name" value={form.name} onChange={event => set({ name: event.target.value })} placeholder="Nombre de tu idea" /></div></>}
        {step === 1 && <><h2>Información básica</h2><p className="wizard-lead">Cuéntanos sobre tu proyecto</p><div className="wizard-form-field"><label htmlFor="project-name">Nombre del proyecto</label><input id="project-name" value={form.name} onChange={event => set({ name: event.target.value })} /></div><div className="wizard-form-field"><label htmlFor="project-description">Descripción</label><textarea id="project-description" value={form.description} onChange={event => set({ description: event.target.value })} placeholder="¿Qué problema resuelve y cómo funcionará?" rows={6} /></div><div className="wizard-form-field"><label htmlFor="project-categories">Categorías</label><input id="project-categories" value={categoryText} onChange={event => setCategoryText(event.target.value)} placeholder="Educación, Tecnología" /><small>Separa las categorías con comas.</small></div></>}
        {step === 2 && <><h2>Equipo necesario</h2><p className="wizard-lead">¿Qué miembros necesitas?</p><div className="wizard-roles">{roleOptions.map(role => <div className="wizard-role" key={role}><span><Icon name="user" />{role}</span><div><button type="button" aria-label={`Restar ${role}`} onClick={() => set({ teamRoles: { ...form.teamRoles, [role]: Math.max(0, (form.teamRoles[role] || 0) - 1) } })}>−</button><strong>{form.teamRoles[role] || 0}</strong><button type="button" aria-label={`Sumar ${role}`} onClick={() => set({ teamRoles: { ...form.teamRoles, [role]: (form.teamRoles[role] || 0) + 1 } })}>+</button></div></div>)}</div><div className="wizard-form-field"><label htmlFor="team-deadline">Fecha límite para postularse al equipo</label><input id="team-deadline" type="date" value={form.teamDeadline} onChange={event => set({ teamDeadline: event.target.value })} /></div><div className="wizard-task-list"><h3>Información de tareas</h3><p>Configura las tareas de tu proyecto</p>{form.tasks.map((task, index) => <div className="wizard-task" key={task.id}><div className="wizard-task-title"><strong>Tarea {index + 1}</strong><button type="button" onClick={() => set({ tasks: form.tasks.filter(item => item.id !== task.id) })} aria-label={`Eliminar tarea ${index + 1}`}>Eliminar</button></div><label>Título<input value={task.title} onChange={event => updateTask(index, { title: event.target.value })} placeholder="Nombre de la tarea" /></label><label>Descripción<input value={task.description} onChange={event => updateTask(index, { description: event.target.value })} placeholder="Qué hay que hacer" /></label><div className="wizard-task-fields"><label>Personas necesarias<input type="number" min={Math.max(1, task.acceptedCount)} value={task.requiredCount} onChange={event => updateTask(index, { requiredCount: Math.max(task.acceptedCount, 1, Number(event.target.value)) })} /></label><label>Disponible hasta<input type="date" value={task.deadline} onChange={event => updateTask(index, { deadline: event.target.value })} /></label></div></div>)}<button type="button" className="outline-action" onClick={() => set({ tasks: [...form.tasks, { id: crypto.randomUUID(), title: "", description: "", requiredCount: 1, acceptedCount: 0, deadline: "", status: "available" }] })}><Icon name="plus" size={16} /> Agregar otra tarea</button></div></>}
        {step === 3 && <><h2>Tiempo estimado</h2><p className="wizard-lead">¿Cuánto tiempo crees que tomará?</p><div className="choice-list">{[["Días", "1–30 días"], ["Semanas", "1–12 semanas"], ["Meses", "1–12 meses"], ["Años", "Más de 1 año"]].map(([value, subtitle]) => <button type="button" className={form.duration === value ? "choice selected" : "choice"} key={value} onClick={() => set({ duration: value })}><Icon name="clock" /><span><strong>{value}</strong><small>{subtitle}</small></span><i /></button>)}</div></>}
        {step === 4 && <><h2>Audiencia</h2><p className="wizard-lead">¿Quién puede ver tu proyecto?</p><div className="choice-list">{[["Solo yo", "Tu proyecto será privado"], ["Toda la comunidad", "Tu proyecto será visible para todos los usuarios"]].map(([value, subtitle]) => <button type="button" className={form.audience === value ? "choice selected" : "choice"} key={value} onClick={() => set({ audience: value as ProjectInput["audience"] })}><Icon name={value === "Solo yo" ? "shield" : "user"} /><span><strong>{value}</strong><small>{subtitle}</small></span><i /></button>)}</div></>}
        {step === 5 && <><h2>Revisar y publicar</h2><p className="wizard-lead">Confirma la información de tu proyecto</p><div className="review-list"><div><span>Nombre</span><strong>{form.name}</strong></div><div><span>Descripción</span><strong>{form.description}</strong></div><div><span>Categorías</span><strong>{categoryText || "Sin categorías"}</strong></div><div><span>Equipo</span><strong>{Object.entries(form.teamRoles).filter(([, count]) => count > 0).map(([role, count]) => `${count} ${role}`).join(" · ") || "Sin roles definidos"}</strong></div><div><span>Tareas</span><strong>{form.tasks.length}</strong></div><div><span>Tiempo estimado</span><strong>{form.duration}</strong></div><div><span>Audiencia</span><strong>{form.audience}</strong></div></div><p className="auth-pending">Demostración local: esta acción guarda únicamente en este navegador. No escribe en Roble.</p></>}
      </div>
      <footer className="wizard-footer">{error && <p role="alert" className="wizard-error">{error}</p>}{step > (existing ? 1 : 0) && <button type="button" className="outline-action" onClick={() => { setError(""); setStep(current => current - 1); }}>Anterior</button>}{step > 0 && <button type="button" className="outline-action" onClick={() => save(!!existing && !existing.isDraft)}>{existing && !existing.isDraft ? "Guardar cambios" : "Guardar borrador"}</button>}{step < steps.length - 1 ? <button type="button" className="solid-action" onClick={next}>Continuar</button> : <button type="button" className="solid-action" onClick={() => save(true)}>{form.audience === "Solo yo" ? "Guardar privado" : "Publicar demo"}</button>}</footer>
    </div>
  </main>;
}
