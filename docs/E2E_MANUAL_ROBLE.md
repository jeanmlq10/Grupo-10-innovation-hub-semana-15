# Guion E2E manual: móvil y web con dos cuentas

## Preparación

- Ejecutar la web con `npm run dev` y el contrato `movil_flutter_dcaabc5f4e` en `.env.local`.
- Usar dos cuentas reales distintas: **A**, creadora, y **B**, postulante. No escribir contraseñas, códigos ni tokens en capturas o evidencias.
- Abrir A y B en perfiles de navegador separados. Tener la app Expo/React Native de `mobile/` disponible para comparar la misma cuenta y el mismo proyecto.
- Elegir un nombre único para el proyecto de prueba y registrar su ID desde la URL. No usar un proyecto con participantes reales.

## Recorrido principal

| Paso | Cuenta y acción | Resultado esperado |
| --- | --- | --- |
| 1 | A inicia sesión en `/login` y abre `/cuenta`. | El `userId` coincide con el de A en móvil. |
| 2 | A abre `/mis-proyectos/roble`, crea un proyecto con nombre y guarda borrador. | Aparece en **Privados y borradores** de A y en móvil. B no puede abrirlo desde Explorar. |
| 3 | A edita el borrador: añade descripción, un rol con 1 cupo, una tarea con 1 cupo, duración y audiencia **Toda la comunidad**; publica. | Aparece en **Publicados**, en `/explorar/roble` de B y en la app móvil. Roles y tarea conservan los mismos cupos. |
| 4 | B abre el proyecto, solicita el rol y escribe un mensaje. | Se muestra confirmación, la solicitud aparece en `/postulaciones/roble` de B y llega un aviso a A. No se permite enviar una segunda solicitud pendiente al mismo rol. |
| 5 | A abre `/mis-proyectos/roble/[id]` → **Solicitudes** y acepta. | El estado pasa a **Aceptada**, se crea un miembro y el cupo libre del rol baja a 0. B ve la decisión y un aviso en web y móvil. |
| 6 | A marca el aviso recibido como leído en `/notificaciones/roble`. | Desaparece de **No leídos** incluso después de recargar; móvil refleja el mismo estado. |
| 7 | B intenta postularse a la tarea disponible. A rechaza desde **Solicitudes**. | B ve **Rechazada** y recibe un aviso. La tarea sigue con su cupo libre. |
| 8 | A edita el nombre o la descripción del proyecto. | B y móvil ven el cambio al recargar; la membresía y los cupos aceptados se conservan. |
| 9 | A edita nombre, biografía y preferencias en `/perfil/editar`, `/perfil/privacidad` y `/perfil/ajustes/notificaciones`. | Móvil muestra los mismos campos al recargar. El perfil privado deja de aparecer para B en `/usuarios/[id]`. |
| 10 | A vuelve a poner el perfil público. B abre el perfil desde el proyecto, envía un mensaje y A responde. | Ambos clientes muestran la conversación; al desactivar el contacto de A, B no puede iniciar otra conversación. |
| 11 | B sigue el proyecto, comenta y responde a un comentario desde su ficha. | Móvil muestra el seguimiento y los comentarios. `/perfil/actividad` y `/perfil/trayectoria` de B reflejan sus acciones. |
| 12 | A crea en móvil una tarea «solo equipo». | A ve el título en su ficha web. B no ve el contenido en la ficha pública ni puede postularse a esa tarea por la ruta web. La edición web del proyecto se bloquea para preservar el contenido interno. |

## Comprobaciones de aislamiento

1. Con B, intenta abrir en la web la URL de edición del proyecto de A. Debe mostrar **Proyecto no disponible**; ningún dato debe cambiar.
2. Con B, intenta abrir un borrador privado de A desde una URL directa de `/explorar/roble/[id]`. Debe responder como no disponible.
3. Con A y B, compara `/notificaciones/roble` y `/postulaciones/roble`: cada cuenta debe mostrar solo sus avisos y sus solicitudes.
4. Cierra sesión en la web de B y comprueba que las rutas reales vuelven a pedir inicio de sesión.

## Registro de resultados

Anota por paso: **fecha y hora**, **cuenta**, **URL o pantalla móvil**, **resultado esperado**, **resultado observado**, **captura sin datos sensibles** y **ID del proyecto o solicitud**. Si falla una aceptación o publicación, revisa las filas relacionadas antes de reintentar: Roble no ofrece una transacción para varias tablas.

## Límite de esta prueba

La web filtra y comprueba propietario o destinatario en sus rutas de desarrollo, pero el rol común `user` de Roble aún tiene permisos directos demasiado amplios. Una prueba visual entre dos cuentas no sustituye la corrección del contrato descrita en [PLAN_PERMISOS_ROBLE.md](PLAN_PERMISOS_ROBLE.md). No habilitar el flujo en producción hasta resolverla.
