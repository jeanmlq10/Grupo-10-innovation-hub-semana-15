"use client";

import { Suspense, use } from "react";
import { ProjectWizard } from "@/components/ProjectWizard";

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando proyecto…</main>}><EditProject params={params} /></Suspense>;
}
function EditProject({ params }: { params: Promise<{ id: string }> }) { const { id } = use(params); return <ProjectWizard projectId={id} />; }
