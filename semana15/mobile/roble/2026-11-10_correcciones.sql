-- Migración aplicada el 10 nov 2026 en Roble (proyecto movil_flutter_dcaabc5f4e)
-- desde Consola SQL. Solo AGREGA columnas y tablas; no borra ni renombra nada.
-- Es idempotente (IF NOT EXISTS): se puede volver a ejecutar sin daño.

-- Corrección 5: eliminación lógica de proyectos publicados
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "deletedAt" text;

-- Corrección 4.2: tareas "Solo equipo"
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS "visibility" text DEFAULT 'public';
CREATE TABLE IF NOT EXISTS public.project_task_private (
  "taskId" text, "projectId" text, "title" text, "description" text
);

-- Corrección 4.4: respuestas a comentarios
ALTER TABLE public.project_comments ADD COLUMN IF NOT EXISTS "parentId" text;

-- Detalle de notificaciones (estaban documentadas pero no existían)
ALTER TABLE public.app_notifications ADD COLUMN IF NOT EXISTS "actorUserId" text;
ALTER TABLE public.app_notifications ADD COLUMN IF NOT EXISTS "actorName" text;
ALTER TABLE public.app_notifications ADD COLUMN IF NOT EXISTS "detail" text;

-- Perfil (Página 5) y mensajes (Corrección 9): tablas que no existían
CREATE TABLE IF NOT EXISTS public.user_profiles (
  "userId" text, "name" text, "username" text, "bio" text, "career" text,
  "profileVisibility" text, "contactPermission" text, "activityVisibility" text,
  "notificationsEnabled" boolean DEFAULT true, "mutedNotifications" text,
  "updatedAt" text, "avatarIcon" text
);
CREATE TABLE IF NOT EXISTS public.direct_messages (
  "fromUserId" text, "fromName" text, "toUserId" text, "toName" text,
  "text" text, "read" boolean DEFAULT false, "createdAt" text
);

-- Roble agrega "_id" solo al crear la tabla. "_owner" lo agregó la consola al
-- activar "Propiedad de las filas" (Estructura de datos → ⋮ → Propiedad de las filas):
--
--   tabla                 eliminar propio  actualizar propio  leer propio
--   project_task_private  sí               sí                 no
--   user_profiles         sí               sí                 no
--   direct_messages       sí               no (el destinatario marca leído)  no
--   app_notifications     sí               no (cambiado: antes estaba en sí y
--                                             el destinatario no podía marcar leído)  no
--
-- Verificación:
--   SELECT table_name, enforce_read, enforce_update, enforce_delete
--   FROM auth.table_policies ORDER BY 1;
