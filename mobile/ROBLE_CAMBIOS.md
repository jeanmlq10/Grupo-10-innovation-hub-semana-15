# Cambios en Roble para las correcciones de noviembre 2026

Proyecto de Roble: `movil_flutter_dcaabc5f4e` (el mismo de siempre).
Este documento complementa `ROBLE_PROJECTS_SETUP.md`: **no se borra ni se
renombra ninguna tabla ni columna existente**, solo se agregan.

## Estado: APLICADO el 10 nov 2026

Todo lo de este documento ya está creado en Roble. Las columnas y tablas se
hicieron con la **Consola SQL** de Roble (PostgreSQL) y la propiedad de las
filas desde **Estructura de datos → ⋮ → Propiedad de las filas**. El script
exacto que se ejecutó está en `roble/2026-11-10_correcciones.sql`. Es
idempotente, así que se puede volver a correr sin daño.

Lo que se encontró al revisar el esquema real:
- **Faltaban tablas:** `user_profiles` y `direct_messages`. Por eso el chat
  mostraba "La tabla direct_messages no existe".
- **Faltaban columnas:** `actorUserId`, `actorName` y `detail` en `app_notifications`.
- **`app_notifications` tenía "Actualizar sólo lo propio" encendido.** Con eso,
  el destinatario no podía marcar sus notificaciones como leídas. Se apagó.
- **Permisos del rol `user`:** ya tiene crear, leer y borrar en todas las
  tablas, y actualizar en sus propias filas. No hubo que tocarlos.

Para verificar en la Consola SQL:

```sql
SELECT table_name, enforce_read, enforce_update, enforce_delete
FROM auth.table_policies ORDER BY 1;
```

Correcciones a lo que decía antes este documento: Roble **sí** tiene Consola
SQL (PostgreSQL), y también una "Base de datos JSON" en tiempo real. Esa base
es independiente de las tablas, así que el chat sigue usando `direct_messages`
y buscando mensajes nuevos cada 5 s. Lo que sí sigue siendo cierto: no hay
políticas de lectura por condición (por ejemplo, "solo integrantes del proyecto").

## 1. Eliminar proyectos (Corrección 5) · OBLIGATORIO para eliminar publicados

| Tabla | Columna nueva | Tipo | Para qué |
|---|---|---|---|
| `projects` | `deletedAt` | text | Fecha ISO de la eliminación lógica. Vacía = proyecto activo |

**Decisión: eliminación lógica para proyectos publicados, física para borradores.**

- Un proyecto **publicado** tiene filas que pertenecen a **otras personas**:
  solicitudes (`project_requests`), comentarios, seguimientos, integrantes y
  notificaciones. Con "Eliminar sólo lo propio", el creador **no puede**
  borrarlas, y si se borrara solo el proyecto quedarían huérfanas. Por eso la
  app no lo borra: escribe `deletedAt` (y lo deja como privado: `isDraft = true`,
  `audience = "Solo yo"`). Así, aunque alguien lea la tabla por la API, el
  proyecto no cumple la condición de "publicado".
- Un **borrador** nunca recibió registros de otras personas: se borra de
  verdad, con sus tareas (igual que antes).
- La app excluye `deletedAt` en Mis proyectos, Explorar (con sesión y como
  visitante) y al abrir un proyecto por id.
- Solo el creador puede eliminar: la app lo valida y Roble también, con
  "Actualizar sólo lo propio" en `projects`, que ya está activo.

Sin la columna `deletedAt`, la app **no cambia nada** y muestra "falta la
columna deletedAt".

## 2. Tareas "Solo equipo" (Corrección 4.2) · OBLIGATORIO para usar "Solo equipo"

### 2.1 Columna nueva

| Tabla | Columna nueva | Tipo | Valores |
|---|---|---|---|
| `project_tasks` | `visibility` | text | `public` (por defecto) o `team` |

### 2.2 Tabla nueva `project_task_private`

| Columna | Tipo | Para qué |
|---|---|---|
| `taskId` | text | `_id` de la fila de `project_tasks` |
| `projectId` | text | `_id` del proyecto (para leer todo el proyecto de una vez) |
| `title` | text | Título real de la tarea |
| `description` | text | Descripción real de la tarea |

Propiedad (icono de escudo):

| Ver de quién es cada fila | Leer sólo lo propio | Actualizar sólo lo propio | Eliminar sólo lo propio |
|---|---|---|---|
| ✅ | ❌ (los integrantes deben leerla) | ✅ | ✅ |

- **NO** la marques como pública.
- Rol `user` (Configuración → Permisos): **Actualizar** y **Borrar** en `project_task_private`.

### Cómo se protege la privacidad

`project_tasks` tiene que seguir siendo pública porque Explorar la usa en
modo visitante. Por eso el **contenido** de una tarea "Solo equipo" no se
guarda ahí: su fila pública queda con `visibility = "team"` y **sin título ni
descripción**, y el contenido real va a `project_task_private`, que no es
pública.

| Quién consulta | Qué obtiene de una tarea "Solo equipo" |
|---|---|
| Visitante o `public-read` directo a la API | Solo que existe una tarea interna (sin título ni descripción) |
| Usuario con sesión, en la app, que no es del equipo | Lo mismo: la app no lee `project_task_private` para él |
| Creador e integrantes, en la app | La tarea completa |
| Usuario con sesión que llama a la API a mano | ⚠️ Puede leer `project_task_private` |

⚠️ **Límite de Roble:** no puede filtrar la lectura por "es integrante del
proyecto X". Hay dos opciones y la decides tú:

- **A. (la que queda configurada)** "Leer sólo lo propio" **apagado**. Los
  integrantes ven las tareas internas. Un usuario con sesión que use la API
  directamente podría leerlas. Es el mismo límite que ya tienen
  `app_notifications`, `direct_messages` y `user_profiles`.
- **B. (más estricta)** "Leer sólo lo propio" **encendido**. Nadie más que el
  creador puede leer el contenido, ni siquiera por la API. A cambio, los
  integrantes verán la tarea como "Tarea interna" sin título.

Cambiar la visibilidad mueve el contenido entre las dos tablas **sin cambiar
el `_id` de la tarea**, así que no se rompen las postulaciones ni los
integrantes que apuntan a ella. Si la tabla o la columna no existen, la app
dice exactamente qué falta y no deja tareas a medias.

## 3. Respuestas a comentarios (Corrección 4.4) · OBLIGATORIO para responder

| Tabla | Columna nueva | Tipo | Para qué |
|---|---|---|---|
| `project_comments` | `parentId` | text | `_id` del comentario al que responde. Vacío = comentario principal |

- La estructura actual (projectId, authorUserId, authorName, text, createdAt)
  ya asocia cada comentario a su proyecto. Solo faltaba `parentId` para los hilos.
- Los comentarios principales funcionan aunque la columna no exista. Para
  responder, la app pide la columna.
- Rol `user`: nada nuevo (crear y leer ya los tiene).

## 4. Notificaciones (Corrección 6) · sin cambios de esquema

- El estado de lectura usa la columna `read` que ya existe. "Marcar todas como
  leídas" y el punto de la barra inferior se basan en ella.
- Tipo nuevo en la columna `type` (texto, no requiere configuración):
  `comment_reply`, "Respuesta a tu comentario".
- Duplicados: la app agrupa avisos iguales (mismo tipo, proyecto, solicitud,
  persona y minuto) y, al leer uno, marca también sus copias.
- Recuerda lo de `ROBLE_PROJECTS_SETUP.md`: el rol `user` necesita
  **Actualizar** en `app_notifications`, y "Actualizar sólo lo propio" debe
  estar **apagado** en esa tabla. Si no, marcar como leída falla en silencio.

## 5. Perfil y actividad (Corrección 8) · sin cambios de esquema

Las estadísticas (proyectos completados, tareas completadas, participaciones,
compromiso, proyectos activos, publicaciones), el desempeño y la actividad
reciente **se calculan** a partir de las tablas que ya existen: `projects`,
`project_members`, `project_tasks`, `project_comments`, `project_follows`,
`project_requests` y `user_profiles`. No se guardan números aparte, así que
no pueden quedar desactualizados. Si no hay datos para un indicador, la app
muestra "Sin información suficiente".

## 6. Mensajes (Corrección 9) · sin cambios de esquema

Se reutiliza `direct_messages` (fromUserId, fromName, toUserId, toName, text,
read, createdAt). No se creó un sistema paralelo.

- Cada conversación tiene exactamente dos participantes (`fromUserId`/`toUserId`).
- La app solo lee los mensajes donde la persona es remitente o destinataria, y
  descarta los que no escribió quien dice enviarlos (`_owner`).
- **Tiempo real:** la API de tablas de Roble no tiene suscripciones (su "Base de datos JSON" en tiempo real es aparte). El chat busca
  mensajes nuevos cada 5 s mientras está abierto y en primer plano, y solo
  vuelve a pintar si algo cambió.
- ⚠️ Mismo límite que ya está en `ROBLE_PROJECTS_SETUP.md`: `direct_messages`
  no puede tener "Leer sólo lo propio" porque el destinatario debe leer el
  mensaje. Alguien con sesión que llame a la API a mano podría leer mensajes
  ajenos. Cerrar ese hueco requiere un backend propio (por ejemplo, una
  función de servidor) que Roble no ofrece hoy.

## 7. Archivos e imagen del proyecto · APLICADO (10 nov 2026)

Script: `roble/2026-11-10_demo_esquema.sql`.

| Tabla / columna | Para qué |
|---|---|
| `projects.imageFileId` (text) | Id del archivo de la portada en el bucket. La URL firmada se pide al mostrarla |
| `projects.objectives` (jsonb) y `projects.stage` (text) | Objetivos y etapa, que se muestran en Resumen |
| Tabla `project_attachments` | projectId, fileId, fileName, extension, mimeType, sizeBytes, folder, kind, uploadedBy, createdAt |
| `demoSeed` (text) en 11 tablas | Marca los datos de demostración (`demo-2026-11`) |

**Propiedad de las filas:**
- `project_attachments`: eliminar y actualizar sólo lo propio ✅, leer sólo lo propio ❌, no pública.
- `request_decisions`: se activó ahora con eliminar y actualizar sólo lo propio. Antes no tenía dueño y cualquiera con sesión podía registrar una decisión.

**Almacenamiento (Configuración → Almacenamiento):**
- Bucket `movil-archivos` en R2, con acceso público **desactivado**.
- El 10 nov estaba vacío (0 objetos), así que no hubo nada que limpiar.

## Resumen de pasos (ya aplicados)

1. `projects` → columna `deletedAt` (text).
2. `project_tasks` → columna `visibility` (text).
3. Crear tabla `project_task_private` (taskId, projectId, title, description: text) → escudo: ver de quién ✅, leer sólo lo propio ❌, actualizar ✅, eliminar ✅ · **no pública**.
4. Permisos del rol `user`: **Actualizar** y **Borrar** en `project_task_private`.
5. `project_comments` → columna `parentId` (text).
6. Verifica en `app_notifications`: rol `user` con **Actualizar**; "Actualizar sólo lo propio" **apagado**.
7. (Más adelante) `projects.imageUrl` y la tabla `project_attachments`, cuando exista el bucket.

No hay que cambiar variables de entorno.
