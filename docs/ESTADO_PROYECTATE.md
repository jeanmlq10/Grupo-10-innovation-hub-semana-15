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
| `/login`, `/registro` | Formularios visuales; envío deshabilitado hasta integrar identidad de Roble. |
| `/explorar` | Busca y filtra proyectos. Muestra ejemplos solo en desarrollo cuando Roble está desactivado. |
| `/mis-proyectos` | Pestañas y tarjetas de ejemplo en desarrollo; cuenta real pendiente. |
| `/proyectos/[id]` | Detalle de ejemplo con pestañas de descripción, tareas, miembros y actividad. Acciones privadas pendientes. |
| `/notificaciones` | Lista de ejemplo, búsqueda, filtro y marcar leído solo en memoria de la página. |
| `/perfil`, `/perfil/trayectoria` | Perfil, menú y estadísticas de ejemplo. |
| `/proyectos/nuevo` | Asistente interactivo desde «Comencemos» hasta revisión. Valida nombre y descripción, permite roles y tareas; publicación deshabilitada. Los datos se conservan solo mientras la página sigue abierta. |
| `/mensajes`, `/perfil/ajustes` | Estructura y estados vacíos para servicios privados aún no conectados. |

## Suposiciones de integración pendientes de comprobar

1. Móvil y web usan el mismo contrato de Roble y el `userId` devuelto por su identidad; el correo no vincula los datos.
2. `projects` representa proyectos publicados y borradores. Antes de activar lectura pública, Roble debe impedir por API que visitantes y otros usuarios lean borradores o tareas privadas. `ROBLE_PUBLIC_READ_ENABLED` sigue en `false`.
3. Proyectos privados, solicitudes, perfiles, mensajes y notificaciones requieren autorización real del lado de Roble o de un servicio compartido por ambos clientes. Un filtro de pantalla no resuelve el acceso directo a la API.
4. El contrato concreto de inicio de sesión, recuperación, Microsoft SSO, CORS, renovación de sesión y permisos se confirmará con dos cuentas controladas y acceso a la consola.
5. Las vistas de demostración no escriben ni simulan una sesión real. En compilación de producción no se muestran tarjetas ni estadísticas ficticias.

## Siguiente integración

Cuando llegue el acceso, ejecutar `docs/ROBLE_ACCESS_AUDIT.md` con dos cuentas de prueba, corregir permisos incompatibles con la app móvil y conectar primero identidad y lectura segura de proyectos. Luego conectar escrituras y vistas privadas, verificando cada flujo en ambos clientes.

La asignación a Óscar de `docs/REPARTO_JEAN_OSCAR.md` era el plan anterior; Jean asumió la implementación web completa mientras Óscar resuelve su conexión.
