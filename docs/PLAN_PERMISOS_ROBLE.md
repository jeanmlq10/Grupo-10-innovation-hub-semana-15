# Corrección de permisos de Roble para móvil y web

**Estado (9 de noviembre de 2026): consola disponible en modo lectura; correcciones pendientes de quien tenga permisos administrativos.** La auditoría de lectura confirmó que `public-read` de `projects` entrega borradores y que `read` de `app_notifications` entrega avisos de otros destinatarios. La captura de estructura confirma que `projects` es la única tabla pública y que `user_profiles` y `direct_messages` aún no existen. La identidad compartida de una cuenta ya se comprobó en ambas apps mediante el mismo `userId`; eso no implica que sus datos estén protegidos. Véase [la auditoría](ROBLE_ACCESS_AUDIT.md).

## Decisión técnica

La app Flutter lee Roble directamente. El documento móvil `ROBLE_PROJECTS_SETUP.md` indica que Roble solo ofrece «leer lo propio» como control de fila conocido para este contrato. Esa regla por sí sola no sirve para los datos compartidos: el dueño debe leer solicitudes de postulantes, el destinatario debe leer mensajes y avisos creados por otra persona, y la comunidad debe ver proyectos publicados pero nunca borradores. Los filtros `userId`, `recipientUserId` o `isDraft` que envían los clientes son parámetros manipulables por quien llama a la API.

La corrección requiere **autorización del lado del servidor para cada lectura y escritura**. Primero confirmar con el administrador si Roble permite políticas de fila que expresen propietario, destinatario y relación con proyecto. Si no las permite, usar un servicio de acceso común para Flutter y Next.js: verificar el token de Roble, obtener el `userId` con `auth/me`, aplicar estas reglas y consultar las tablas con credenciales de servicio guardadas únicamente en el servidor. El tipo de credencial de servicio y el alojamiento deben confirmarse con el administrador; no se presupone que el SDK de usuario pueda eludir permisos.

## Matriz mínima de autorización

| Datos | Lectura permitida | Escritura permitida |
|---|---|---|
| `projects` | Visitante: solo publicados para «Toda la comunidad» y campos públicos. Autor: también sus borradores. | Crear/editar/borrar: autor. La transición a publicado valida audiencia y datos en servidor. |
| `project_tasks` | Solo si el proyecto padre es visible para quien consulta. | Crear/editar/borrar: autor del proyecto; asignaciones según reglas de participación. |
| `project_requests`, `request_decisions`, `project_members` | Postulante y autor del proyecto según la operación; miembros solo cuando el proyecto sea visible. | Postulante crea su solicitud; autor decide; el servicio actualiza miembros y contadores de forma autorizada. |
| `project_comments`, `project_follows` | Actividad de proyectos visibles; actividad privada solo para personas autorizadas. | Autoría derivada del token; edición/borrado por autor o regla explícita. |
| `app_notifications` | Solo `recipientUserId` igual al `userId` autenticado. | El servicio crea avisos tras una acción válida; solo el destinatario cambia `read`. |
| `direct_messages` | Solo remitente o destinatario. | El remitente envía si la política de contacto lo permite; solo el destinatario marca leído. |
| `user_profiles` | El perfil público expone únicamente campos permitidos y respeta `profileVisibility`. Preferencias, correo y perfil privado solo para su titular. | Solo el titular cambia su perfil y preferencias. |

## Secuencia de cambio

1. **Contener la exposición.** Revisar los escudos de permisos de `projects` y `app_notifications` con el acceso de lectura; después coordinar con el administrador una ventana para quitar la lectura anónima insegura de `projects` y la lectura general de avisos. No borrar filas ni cambiar roles a ciegas: la app móvil actual depende de varias lecturas directas y puede perder temporalmente esas funciones. `project_tasks` está marcada como no pública; `user_profiles` y `direct_messages` no existen y requieren una decisión de esquema aparte.
2. **Preparar el acceso seguro.** Crear políticas de fila en Roble si cubren toda la matriz; si no, implementar el servicio común. El servicio devuelve vistas públicas sin columnas privadas y verifica autorización en lecturas por lista, por ID y en todas las mutaciones. Una proyección pública de proyectos debe generarse desde filas ya autorizadas, no desde datos enviados libremente por el cliente.
3. **Migrar ambos clientes.** Cambiar los datasources Flutter y la capa Roble de Next.js para que usen los endpoints seguros. Mantener `userId` y los IDs existentes de proyectos al migrar; si se crean nuevas tablas, preservar una relación explícita con los IDs anteriores antes de mover tareas, solicitudes y comentarios. Para perfiles y mensajes, crear las tablas previstas o acordar un servicio común antes de activar sus vistas reales.
4. **Revocar el acceso directo inseguro.** Solo después de confirmar los flujos de ambos clientes, quitar del rol `user` las lecturas y escrituras directas a tablas privadas que el servicio reemplaza. Guardar la configuración de permisos y un respaldo de datos antes de cada cambio.
5. **Verificar y habilitar.** Ejecutar `tools/audit_roble_access.mjs` con dos cuentas controladas y filas de prueba. Comprobar también lecturas por ID, actualización/borrado ajeno y las acciones legítimas de ambos clientes. `ROBLE_PUBLIC_READ_ENABLED` sigue en `false` hasta pasar la revisión. Un 404 o cero filas sin datos de prueba no demuestra seguridad.

## Solicitud lista para el administrador

> Ya tenemos lectura de la consola del contrato `movil_flutter_dcaabc5f4e`, pero necesitamos a quien pueda corregir permisos antes de conectar la web a datos reales. Una prueba de solo lectura mostró que `public-read` de `projects` entrega borradores y que una cuenta normal puede leer avisos de otros destinatarios en `app_notifications`. La estructura muestra que `projects` es pública y que `user_profiles` y `direct_messages` todavía no existen. Solicitamos revisar las reglas por fila, confirmar si Roble permite autorización basada en propietario, destinatario y proyecto, y acordar un cambio compatible con la app móvil. No envíen contraseñas ni tokens y no borren datos durante esta revisión.

**Criterio de salida:** una llamada directa con usuario B o sin sesión no recibe datos privados de A; el propietario, destinatario y participantes autorizados sí completan sus flujos en móvil y web. Hasta entonces, la web conserva los datos reales privados desconectados.
