# Estado de la adaptación a Proyéctate

Referencia visual recibida: dos capturas móviles de Bienvenida y «Comencemos» y los logos y colores de `proyectate-identidad-visual.zip`. El ZIP contiene una implementación React Native; se usaron sus recursos de marca y `brand.ts` como referencia de diseño, no como instrucciones de implementación web. El prototipo anterior `docs/disenos-web.html` sigue orientando la distribución de escritorio.

## Identidad aplicada

- Logo oficial completo y símbolo en `public/brand/`; icono de app en `src/app/icon.png`.
- Morado principal `#2A0057`, violeta `#8A3FFC`, lima `#D9FF4D` y cian `#7ED6FF`.
- Bienvenida móvil y primer paso «Comencemos» adaptados a las capturas: fondo blanco, jerarquía, logo centrado, botones morados y campos claros.

## Vistas disponibles

| Ruta | Estado actual |
|---|---|
| `/` | Bienvenida navegable con identidad nueva. |
| `/login` | Inicio de sesión real con Roble en desarrollo. Deshabilitado en producción hasta cerrar la auditoría de permisos. |
| `/cuenta` | Consulta la identidad real en Roble (`userId`, correo y nombre) y permite cerrar sesión. No mezcla estos datos con la demostración A/B. |
| `/mis-proyectos/roble` | Lectura y escritura real en desarrollo. Muestra únicamente filas de `projects` cuyo `_owner` coincide con la sesión de Roble, con búsqueda y separación de publicados y borradores. Permite abrir el asistente para crear o editar. |
| `/mis-proyectos/roble/[id]` | Ficha real del proyecto propio: descripción, tareas, roles, miembros y solicitudes con estado derivado de `request_decisions`. La API de la web devuelve campos mínimos y comprueba propietario antes de consultar las tablas relacionadas. La edición se abre en `/mis-proyectos/roble/[id]/editar`. |
| `/proyectos/roble/nuevo` | Asistente de seis pasos para guardar borradores y publicar proyectos reales con tareas en el mismo contrato móvil. La escritura exige sesión y está limitada a desarrollo. |
| `/explorar/roble` | Catálogo real de proyectos publicados para toda la comunidad, en desarrollo y con sesión. Filtra borradores y proyectos privados en el servidor aunque Roble devuelva más filas. Búsqueda y filtro por categoría. |
| `/explorar/roble/[id]` | Ficha pública real de solo lectura con descripción, tareas y cupos del equipo. Rechaza borradores y proyectos privados antes de leer tareas. |
| `/postulaciones/roble` | Solicitudes enviadas desde la cuenta autenticada. Filtra por `applicantUserId`, vuelve a comprobar el usuario en el servidor y muestra el estado de `request_decisions` cuando se puede atribuir al creador del proyecto. |
| `/notificaciones/roble` | Avisos reales de solo lectura, filtrados por `recipientUserId`, con búsqueda y pestaña de no leídos. No modifica `read` en Roble. |
| `/registro`, `/verificar-correo` | Registro institucional y verificación real con Roble en desarrollo; permite reenviar el código. Tras verificar, la persona inicia sesión con la misma cuenta en web y móvil. |
| `/explorar` | Busca y filtra proyectos públicos. En desarrollo lee proyectos de prueba persistentes en este navegador; los seguidos también funcionan localmente. |
| `/mis-proyectos` | Lista por cuenta de prueba A/B, pestañas de publicados y borradores, edición y eliminación locales. |
| `/proyectos/[id]` | Detalle de prueba con tareas, roles, comentarios, seguimiento y solicitudes. La cuenta creadora puede decidir y actualizar el estado de las tareas en el navegador. |
| `/proyectos/[id]/editar` | Edición local del proyecto propio mediante el mismo asistente. |
| `/notificaciones` | Avisos A/B por solicitudes, decisiones, comentarios, tareas completadas y mensajes; búsqueda, filtros y leído persistente por cuenta en el navegador. |
| `/perfil`, `/perfil/editar`, `/perfil/trayectoria`, `/perfil/actividad` | Perfil editable y trayectoria calculada con las acciones de A/B. El historial usa proyectos, comentarios y solicitudes locales. |
| `/proyectos/nuevo` | Asistente interactivo desde «Comencemos» hasta revisión. Permite guardar borrador o publicar **solo en la demostración local**; persiste tras recargar el navegador. |
| `/perfil/ajustes`, `/perfil/privacidad`, `/perfil/ajustes/notificaciones` | Preferencias editables por cuenta ficticia y guardadas solo en el navegador. |
| `/usuarios/[id]` | Vista pública de perfiles A/B: respeta visibilidad y actividad privada dentro de la demostración. |
| `/recuperar-contrasena`, `/restablecer-contrasena` | Solicitud de recuperación y restablecimiento real con token de Roble en desarrollo. |
| `/mensajes`, `/mensajes/[id]` | Bandeja y chat directo A/B. Se inicia desde el perfil público, respeta quién acepta mensajes y conserva el historial y sus no leídos localmente. |

## Suposiciones de integración pendientes de comprobar

1. Móvil y web usan el mismo contrato de Roble y el `userId` devuelto por su identidad; el correo no vincula los datos.
2. `projects` representa proyectos publicados y borradores. Antes de activar lectura pública, Roble debe impedir por API que visitantes y otros usuarios lean borradores o tareas privadas. `ROBLE_PUBLIC_READ_ENABLED` sigue en `false`.
3. Proyectos privados, solicitudes, perfiles, mensajes y notificaciones requieren autorización real del lado de Roble o de un servicio compartido por ambos clientes. Un filtro de pantalla no resuelve el acceso directo a la API. La consola confirma que las tablas `user_profiles` y `direct_messages` aún no existen en este contrato.
4. Se confirmó el contrato de inicio de sesión, `auth/me` y renovación de token con el SDK móvil y una cuenta de prueba. Los endpoints de registro, verificación y recuperación se integraron según el SDK móvil y se probaron con Roble simulado; falta una prueba manual del correo real. Microsoft SSO, permisos y comparación cruzada de datos con dos cuentas siguen pendientes.
5. Las vistas de demostración no escriben en Roble ni representan una sesión real. Las cuentas A/B son identidades locales ficticias. En compilación de producción no se muestran proyectos ni estadísticas ficticias.
6. La privacidad de la demostración solo oculta datos en la interfaz. Antes de publicar perfiles y mensajes, Roble debe aplicar autorización por `userId` y controlar visibilidad, contacto y actividad en la API. Las preferencias actuales se guardan bajo `proyectate-profiles-demo-v1` y se borran junto a los proyectos con «Reiniciar datos».
7. La trayectoria sigue la fórmula de la app móvil para colaboración, cumplimiento y calidad. «Proyectos completados» permanece en 0 porque el modelo de proyectos de esta demostración no tiene estado de finalización.
8. Los avisos de la demo se derivan de acciones guardadas en proyectos y mensajes; silenciar una categoría los oculta de la bandeja y del contador mientras esté silenciada. Los estados de leído y los mensajes se guardan bajo `proyectate-comms-demo-v1`. No hay entrega por correo ni notificaciones push, y las categorías recordatorios/novedades no tienen eventos hasta la integración real.

La guía para recorrer creación, edición y participación local está en `docs/FLUJO_PROYECTOS_DEMO.md`.
La prueba manual de mensajes y notificaciones está en `docs/FLUJO_COMUNICACIONES_DEMO.md`.

## Siguiente integración

La primera prueba real de Roble con una cuenta ya confirmó borradores públicos y avisos de otros destinatarios accesibles mediante la API; los resultados están en `docs/ROBLE_ACCESS_AUDIT.md`. La segunda cuenta de prueba ya fue creada y verificada en la app móvil, y su `userId` coincide al iniciar sesión en la web. Ya hay acceso de lectura a la consola: `projects` es la única tabla pública, `user_profiles` y `direct_messages` no existen, y el rol común `user` tiene permisos globales, incluido `all:all` («Acceso total»). La prioridad es coordinar la contención y el reemplazo de esos permisos con el administrador, además de ejecutar la comparación cruzada A/B. La matriz y secuencia están en `docs/PLAN_PERMISOS_ROBLE.md`; las reglas iniciales de acceso de servidor están implementadas y probadas en `src/lib/roble/access-policy.ts`, pero aún no protegen la API directa. La web ya consulta identidad, proyectos propios, catálogo de publicados, postulaciones enviadas y avisos recibidos, y puede guardar proyectos y tareas en desarrollo. Faltan las verificaciones manuales de `docs/PRUEBA_PROYECTOS_ROBLE.md` y `docs/PRUEBA_ACTIVIDAD_ROBLE.md`, además de las vistas privadas con permisos corregidos.

La asignación a Óscar de `docs/REPARTO_JEAN_OSCAR.md` era el plan anterior; Jean asumió la implementación web completa mientras Óscar resuelve su conexión.
