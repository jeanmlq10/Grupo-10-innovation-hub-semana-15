# Estado de Proyéctate · 10 de noviembre de 2026

El repositorio reúne la web Next.js en la raíz y la app Expo/React Native en `mobile/`. Ambas usan el contrato de Roble `movil_flutter_dcaabc5f4e` y comparten la identidad por `userId`. La app Flutter anterior sigue como referencia histórica en su repositorio original.

## Web conectada a Roble en desarrollo

| Flujo | Rutas | Estado |
| --- | --- | --- |
| Cuenta | `/`, `/registro`, `/verificar-correo`, `/login`, `/recuperar-contrasena`, `/restablecer-contrasena`, `/cuenta` | Registro, verificación, sesión y recuperación usan Roble. |
| Explorar | `/explorar`, `/explorar/roble`, `/explorar/roble/[id]` | Catálogo y detalle de proyectos publicados, tareas públicas, búsqueda y filtros. Incluye postulación, comentarios, respuestas y seguimiento. |
| Crear y gestionar | `/mis-proyectos`, `/mis-proyectos/roble`, `/proyectos/nuevo`, `/mis-proyectos/roble/[id]` | Borradores y publicación, edición, cupos, solicitudes y decisiones. El creador puede cambiar el progreso de tareas y eliminar lógicamente un proyecto, igual que móvil. Las tareas solo equipo se reconstruyen para quien creó el proyecto desde `project_task_private`. La web bloquea la edición de proyectos con tareas internas para no perder su privacidad. |
| Participación | `/postulaciones/roble`, `/notificaciones`, `/notificaciones/roble` | Estado de solicitudes y avisos de Roble; permite marcar avisos como leídos. |
| Perfil | `/perfil`, `/perfil/editar`, `/perfil/privacidad`, `/perfil/ajustes/notificaciones`, `/perfil/trayectoria`, `/perfil/actividad`, `/usuarios/[id]` | Consulta y edición de `user_profiles`; trayectoria y actividad calculadas desde Roble. El perfil público respeta visibilidad, contacto y actividad privada dentro de la web. |
| Mensajes | `/mensajes`, `/mensajes/[id]` | Lectura y envío de mensajes directos en Roble. |

Las rutas de demostración profunda `/proyectos/[id]` y `/proyectos/[id]/editar` aún existen para comparar diseños. La navegación principal dirige a Roble. Los recursos de marca oficiales se encuentran en `public/brand/`.

## Diferencias conocidas respecto a móvil

- La app móvil muestra imágenes y documentos R2. La web aún no muestra portadas ni adjuntos y no permite cargarlos.
- La web muestra las tareas internas al creador, pero no permite editarlas. Los miembros del equipo siguen usando móvil para consultarlas.
- La web permite cambiar el progreso de tareas y eliminar proyectos, pero aún no gestiona asignaciones individuales ni eliminación del perfil.
- El perfil web usa los mismos campos que móvil; no gestiona foto de perfil porque móvil todavía ofrece iconos.
- Los recordatorios automáticos y adjuntos de chat siguen pendientes también en móvil (`mobile/PENDIENTES.md`).
- El asistente web no incorpora imagen ni documentos de proyecto y las tareas creadas desde web son públicas. Las tareas internas se crean desde móvil.

## Bloqueo de producción

La integración autenticada web está habilitada solo con `NODE_ENV=development`. El rol común `user` de Roble tiene permisos demasiado amplios, incluido `all:all`, y la API directa permite leer datos que el cliente web oculta. La lectura pública de Roble expuso borradores; `ROBLE_PUBLIC_READ_ENABLED` permanece en `false`. La web filtra por sesión y propietario en sus rutas, pero eso no cierra el acceso directo al backend. Es necesario corregir los permisos del contrato, validar las reglas con dos cuentas y establecer sesiones persistentes seguras antes de desplegar. Véanse `docs/ROBLE_ACCESS_AUDIT.md`, `docs/PLAN_PERMISOS_ROBLE.md` y `docs/E2E_MANUAL_ROBLE.md`.

## Verificación

`npm run lint`, `npm test` y `npm run build` verifican la web. El guion E2E manual con A y B es el siguiente paso para confirmar sincronización real entre ambos clientes.
