# Correcciones de noviembre 2026: informe

Se trabajó sobre el proyecto actual (`innovation-hub-react-native`, Expo SDK
58 · React Native 0.88 · TypeScript), sin reconstruirlo y sin cambiar su
arquitectura: clean architecture por feature (`domain` / `data` / `ui`), un
datasource de Roble por feature, el mismo contenedor de dependencias y la
misma navegación. **La conexión con Roble (URL, contrato, login y sesión) no
se tocó.**

> El texto de la solicitud dice "CHISPA", pero las pantallas de referencia
> (Notificaciones, Información básica, Perfil, Chat) son de esta app,
> **Proyéctate**, así que los cambios se hicieron aquí. Se mantuvo la
> identidad visual de Proyéctate (`src/core/theme/brand.ts`).

## Fase 1 · Análisis

| # | Corrección | Qué existía | Qué faltaba |
|---|---|---|---|
| 1 | Escudo en el registro | `verified_user_outlined` arriba del formulario | Reemplazarlo |
| 2 | Contraseña | `PasswordPolicy.validate` (8 caracteres, mayúscula, minúscula, número y símbolo `! @ # $ _ -`, la regla de Roble). Solo daba el primer error al enviar | Lista de requisitos en vivo |
| 3 | Imagen del proyecto | Icono fijo y botón de cámara "próximamente" | Estructura para la imagen (pendiente de Storage) |
| 4 | Vista del proyecto | Pestañas Descripción / Tareas / Miembros / **Actividad**. Botón "Comentar" con hoja inferior sin respuestas | Resumen general, visibilidad de tareas, quitar Actividad, icono de comentarios, respuestas en hilo |
| 5 | Eliminar proyectos | Solo se podían eliminar borradores (borrado físico) | Eliminar publicados de forma segura |
| 6 | Notificaciones | Página con búsqueda, pestañas y filtros en otra pantalla. **Punto fijo** en la barra inferior | Punto conectado a "sin leer", nuevo diseño, filtros rápidos, marcar todas, evitar duplicados |
| 7 | Adjuntos | Nada | Selección local de documentos |
| 8 | Perfil | Trayectoria y desempeño solo en el perfil público y en "Ver más". Desempeño en 0 % sin datos | Perfil completo, "Sin información suficiente", proyectos activos y publicaciones |
| 9 | Mensajería | `direct_messages`, `MessagesPage` y `ChatPage` ya existían | Adaptarlos al diseño y actualizar sin recargar |

Cambios en Roble: ver **`ROBLE_CAMBIOS.md`**.

## Fase 2 · Implementación (archivos)

Todos los archivos van **completos** en el ZIP, con la misma estructura de
carpetas: se pueden copiar y reemplazar tal cual.

### Archivos nuevos (10)

| Ruta | Para qué |
|---|---|
| `src/features/auth/ui/widgets/PasswordRequirementsList.tsx` | Lista de requisitos de contraseña en vivo (C2) |
| `src/features/projects/ui/widgets/ProjectAvatar.tsx` | Imagen del proyecto o icono de su categoría (C3) |
| `src/features/projects/domain/models/projectAttachment.ts` | Documento local y `AttachmentPolicy` (formatos, tamaño, cantidad) (C7) |
| `src/features/projects/ui/widgets/ProjectContextDocuments.tsx` | Sección "Documentos de contexto del proyecto" (C7) |
| `src/features/comments/ui/views/ProjectCommentsPage.tsx` | Pantalla de comentarios del proyecto con hilos (C4.4) |
| `src/core/roble/robleSchema.ts` | Detecta tabla o columna faltante en Roble para explicar qué configurar |
| `__tests__/unit/correcciones.test.ts` | 23 pruebas nuevas |
| `ROBLE_CAMBIOS.md`, `PENDIENTES.md`, `CAMBIOS_NOVIEMBRE.md` | Documentación |

### Archivos modificados (50)

| Ruta | Cambio |
|---|---|
| `package.json`, `package-lock.json` | Agrega `expo-document-picker ~58.0.4` (versión de SDK 58, funciona en Expo Go) |
| `src/core/navigation/routes.ts` | Ruta nueva `ProjectComments { projectId, projectName }` |
| `src/navigation/RootNavigator.tsx` | Registra `ProjectCommentsPage` |
| `src/core/roble/robleClient.ts` | Nombre de la tabla `project_task_private` |
| `src/core/ui/material.tsx` | `InkWell` acepta `accessibilityState` |
| `src/core/ui/materialIconGlyphs.ts` | 9 iconos Material nuevos (reply, attach_file, upload_file…) |
| `src/core/ui/popupMenu.tsx` | Elementos destructivos (en rojo) y `testID` |
| `src/core/utils/dateFormat.ts` | `formatDateTime` y `formatTime` |
| `src/features/auth/domain/passwordPolicy.ts` | `requirements()`: la misma regla, requisito por requisito |
| `src/features/auth/ui/views/SignUpPage.tsx` | Logo de Proyéctate en lugar del escudo; lista de requisitos |
| `src/features/tasks/domain/models/projectTask.ts` | `TaskVisibility` (`public` / `team`), `isTeamOnly`, `hiddenContent` |
| `src/features/tasks/domain/repositories/iTaskRepository.ts` | Opción `teamAccess`; `setVisibility` |
| `src/features/tasks/data/datasources/iTaskDataSource.ts` | Lectura y escritura de `project_task_private` |
| `src/features/tasks/data/datasources/robleTaskDataSource.ts` | Ídem, contra Roble |
| `src/features/tasks/data/repositories/taskRepository.ts` | Guarda el contenido privado fuera de la tabla pública, mueve el contenido al cambiar la visibilidad y excluye las tareas de equipo de Explorar |
| `src/features/projects/domain/models/project.ts` | `imageUrl`, `deletedAt`, `isDeleted`; `isPublic` excluye eliminados |
| `src/features/projects/domain/models/myProject.ts` | `imageUrl`, `categories` |
| `src/features/projects/domain/repositories/iProjectRepository.ts` | `softDelete` |
| `src/features/projects/data/repositories/projectRepository.ts` | `softDelete`; filtra eliminados en `ownedBy`, `explorable` y `getById` |
| `src/features/projects/ui/viewmodels/projectDetailController.ts` | `overview`, `hasTeamAccess`, `setTaskVisibility`, `commentCount`; se quita `activityFor` |
| `src/features/projects/ui/views/ProjectDetailPage.tsx` | Pestañas Resumen / Tareas / Equipo; icono de comentarios con contador; cambiar visibilidad desde el menú de la tarea |
| `src/features/projects/ui/views/TaskInfoPage.tsx` | Selector "Público / Solo equipo" en cada tarea |
| `src/features/projects/ui/viewmodels/createProjectController.ts` | `setTaskVisibility`, `contextDocuments`, `add/removeContextDocument` |
| `src/features/projects/ui/views/BasicInfoPage.tsx` | Sección de documentos; botón de imagen marcado como pendiente |
| `src/features/projects/ui/viewmodels/myProjectsController.ts` | `deleteProject` (borrador: físico; publicado: lógico) |
| `src/features/projects/ui/views/MyProjectsPage.tsx` | Confirmación que explica el efecto de eliminar |
| `src/features/projects/ui/widgets/MyProjectCard.tsx` | Menú de acciones (Editar / Eliminar) y `ProjectAvatar` |
| `src/features/projects/ui/widgets/ProjectCard.tsx` | Usa `ProjectAvatar` |
| `src/features/comments/domain/models/projectComment.ts` | `parentId`, `CommentThread.build` |
| `src/features/comments/data/repositories/commentRepository.ts` | Escribe y lee `parentId` |
| `src/features/comments/ui/viewmodels/commentsController.ts` | `threadsFor`; responder; avisa al autor del comentario y al creador sin duplicar |
| `src/features/comments/ui/widgets/ProjectCommentsSheet.tsx` | `showProjectComments` ahora abre la pantalla nueva |
| `src/features/requests/ui/views/ChooseParticipationPage.tsx` | Pasa el nombre del proyecto a los comentarios |
| `src/features/notifications/domain/models/appNotificationType.ts` | Tipo `comment_reply` |
| `src/features/notifications/domain/models/notificationCategory.ts` | `comment_reply` va a la categoría Comentarios |
| `src/features/notifications/ui/widgets/notificationLabels.ts` | Icono de respuesta |
| `src/features/notifications/ui/viewmodels/notificationsController.ts` | `QuickFilter`, `dedupeNotifications`, `markAllRead`, `refreshIfStale`, `hasUnread` |
| `src/features/notifications/ui/views/NotificationsPage.tsx` | Nuevo diseño: gestionar lectura, pestañas con contadores, filtros desplegables |
| `src/features/notifications/ui/widgets/NotificationTile.tsx` | Tarjeta según la referencia |
| `src/features/home/ui/widgets/HomeBottomNavigation.tsx` | El punto solo aparece si hay notificaciones sin leer |
| `src/features/profile/domain/models/trajectorySummary.ts` | `activeProjects`, `publications` y los indicadores `…OrNull` |
| `src/features/profile/ui/viewmodels/profileController.ts` | Calcula proyectos activos y publicaciones |
| `src/features/profile/ui/views/ProfilePage.tsx` | Perfil completo (8.1 a 8.5) y los accesos que ya existían |
| `src/features/profile/ui/views/PublicProfilePage.tsx` | "Activo en N proyectos \| M publicaciones" y "ENVIAR MENSAJE" |
| `src/features/profile/ui/views/TrajectoryPage.tsx` | Muestra "Sin información suficiente" cuando corresponde |
| `src/features/profile/ui/widgets/PerformanceBar.tsx` | Acepta `null` y entonces muestra "Sin información suficiente" |
| `src/features/messages/ui/viewmodels/messagesController.ts` | Marca como leídos solo si hay mensajes sin leer |
| `src/features/messages/ui/views/ChatPage.tsx` | Cabecera con la persona, separadores por día, se actualiza cada 5 s |
| `src/features/messages/ui/widgets/MessageBubble.tsx` | Remitente, hora y "Leído" |

No se borró ningún archivo. `NotificationFiltersPage.tsx` sigue registrada
como ruta, pero la página de Notificaciones ya no la abre: los filtros
rápidos la reemplazan. Se puede borrar más adelante si no se necesita.

## Fase 3 · Base de datos

Ver **`ROBLE_CAMBIOS.md`**. Resumen: columnas `projects.deletedAt`,
`project_tasks.visibility` y `project_comments.parentId`; tabla
`project_task_private`; permisos del rol `user`. Roble no usa SQL: todo se
hace en su consola, paso a paso.

## Fase 4 · Configuración

- **Variables de entorno:** ninguna nueva. `.env` y `dart_defines.json` no cambian.
- **Dependencia nueva:** `expo-document-picker ~58.0.4`. Basta con `npm install`.
- **Pendientes que dependen de Roble Storage:** ver **`PENDIENTES.md`**.

## Fase 5 · Pruebas

| Verificación | Resultado |
|---|---|
| `npx tsc --noEmit` | 0 errores |
| `npx expo lint` | 0 errores, 0 advertencias |
| `npm run test:ci` | 4 suites, **70 pruebas OK**: las 47 anteriores y 23 nuevas |
| `npx expo export -p web` | Bundle OK |
| Prueba visual (web, 390×844, Playwright) | Revisadas con un Roble **simulado** en el navegador (Roble real no es accesible desde el entorno de trabajo): registro con requisitos, vista general, tareas con "Solo equipo" (como dueño y como visitante), comentarios con respuestas, notificaciones con filtros y marcar todas, eliminar desde Mis proyectos, documentos en Información básica (incluido el rechazo de un PNG), selector de visibilidad en el asistente, perfil propio, perfil público y chat. Sin errores de JavaScript |

Las 23 pruebas nuevas cubren:
- La lista de requisitos de contraseña es la misma regla que `validate`.
- El contenido de una tarea "Solo equipo" nunca queda en `project_tasks`.
- Un visitante o un usuario sin acceso no ve ese contenido; un integrante sí.
- Cambiar la visibilidad conserva el id de la tarea.
- Las tareas "Solo equipo" no cuentan como convocatoria abierta en Explorar.
- Si falta configurar Roble, no quedan tareas a medias.
- Un proyecto eliminado desaparece de Mis proyectos, Explorar y la consulta por id.
- Sin `deletedAt`, eliminar no cambia nada.
- Los comentarios se agrupan en hilos y `parentId` se guarda.
- Se eliminan las notificaciones duplicadas.
- El punto de la barra inferior aparece y desaparece según las notificaciones sin leer.
- Los filtros rápidos, "No leídas" y la búsqueda filtran la lista.
- Se aplica la política de adjuntos.
- El desempeño muestra `null` cuando no hay datos.

**No se pudo probar aquí:** Expo Go en un teléfono real y Roble real. Antes
de probar en el teléfono, hay que hacer los pasos de `ROBLE_CAMBIOS.md`.

### Cómo comprobar cada corrección en el teléfono

1. **Registro:** Bienvenida → "¿No tienes cuenta? Regístrate". Ya no hay
   escudo, y los requisitos se marcan mientras escribes.
2. **Imagen:** en Información básica, el botón de cámara dice que la función
   está pendiente.
3. **Vista del proyecto:** abre un proyecto. Verás Resumen (información,
   creador, avance, integrantes), Tareas y Equipo. Arriba está el icono de
   comentarios, con su número.
4. **Tareas Solo equipo:** crea o edita un proyecto → Información de tareas →
   "Solo equipo". Con otra cuenta que no sea del equipo, la tarea no aparece y
   sale el aviso de "tarea interna". Como dueño, cambia la visibilidad desde
   el menú ⋮ de la tarea.
5. **Comentarios:** toca el icono de comentarios → Responder → "Ver N respuestas".
6. **Eliminar:** Mis proyectos → ⋮ → Eliminar proyecto → confirma. El proyecto
   desaparece de Mis proyectos y de Explorar.
7. **Notificaciones:** el punto de la barra solo aparece si hay notificaciones
   sin leer. Prueba los filtros con el botón ⚙ y "Marcar todas como leídas"
   desde el icono de la bandeja.
8. **Adjuntos:** en Información básica, "Adjuntar archivo". Un PDF se acepta;
   una imagen se rechaza con un mensaje.
9. **Perfil:** pestaña Perfil, y el perfil de otra persona (desde un
   comentario, el creador de un proyecto o el chat).
10. **Chat:** desde el perfil de otra persona, "ENVIAR MENSAJE". Los mensajes
    que te envíen aparecen solos, en menos de 5 s.
