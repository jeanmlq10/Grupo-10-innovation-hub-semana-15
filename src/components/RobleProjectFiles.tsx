"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import type { ProjectFiles } from "@/lib/roble/project-files";

export function RobleProjectFiles({ projectId, section = "cover" }: { projectId: string; section?: "cover" | "documents" }) {
  const [files, setFiles] = useState<ProjectFiles | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/projects/explore/${encodeURIComponent(projectId)}/files`, { credentials: "same-origin", cache: "no-store" })
      .then(async response => { if (response.ok && active) { const body: { files: ProjectFiles } = await response.json(); if (active) setFiles(body.files); } })
      .catch(() => undefined);
    return () => { active = false; };
  }, [projectId]);

  if (section === "documents") return files?.documentsVisible ? <section className="surface-panel project-documents"><h2>Documentos del proyecto</h2>{!files.documentsAvailable ? <p>Los documentos no están disponibles en Roble en este momento.</p> : files.documents.length === 0 ? <p>Todavía no hay documentos adjuntos.</p> : <ul>{files.documents.map(file => <li key={file.id}><a href={file.downloadUrl} target="_blank" rel="noopener noreferrer">{file.name}</a>{file.sizeBytes != null && <small> · {(file.sizeBytes / 1024).toFixed(0)} KB</small>}</li>)}</ul>}</section> : null;

  return <div className="project-hero">{files?.imageUrl ? (
      // Roble entrega una URL firmada temporal; el optimizador de Next.js no puede reutilizarla.
      // eslint-disable-next-line @next/next/no-img-element
      <img className="project-cover-image" src={files.imageUrl} alt="Portada del proyecto" />
    ) : <span className="project-hero-symbol"><Icon name="leaf" size={56} /></span>}</div>;
}
