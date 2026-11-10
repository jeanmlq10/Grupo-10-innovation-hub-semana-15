# Revisión inicial de acceso a datos de Roble

Estado: revisión estática del código móvil y de `semana_final/f_clean_template-main/ROBLE_PROJECTS_SETUP.md` en el repositorio hermano `Grupo-10-innovation-hub`, una prueba real de solo lectura realizada el **9 de noviembre de 2026** con una cuenta de prueba y capturas de estructura, propiedad de filas y permisos del mismo contrato recibidas ese día. La segunda cuenta fue creada y verificada desde la app móvil; se comprobó que muestra el mismo `userId` al entrar en la web. El usuario ya tiene acceso de lectura a la consola; faltan la comparación cruzada A/B y acceso de quien pueda aplicar correcciones. La secuencia propuesta está en [PLAN_PERMISOS_ROBLE.md](PLAN_PERMISOS_ROBLE.md).

## Estructura visible en la consola

La captura de «Estructura de Datos» muestra **10 tablas**. Solo `projects` tiene activado el interruptor «Público». Los números de filas son estimaciones que muestra la consola, no una auditoría de contenido.

| Tabla | Filas estimadas | «Público» |
|---|---:|---|
| `projects` | 12 | Sí |
| `project_tasks` | 8 | No |
| `project_requests` | 8 | No |
| `request_decisions` | 4 | No |
| `project_members` | 3 | No |
| `project_comments` | 6 | No |
| `project_follows` | 6 | No |
| `app_notifications` | 15 | No |
| `user_system` | 8 | No |
| `data_audit` | 185 | No |

`user_profiles` y `direct_messages` **no figuran** en la lista completa. Esto explica sus respuestas 404 y confirma que el perfil y la mensajería reales todavía necesitan una decisión de esquema antes de integrarse. El interruptor «Público» indica exposición anónima de tabla; no demuestra aislamiento entre usuarios autenticados. El caso de `app_notifications` lo confirma: está marcado como no público, pero una cuenta leyó nueve avisos ajenos.

## Diagrama y edición de columnas

Las capturas posteriores del diagrama y de «Editar tabla» confirman que Roble asigna `_owner` **al usuario que inserta cada fila**, y que ese campo no se edita desde la aplicación. `projects` contiene `_id` UUID, `_owner` texto, `audience` texto e `isDraft` booleano; `categories`, `teamRoles` y `acceptedRoleCounts` son `jsonb`. La existencia de esos campos no impone por sí sola el filtro de publicación en `public-read`.

`app_notifications` contiene tanto `_owner` como `recipientUserId`. El código móvil crea avisos para otra persona y consulta por `recipientUserId`; el remitente queda como `_owner` de la fila. Por eso «leer solo lo propio», si se basa en `_owner`, no expresa la regla «solo el destinatario lee». La captura de columnas muestra `recipientUserId` como texto y `read` como booleano; las reglas de propiedad y asignaciones del rol se detallan abajo.

En el diagrama, `request_decisions` muestra `id` UUID, `requestId`, `status` y `decidedAt`, **sin `_owner` visible**. El repositorio móvil espera `_owner` para atribuir la decisión al creador del proyecto; al faltar en una fila, su código no aplica esa comprobación de autor. Hay que confirmar el esquema completo y el resultado real de la API antes de decidir cómo migrar o corregir las decisiones. Ninguna de estas capturas autoriza modificar filas o permisos.

## Propiedad de filas confirmada en los escudos

Las capturas de «Propiedad de las filas» para `projects` y `app_notifications` muestran la misma configuración: **eliminar solo lo propio activado, actualizar solo lo propio activado, leer solo lo propio desactivado, filas sin dueño compartidas, exposición de `_owner` a la aplicación activada e inserción anónima desactivada**. La consola aclara que los límites «own» solo afectan a roles que tengan permisos con alcance `own`; un permiso amplio sigue viendo todo.

En `projects`, la lectura no está acotada por dueño y la tabla es pública: la API ya confirmó que entrega borradores. No se puede resolver activando a ciegas «leer solo lo propio», pues Explorar necesita ver proyectos publicados de otras personas. En `app_notifications`, la lectura tampoco está acotada y la API entregó avisos ajenos. Además, «actualizar solo lo propio» aparece activado, a diferencia de la configuración histórica recomendada en `ROBLE_PROJECTS_SETUP.md` del móvil. Con los permisos amplios actuales del rol `user` no se debe asumir que este interruptor proteja las escrituras; hay que probarlas con dos cuentas controladas después de definir la política correcta.

## Asignación actual del rol `user`: hallazgo crítico

La captura de **«Roles → Detalles del rol: user»** muestra seis permisos asignados: `all:create`, `all:read`, `all:execute`, `all:update`, `all:delete` y `all:all`. En el catálogo de «Permisos», `all:all` se describe como **«Acceso total»**; los otros permisos corresponden a crear, leer, ejecutar consultas, actualizar y borrar sobre el recurso `all`. No son permisos por tabla ni de alcance `own`. Esta configuración es incompatible con el aislamiento entre usuarios que necesitan móvil y web. La lectura cruzada real de proyectos y avisos ya está confirmada; no se probaron escrituras ajenas ni ejecución de consultas con una cuenta normal.

La prioridad es coordinar con el administrador la retirada de los permisos globales del rol `user` y su sustitución por permisos mínimos y un acceso seguro compartido por ambos clientes. Hacerlo sin preparar los flujos de reemplazo podría interrumpir la app móvil. La web permite consultar proyectos propios en desarrollo, en modo de solo lectura y filtrados en su servidor; esto no protege la API directa de Roble. Esta documentación no es una instrucción para cambiar interruptores en producción sin respaldo, plan de transición y pruebas A/B.

## Resultado comprobado con una cuenta

Se usó el contrato del repositorio móvil. No se guardaron credenciales, tokens, identificadores ni filas de Roble en el repositorio; solo se anotan códigos HTTP y cantidades.

| Consulta | Resultado |
|---|---|
| Inicio de sesión y `auth/me` | HTTP 201 y 200; Roble devolvió un `userId`. |
| `public-read` de `projects`, sin sesión | HTTP 200; 12 filas, **5 borradores**. |
| `read` de `projects`, con la cuenta de prueba | HTTP 200; 12 filas, **5 borradores de otras cuentas**. |
| `read` de `app_notifications`, con la cuenta de prueba | HTTP 200; 15 filas, **9 avisos dirigidos a otras cuentas**. |
| `public-read` de `project_tasks` | HTTP 403. La lectura autenticada devolvió HTTP 200 y 8 filas. |
| `read` de `user_profiles` y `direct_messages` | HTTP 404 en ambas; la lista completa de tablas de la consola confirma que no existen en este contrato. |

**Bloqueo de publicación:** la API entrega datos que la interfaz móvil oculta. Mantener `ROBLE_PUBLIC_READ_ENABLED=false`; la única lectura real adicional de la web es la consulta de proyectos propios en desarrollo y sin escrituras. La corrección debe aplicarse en Roble o en un servicio que usen los dos clientes.

## Hallazgos que afectan la web y el móvil

| Datos | Uso actual | Riesgo a verificar |
|---|---|---|
| `projects` | La tabla es pública para Explorar. La app filtra `isDraft` y `audience` después de leer. | Una consulta directa a `public-read` podría devolver borradores. |
| `project_tasks` | La consola la marca como no pública y la primera prueba anónima respondió 403. | Verificar aislamiento entre usuarios autenticados y visibilidad de tareas según el proyecto padre. |
| `user_profiles` | El código móvil contempla esta tabla, pero no existe en el contrato. | Diseñar su esquema y permisos antes de habilitar perfiles compartidos. |
| `direct_messages` | El código móvil contempla esta tabla, pero no existe en el contrato. | Diseñar su esquema y permisos antes de habilitar mensajería compartida. |
| `app_notifications` | La app consulta por `recipientUserId`. | Un usuario podría consultar notificaciones de otros destinatarios si la tabla permite lectura general. |

El problema no se resuelve ocultando datos en Next.js: el cliente móvil ya usa Roble directamente. Cualquier cambio de permisos debe funcionar para ambos clientes.

## Prueba de permisos antes de conectar datos reales

Usar solo cuentas y datos de prueba. Registrar el resultado de cada operación en una matriz, sin guardar tokens ni contraseñas en Git.

El script de solo lectura `tools/audit_roble_access.mjs` automatiza estas consultas y muestra únicamente códigos HTTP y cantidades de filas relevantes. Necesita `ROBLE_BASE_URL`, `ROBLE_CONTRACT_ID`, `ROBLE_TEST_A_EMAIL` y `ROBLE_TEST_A_PASSWORD`; si se agregan `ROBLE_TEST_B_EMAIL` y `ROBLE_TEST_B_PASSWORD`, ejecuta además la comparación cruzada. Configurar las claves localmente sin subirlas a Git ni enviarlas por chat, y ejecutar `node tools/audit_roble_access.mjs`. Comprueba también proyectos `Solo yo` y lectura anónima de solicitudes, avisos y mensajes. Devuelve código 1 si encuentra exposición y 2 si no puede concluir; cero filas sin datos de prueba no prueba seguridad. El script acepta HTTP 200 o 201 para el inicio de sesión, según la respuesta real observada. Para la revisión visual de esquema y reglas, seguir [la guía de la consola](GUIA_REVISION_CONSOLA_ROBLE.md).

1. Con visitante, intentar leer `projects` y `project_tasks`; comprobar si aparecen filas de proyectos no publicados.
2. Con usuario A, crear un borrador y una notificación de prueba mediante un flujo legítimo de la app. Crear perfil privado y mensaje de prueba solo después de definir las tablas que faltan.
3. Con usuario B, consultar las tablas existentes por API, sin los filtros de la interfaz. Verificar si puede leer datos privados de A; ampliar la prueba a conversaciones cuando exista mensajería real.
4. Con A y B, intentar actualizar o borrar filas ajenas; confirmar los códigos de respuesta.
5. Repetir después de cambiar permisos, para demostrar que la protección está en Roble o en un servicio compartido, no solo en la pantalla.

## Corrección a diseñar

- Separar los datos públicos de los borradores, o publicar una vista/consulta que entregue únicamente proyectos y tareas visibles. Una tabla pública que contiene borradores no puede protegerlos solo con filtros de cliente.
- Para notificaciones, definir lectura por destinatario en el servidor. Para perfiles y mensajes, acordar primero si se crearán las tablas previstas por móvil o un servicio compartido; en ambos casos aplicar autorización por usuario antes de usar datos reales.
- Hacer los cambios de esquema y permisos en una secuencia compatible con la versión móvil desplegada; comprobar ambas apps antes de retirar rutas antiguas.

## Criterio de salida

La web solo consulta proyectos propios en desarrollo y no publica los flujos de datos reales mientras cualquier cuenta pueda leer información privada ajena o un visitante pueda leer borradores directamente desde Roble. El repositorio web deja `ROBLE_PUBLIC_READ_ENABLED=false` por defecto hasta que la consulta pública de proyectos sea segura. Antes de integrar perfiles y mensajes hay que resolver las dos tablas ausentes; después se repite la prueba con dos cuentas tras corregir los permisos.
