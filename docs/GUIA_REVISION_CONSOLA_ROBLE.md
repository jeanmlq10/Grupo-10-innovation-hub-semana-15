# Qué revisar con acceso de lectura a Roble

Esta guía sirve para inspeccionar el contrato que comparten Flutter y Next.js. **Leer la consola no cambia permisos ni habilita la integración web.** El objetivo es confirmar el esquema y la configuración que explica los resultados de [la auditoría de API](ROBLE_ACCESS_AUDIT.md), y entregar al administrador una propuesta verificable.

Contrato usado por ambas apps: `movil_flutter_dcaabc5f4e`. Verificar en la consola que se está viendo ese contrato antes de revisar tablas.

## Revisión en la consola

1. La pantalla «Estructura de Datos» ya confirmó diez tablas: `projects` es la única marcada como pública; `user_profiles` y `direct_messages` no aparecen. Abrir el icono de **escudo** de cada tabla de aplicación y anotar permisos de lectura pública, lectura autenticada, creación, actualización y borrado. Registrar si la consola ofrece reglas por fila y en qué operaciones. La matriz deseada está en [PLAN_PERMISOS_ROBLE.md](PLAN_PERMISOS_ROBLE.md). No cambiar el interruptor «Público» durante esta revisión.
2. En `projects`, confirmar `isDraft`, `audience`, `_owner`, `_id` y `createdBy`. Revisar si una regla del servidor excluye de **todas** las lecturas anónimas los borradores y proyectos `Solo yo`, tanto en listas como por ID. La API ya entregó 5 borradores por `public-read` el 9 de noviembre de 2026.
3. En `project_tasks`, comprobar si la visibilidad de cada tarea depende del proyecto padre. Un proyecto privado no debe dejar tareas visibles por consulta directa. La tabla está marcada como no pública y la primera prueba anónima respondió 403.
4. En `project_requests` y `request_decisions`, confirmar cómo se relacionan `projectId`, `applicantUserId`, `_owner` y la decisión del creador. El diagrama de `request_decisions` no muestra `_owner`, aunque el código móvil lo necesita; comprobar el esquema completo desde «Estructura de Datos». El postulante y el creador necesitan acceso diferente; una regla de «solo propietario de fila» puede impedir al creador decidir.
5. En `project_members`, confirmar quién puede leer la lista y quién puede crear miembros. En `app_notifications`, comprobar que solo `recipientUserId` puede leer y marcar como leído su aviso; la API ya entregó avisos de otros destinatarios a una cuenta normal.
6. `user_profiles` y `direct_messages` no existen en la lista completa de este contrato, lo que explica los 404. Antes de crearlas, acordar con el administrador el esquema y las reglas de acceso. Para mensajes, acceso solo de `fromUserId` y `toUserId`; para perfiles, decidir qué campos son públicos y cuáles corresponden solo al titular.
7. Revisar `project_comments` y `project_follows`: visibilidad según el proyecto padre y escritura atribuida a la identidad del token, no a un `userId` enviado por el cliente.

Para cada hallazgo, guardar **nombre de tabla, operación, rol, regla configurada y resultado esperado**. Si se toman capturas para el administrador, ocultar correos, nombres, mensajes, tokens y filas privadas. No hace falta exportar datos de usuarios para esta revisión.

## Comprobación desde la API

La consola muestra configuración; la API comprueba el comportamiento real. Tras conseguir acceso, repetir el script de solo lectura `node tools/audit_roble_access.mjs` con dos cuentas de prueba distintas configuradas localmente mediante variables de entorno. El script imprime códigos HTTP y cantidades, nunca filas ni credenciales. Compara visitante, cuenta A y cuenta B; ahora incluye proyectos `Solo yo`, solicitudes, notificaciones y mensajes anónimos. Un cero puede ser inconcluso si no existen filas de prueba para ese caso.

Para aprobar la conexión de datos reales falta además probar lecturas por ID y escrituras ajenas con datos de prueba, y repetir la matriz después de la corrección. Esos cambios requieren al administrador o un servicio compartido con autorización del lado del servidor. Hasta entonces, `ROBLE_PUBLIC_READ_ENABLED=false` y las vistas privadas siguen en demostración local.

## Preguntas concretas para el administrador

- ¿Qué permisos de lectura y escritura tiene hoy cada rol en estas diez tablas?
- ¿Puede Roble exigir reglas por fila que dependan del usuario autenticado, del destinatario y del proyecto padre, también para lecturas por ID?
- ¿Puede una consulta pública devolver solo proyectos publicados y sus campos públicos sin exponer la tabla completa?
- Si esas reglas no están disponibles, ¿qué mecanismo de credencial de servicio admite Roble para un servicio común usado por Flutter y Next.js?
- ¿Quién puede aplicar y respaldar los cambios de permisos, y cómo se probará que la app móvil sigue funcionando?
