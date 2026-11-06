# Reparto de la migración web entre Jean y Óscar

## Alcance y punto de partida

Flutter sigue funcionando en `Grupo-10-innovation-hub`. La web Next.js se desarrolla en este repositorio y usa **las mismas cuentas y los mismos datos de Roble**, identificados por `userId`. La referencia visual es `docs/disenos-web.html`; las pantallas y reglas móviles completan los flujos que el prototipo no muestra.

La base web ya incluye Bienvenida, Iniciar sesión, Registro y Explorar como interfaz. El acceso y el registro todavía no envían datos a Roble. La consulta pública de proyectos está desactivada hasta resolver la exposición de borradores descrita en `ROBLE_PROJECTS_SETUP.md` del repositorio móvil. Ningún bloque se considera terminado solo porque sus pantallas se vean bien.

## Cuatro entregas completas

| Responsable | Entrega | Resultado que debe demostrar |
|---|---|---|
| **Jean — 1. Cuenta e identidad** | Completar registro institucional, verificación, inicio/cierre de sesión, recuperación de contraseña y Microsoft SSO si está disponible en Roble. Completar perfil propio y público, edición, privacidad, configuración, trayectoria e historial. | La misma cuenta entra en móvil y web, conserva el mismo `userId` y ve/edita el mismo perfil. Cerrar sesión web no borra datos. Otra cuenta no lee ni modifica ese perfil. |
| **Jean — 2. Comunicaciones** | Completar bandeja y detalle de notificaciones, lectura, filtros y preferencias; mensajes, conversaciones, envío, recepción y estados de lectura. Incluir enlaces desde una notificación al proyecto o solicitud correspondiente. | Dos cuentas intercambian mensajes y ven sus propias notificaciones en móvil y web; los destinatarios son correctos y ninguna cuenta accede a las comunicaciones de otra. |
| **Óscar — 1. Proyectos de principio a fin** | Completar Explorar con datos reales autorizados, búsqueda, filtros y seguidos; detalle público; Mis proyectos; asistente completo de creación, borradores, edición, publicación y eliminación; audiencia, roles necesarios, tareas, plazos y estados. | Un proyecto creado o editado en web aparece correctamente en móvil y viceversa. El visitante solo ve publicaciones permitidas. Un borrador ajeno no se obtiene ni por pantalla ni por API. |
| **Óscar — 2. Participación y colaboración** | Completar solicitudes para unirse a equipo o tarea, aceptar/rechazar, miembros, cupos, comentarios y seguimiento de proyectos. Mostrar estados y permisos coherentes para creador, solicitante y visitante. | A solicita participar, B decide y ambos clientes muestran el mismo estado, miembros y cupos; comentarios y seguidos persisten. No se puede decidir sobre solicitudes de proyectos ajenos. |

Cada entrega incluye sus rutas, interfaz adaptable según prototipo y Flutter, acceso a Roble, estados de carga/vacío/error, permisos reales, pruebas del flujo y documentación de cualquier diferencia intencional de diseño. Jean y Óscar pueden desarrollar sus dos entregas en paralelo; la numeración no exige terminar la primera antes de iniciar la segunda.

## Contratos que se fijan antes de desarrollar

1. **Identidad:** el identificador compartido es `userId` de Roble. La capa de sesión web expone una forma estable de obtener usuario actual o ausencia de sesión (`userId`, correo y datos públicos mínimos). Los módulos de Óscar consumen esa interfaz; mientras Jean la conecta, usan un adaptador de prueba local con dos usuarios. No derivar identidad del correo ni guardar claves de Roble en el navegador.
2. **Proyectos:** rutas estables `/explorar`, `/mis-proyectos`, `/proyectos/nuevo` y `/proyectos/[id]`. Los módulos de Jean enlazan a estas rutas por `projectId`; pueden usar enlaces con IDs de prueba sin esperar la implementación final. Los módulos de Óscar enlazan a `/perfil` y `/notificaciones` por `userId` o `requestId` según corresponda.
3. **Eventos y datos:** se conservan IDs y relaciones de las tablas existentes (`projects`, `project_tasks`, `project_requests`, `request_decisions`, `project_members`, `project_comments`, `project_follows`, `app_notifications`, `user_profiles`, `direct_messages`). Óscar produce los eventos de proyecto y solicitud; Jean presenta las notificaciones y mensajes. No crear tablas duplicadas ni cambiar columnas incompatiblemente con Flutter.
4. **Permisos:** probar directamente Roble con visitante y dos cuentas A/B. Los filtros de React no sustituyen permisos del backend. Si una regla actual permite leer datos ajenos, registrar la corrección compatible con móvil y web antes de habilitar ese dato en producción. Cada dueño verifica las tablas de su flujo; Jean coordina el contrato de sesión y Óscar el de proyectos.
5. **Diseño y código compartido:** usar los colores y componentes existentes. Cada dueño agrega estilos dentro de su módulo o CSS Modules para evitar ediciones simultáneas en `src/app/globals.css`. Los cambios de navegación global o del contrato de sesión se acuerdan en una PR pequeña antes de integrarlos; las pantallas de cada flujo siguen siendo responsabilidad de su dueño.

## Forma de trabajar sin esperarse

- Crear cuatro ramas desde `main`: `jean/cuenta-perfil`, `jean/comunicaciones`, `oscar/proyectos`, `oscar/participacion`. Cada rama termina en una PR con demostración del flujo y capturas móvil/escritorio. Se pueden abrir PRs borrador desde el primer día.
- Usar datos de prueba locales detrás de los adaptadores mientras se consigue acceso a Roble. Marcar claramente esos datos y retirarlos de producción. Los contratos anteriores permiten construir y probar interfaces aunque aún falten las dos cuentas de prueba o una regla de Roble.
- Cada PR pasa `npm run lint`, `npm test` y `npm run build`, además de una prueba manual con móvil y web de los escenarios de su fila. Ninguna PR debe depender de archivos sin integrar de la otra persona.
- Integrar por PRs pequeñas dentro de cada entrega cuando convenga, manteniendo a una sola persona responsable del flujo completo. Resolver conflictos de navegación y estilos en la PR que los introduce.
- Al final, Jean y Óscar ejecutan juntos una prueba cruzada A/B de los cuatro flujos y revisan acceso directo a la API, enlaces entre rutas, diseño móvil/escritorio, accesibilidad básica y despliegue. La publicación web se hace solo cuando Roble protege los datos privados y ambos clientes siguen funcionando con las mismas cuentas.

## Lo que falta conseguir para la prueba real

- Dos cuentas controladas de Roble y acceso para revisar o modificar sus permisos. No compartir contraseñas por chat ni guardar tokens en Git.
- Un proyecto de prueba con una solicitud, una tarea, un comentario, una notificación y una conversación para comprobar paridad móvil/web.
- Decidir dominio y entorno de despliegue web, incluyendo las URL de retorno para Microsoft SSO.

Estas dependencias externas afectan la validación y publicación, pero no impiden que cada persona avance en sus cuatro entregas asignadas mediante adaptadores de prueba.
