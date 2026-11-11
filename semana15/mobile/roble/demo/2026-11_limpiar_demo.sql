-- Borra SOLO los datos de demostración (demo-2026-11). No toca usuarios ni datos reales.
-- Los archivos de R2 (portadas y documentos demo) se borran con scripts/demo/subir_portadas.mjs --borrar
DELETE FROM public.app_notifications WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.direct_messages WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_comments WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_follows WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.request_decisions WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_members WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_requests WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_task_private WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_tasks WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.project_attachments WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.projects WHERE "demoSeed" = 'demo-2026-11';
DELETE FROM public.user_profiles WHERE "demoSeed" = 'demo-2026-11';
