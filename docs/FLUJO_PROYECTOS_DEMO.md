# Flujo de proyectos sin acceso a Roble

La demostración funciona **solo con `npm run dev`**. Guarda los proyectos en `localStorage` de este navegador bajo `proyectate-projects-demo-v1`; no crea cuentas ni envía información a Roble. «Cuenta de prueba A» y «Cuenta de prueba B» son identidades ficticias que se cambian desde el selector de la interfaz. «Reiniciar» devuelve los datos iniciales. Al borrar los datos del navegador se pierde este contenido.

## Recorrido para revisar

1. Con **A**, entra a `/proyectos/nuevo`, escribe el nombre de una idea, continúa, añade descripción y guarda un borrador. Ve a «Mis borradores», edítalo y publícalo con audiencia «Toda la comunidad». Si eliges «Solo yo», seguirá siendo privado.
2. En `/explorar`, busca el proyecto y abre su detalle. Puedes añadir tareas, roles y fechas desde «Editar proyecto». Los borradores no aparecen en Explorar y la cuenta B tampoco puede abrirlos por URL.
3. Cambia a **B**. En el detalle de un proyecto de A, sigue el proyecto, comenta y solicita un cupo de equipo o tarea. La solicitud queda pendiente. Vuelve a «Explorar → Seguidos» para encontrar el proyecto seguido.
4. Cambia a **A**. En el detalle del proyecto, acepta o rechaza la solicitud. Al aceptar, se actualizan el miembro y el cupo. A puede cambiar el estado de sus tareas y editar o eliminar sus proyectos.

La demostración aplica reglas de propietario y visibilidad en el navegador para revisar el flujo, **pero no son controles de seguridad**. Antes de cualquier publicación real deben verificarse los permisos de Roble con dos cuentas auténticas, según `docs/ROBLE_ACCESS_AUDIT.md`.

## Contrato usado como referencia

| Demostración | Roble móvil esperado |
|---|---|
| `ProjectRecord` | Fila de `projects` con `name`, `description`, `categories`, `teamRoles`, `acceptedRoleCounts`, `duration`, `audience`, `isDraft`, `teamDeadline`, `_owner` y fechas. |
| `ProjectTask` | Fila de `project_tasks` con `projectId`, `requiredCount`, `acceptedCount`, `deadline` y `status`. |
| `ProjectRequest` | Fila de `project_requests`; la decisión del dueño corresponde a `request_decisions`. |
| `members` | Filas de `project_members`. |
| `comments` | Filas de `project_comments`. |
| `followers` | Filas de `project_follows`. |

Las acciones puras están en `src/lib/projects/demo-domain.ts`; la persistencia local está aislada en `src/lib/projects/demo-browser.ts`. El adaptador de lectura pública real permanece en `src/lib/roble/projects.ts` y desactivado por defecto. Sustituir el almacenamiento local por Roble requiere confirmar el contrato HTTP, autenticación, permisos de cada tabla y transacciones o compensación para decisiones que actualizan varias tablas.
