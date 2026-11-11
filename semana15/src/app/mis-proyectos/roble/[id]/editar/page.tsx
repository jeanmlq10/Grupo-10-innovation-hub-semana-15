"use client";

import { Suspense, use } from "react";
import { RobleProjectWizard } from "@/components/ProjectWizard";

export default function EditRobleProjectPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="empty-panel">Cargando proyecto…</main>}><Editor params={params} /></Suspense>;
}

function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <RobleProjectWizard projectId={id} />;
}
