# Revisión inicial de acceso a datos de Roble

Estado: revisión estática del código móvil y de `semana_final/f_clean_template-main/ROBLE_PROJECTS_SETUP.md` en el repositorio hermano `Grupo-10-innovation-hub`. **Los permisos reales de la consola aún no se han probado con cuentas distintas.**

## Hallazgos que afectan la web y el móvil

| Datos | Uso actual | Riesgo a verificar |
|---|---|---|
| `projects` | La tabla es pública para Explorar. La app filtra `isDraft` y `audience` después de leer. | Una consulta directa a `public-read` podría devolver borradores. |
| `project_tasks` | La tabla también es pública para visitantes. | Las tareas de un proyecto no publicado podrían ser accesibles. |
| `user_profiles` | La app consulta por `userId` y aplica reglas de visibilidad en la interfaz. | Otro usuario con permiso de lectura podría consultar perfiles privados directamente. |
| `direct_messages` | La app consulta mensajes por remitente y destinatario. | Otro usuario podría consultar conversaciones ajenas si la tabla permite lectura general. |
| `app_notifications` | La app consulta por `recipientUserId`. | Un usuario podría consultar notificaciones de otros destinatarios si la tabla permite lectura general. |

El problema no se resuelve ocultando datos en Next.js: el cliente móvil ya usa Roble directamente. Cualquier cambio de permisos debe funcionar para ambos clientes.

## Prueba de permisos antes de conectar datos reales

Usar solo cuentas y datos de prueba. Registrar el resultado de cada operación en una matriz, sin guardar tokens ni contraseñas en Git.

El script de solo lectura `tools/audit_roble_access.mjs` automatiza estas consultas y muestra únicamente códigos HTTP y cantidades de filas relevantes. Necesita las variables de entorno `ROBLE_BASE_URL`, `ROBLE_CONTRACT_ID`, `ROBLE_TEST_A_EMAIL`, `ROBLE_TEST_A_PASSWORD`, `ROBLE_TEST_B_EMAIL` y `ROBLE_TEST_B_PASSWORD`. Configurarlas localmente sin subirlas a Git ni enviarlas por chat, y ejecutar `node tools/audit_roble_access.mjs`. Un resultado de cero puede ser inconcluso si no hay filas de prueba para ese caso.

1. Con visitante, intentar leer `projects` y `project_tasks`; comprobar si aparecen filas de proyectos no publicados.
2. Con usuario A, crear un borrador, un perfil privado, un mensaje para otro usuario y una notificación de prueba.
3. Con usuario B, consultar las tablas por API, sin los filtros de la interfaz. Verificar si puede leer datos privados de A o de una conversación ajena.
4. Con A y B, intentar actualizar o borrar filas ajenas; confirmar los códigos de respuesta.
5. Repetir después de cambiar permisos, para demostrar que la protección está en Roble o en un servicio compartido, no solo en la pantalla.

## Corrección a diseñar

- Separar los datos públicos de los borradores, o publicar una vista/consulta que entregue únicamente proyectos y tareas visibles. Una tabla pública que contiene borradores no puede protegerlos solo con filtros de cliente.
- Para perfiles, mensajes y notificaciones, definir lectura por usuario en el servidor. Si Roble no soporta las relaciones de lectura necesarias, usar un servicio de acceso compartido por móvil y web y retirar la lectura directa de esas tablas a usuarios comunes.
- Hacer los cambios de esquema y permisos en una secuencia compatible con la versión móvil desplegada; comprobar ambas apps antes de retirar rutas antiguas.

## Criterio de salida

La web no se conecta a datos reales ni se publica mientras la prueba de usuario B pueda leer información privada de A directamente desde Roble. El repositorio web deja `ROBLE_PUBLIC_READ_ENABLED=false` por defecto hasta que la consulta pública de proyectos sea segura.
