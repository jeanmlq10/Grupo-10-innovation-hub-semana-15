-- Cambios de esquema para almacenamiento de archivos y datos de demostración.
-- Aplicado el 10 nov 2026 en la Consola SQL de Roble. Solo agrega; es idempotente.

-- Imagen del proyecto: id del archivo en el bucket (la URL firmada se pide al mostrarla).
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "imageFileId" text;
-- Objetivos (lista JSON) y etapa de desarrollo, mostrados en la pestaña Resumen.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "objectives" jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "stage" text;

-- Marca de datos de demostración ('demo-2026-11'); la app no la lee ni la escribe.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.project_task_private ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.project_requests ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.request_decisions ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.project_members ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.project_comments ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.project_follows ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.app_notifications ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.direct_messages ADD COLUMN IF NOT EXISTS "demoSeed" text;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS "demoSeed" text;

-- Metadata de los documentos de contexto guardados en el bucket.
CREATE TABLE IF NOT EXISTS public.project_attachments (
  "projectId" text, "fileId" text, "fileName" text, "extension" text, "mimeType" text,
  "sizeBytes" integer, "folder" text, "kind" text, "uploadedBy" text, "createdAt" text, "demoSeed" text
);

-- Propiedad de las filas (consola → Estructura de datos → ⋮ → Propiedad de las filas):
--   project_attachments: eliminar sólo lo propio ✅ · actualizar sólo lo propio ✅ · leer sólo lo propio ❌ · no pública
--   request_decisions:   eliminar sólo lo propio ✅ · actualizar sólo lo propio ✅ · leer sólo lo propio ❌
--     (antes no tenía dueño: cualquiera con sesión podía registrar una decisión)
