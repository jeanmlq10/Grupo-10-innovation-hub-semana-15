# Módulo de proyectos en Roble

Todo el módulo de proyectos (proyectos, borradores, audiencia, roles, tareas,
solicitudes, decisiones, miembros, comentarios, seguimientos y
notificaciones) se lee y escribe en Roble con el SDK oficial `roble`,
reutilizando el mismo cliente y la misma sesión del login (`core/roble/roble_client.dart`).
Cada feature tiene su propio datasource de Roble (ver `README.md`).

La app usa **exactamente** las tablas que ya existen en el proyecto
`movil_flutter_dcaabc5f4e` (no hay que crear nada más):

| Tabla | Columnas que usa la app |
|---|---|
| `projects` | name, description, categories, canApply, teamRoles, acceptedRoleCounts, duration, audience, isDraft, acceptedMembersCount, createdBy, createdByName, **createdAt**, **teamDeadline** |
| `project_tasks` | projectId, title, description, requiredCount, acceptedCount, **deadline**, **status** |
| `project_requests` | projectId, type, taskId, teamRoleId, role, message, applicantUserId, applicantName, applicantEmail, status, createdAt, updatedAt |
| `request_decisions` | requestId, status, decidedAt |
| `project_members` | projectId, userId, name, email, role, joinedAt, sourceType, sourceId |
| `project_comments` | projectId, authorUserId, authorName, text, createdAt |
| `project_follows` | projectId, userId, createdAt |
| `app_notifications` | recipientUserId, projectId, requestId, type, title, message, read, createdAt |

Además, en todas se usa `_id` y `_owner` (los pone Roble).

## Cómo funciona

- **Roles del equipo**: viven en la fila del proyecto. `teamRoles` =
  `{"Diseñador/a": 2}` (personas necesarias) y `acceptedRoleCounts` =
  `{"Diseñador/a": 1}` (ya aceptadas). En `project_requests`, `teamRoleId`
  guarda el nombre del rol.
- **Tareas específicas**: filas de `project_tasks` (`requiredCount` /
  `acceptedCount`). Se definen en "Equipo necesario → Tareas específicas".
- **Audiencia**: "Solo yo" guarda de inmediato `isDraft = true`; "Toda la
  comunidad" guarda `isDraft = false`. Siempre la misma fila.
- **Explorar**: `isDraft = false` y `audience = "Toda la comunidad"`.
  **Mis proyectos / Mis borradores**: `_owner` = usuario actual.
- **Solicitudes**: la fila de `project_requests` es del solicitante, por eso
  su `status` queda en `pending`. La decisión del dueño se guarda en
  `request_decisions` y solo cuenta si su `_owner` es el creador del
  proyecto. Aceptar = decisión + contador de la tarea o del rol + fila en
  `project_members` + `acceptedMembersCount` + notificación.
- **Autoría**: creador, autor de comentario, quién sigue y quién decidió se
  leen de `_owner`, que Roble pone con el usuario del token y no se puede
  falsificar desde la app.

## Configuración en la consola (obligatoria)

### 1. Propiedad de las filas (icono de escudo de cada tabla)

En **todas** las tablas: activa **"La aplicación ve de quién es cada fila"**
(sin esto la app no sabe quién creó cada fila) y deja **"Leer sólo lo
propio" apagado**.

| Tabla | Eliminar sólo lo propio | Actualizar sólo lo propio |
|---|---|---|
| `projects` | ✅ | ✅ |
| `project_tasks` | ✅ | ✅ |
| `project_requests` | ✅ | ✅ |
| `request_decisions` | ✅ | ✅ |
| `project_members` | ✅ | ✅ |
| `project_comments` | ✅ | ✅ |
| `project_follows` | ✅ | ✅ |
| `app_notifications` | ✅ | ❌ **apagado** |

`app_notifications` va con "Actualizar sólo lo propio" apagado porque la
fila la crea quien envía el aviso, pero quien la marca como leída es el
destinatario.

### 2. Permisos del rol `user` (Configuración → Permisos)

`user` (el rol de quien se registra) trae de fábrica solo crear y leer. Dale
además:

- **Actualizar**: `projects`, `project_tasks`, `app_notifications`
- **Borrar**: `projects` (eliminar borradores), `project_tasks`, `project_follows`

Con el paso 1, "actualizar/borrar" queda limitado a las filas propias
(Roble responde 404 si alguien intenta tocar un proyecto ajeno, aunque se
salte la app).

### 3. Página 1 actualizada: visitante y filtros (obligatorio)

- **Columna nueva `createdAt` en `projects`** (mismo tipo que `createdAt` de
  `project_comments`). La app la escribe solo al crear un proyecto y la usa el
  filtro "Fecha de creación". Sin esta columna, crear un proyecto falla.
  Los proyectos viejos (sin fecha) aparecen en "Más antiguos".
- **Tablas públicas para el modo visitante**: marcar como **pública** (lectura
  sin sesión) `projects` y `project_tasks`. El visitante las lee con
  `db.publicRead(...)`. Si no son públicas, Roble responde 403 y Explorar sale
  vacío para el visitante. `project_members`, `project_comments`,
  `project_follows`, etc. **no** se hacen públicas: el visitante no ve el
  equipo ni la actividad (la app le pide iniciar sesión).

### 4. Cambio 2: fechas límite y estado de tareas (obligatorio)

Columnas nuevas, todas de tipo **text** (no `date`: así la zona horaria no
mueve el día). La app guarda las fechas como `AAAA-MM-DD`.

| Tabla | Columna | Para qué |
|---|---|---|
| `projects` | `teamDeadline` | "Fecha límite para postularse al equipo" |
| `project_tasks` | `deadline` | "Disponible hasta" de cada tarea |
| `project_tasks` | `status` | `available`, `in_progress` o `completed` (lo cambia el dueño) |

Sin estas columnas, guardar el proyecto o las tareas falla. Filas viejas sin
valor = sin fecha límite y tarea "Disponible".

### 5. Página 4 (Notificaciones) y Mi perfil (obligatorio)

**Tablas nuevas** (crearlas en Estructura de Datos; todas las columnas
`text` salvo donde dice otra cosa):

| Tabla | Columnas | Para qué |
|---|---|---|
| `user_profiles` | userId, name, username, bio, career, profileVisibility, contactPermission, activityVisibility, notificationsEnabled (**bool**), mutedNotifications, updatedAt, avatarIcon | Editar perfil, Privacidad y preferencias de notificaciones |
| `direct_messages` | fromUserId, fromName, toUserId, toName, text, read (**bool**), createdAt | Mi perfil → Mensajes |

**Columnas nuevas en `app_notifications`** (text): `actorUserId`,
`actorName`, `detail`. Si faltan, el aviso se guarda igual sin ellas, pero
el detalle de la notificación sale incompleto.

**Propiedad y permisos** (igual que las demás tablas):

| Tabla | Ver de quién es cada fila | Leer sólo lo propio | Actualizar sólo lo propio | Eliminar sólo lo propio |
|---|---|---|---|---|
| `user_profiles` | ✅ | ❌ (otros ven tu perfil público) | ✅ | ✅ |
| `direct_messages` | ✅ | ❌ (el destinatario debe leerlo) | ❌ (el destinatario lo marca leído) | ✅ |

Rol `user`: dar **Actualizar** y **Borrar** en `user_profiles`, y
**Actualizar** en `direct_messages`.

## Límites conocidos

- Roble no filtra la lectura por condición de fila. La app nunca muestra
  borradores ajenos ni notificaciones de otros, pero alguien que llame la
  API directamente con sesión podría leerlos. Activar "Leer sólo lo propio"
  en `projects` rompería Explorar.
- Si "Actualizar" no está dado al rol `user` en `app_notifications`,
  marcar como leída falla en silencio (la notificación se abre igual).
- Con `projects` pública, cualquiera con el id del proyecto Roble puede leer
  la tabla (incluidos borradores) por la API. La app solo le muestra al
  visitante los proyectos publicados para "Toda la comunidad".
- `direct_messages` y `user_profiles` no se pueden poner "Leer sólo lo
  propio" (la otra persona necesita leerlos). La app solo muestra a cada
  quien sus conversaciones y respeta la privacidad del perfil, pero por la
  API alguien con sesión podría leerlos (mismo límite que
  `app_notifications`).
- "Eliminar cuenta" borra la fila del perfil y cierra la sesión; el usuario
  de Roble lo elimina el administrador desde la consola.
