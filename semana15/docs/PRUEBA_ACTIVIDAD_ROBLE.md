# Comprobación de postulaciones y avisos reales

Esta prueba usa el contrato compartido `movil_flutter_dcaabc5f4e` en desarrollo. La web puede enviar solicitudes, resolverlas desde la cuenta creadora y marcar avisos como leídos.

1. Entra con tu cuenta de Roble y abre **Mi cuenta → Ver mis postulaciones**. Compara las solicitudes enviadas con la app móvil: proyecto, rol, mensaje y fecha. El estado se calcula usando decisiones que Roble permite atribuir al creador.
2. Desde **Mi cuenta → Ver mis avisos en Roble**, comprueba títulos, mensajes y la pestaña **No leídos**. Pulsa **Marcar como leído** y recarga la página; el aviso debe permanecer leído en web y móvil.
3. En otra sesión de navegador, entra con una segunda cuenta. Ninguna vista debe mostrar avisos ni postulaciones de la primera. Prueba las búsquedas y filtros con ambas cuentas.
4. Comprueba que `/notificaciones` sigue siendo la demostración A/B del navegador y que `/notificaciones/roble` muestra los avisos reales.

Para el recorrido completo entre la cuenta creadora y la postulante, sigue [E2E_MANUAL_ROBLE.md](E2E_MANUAL_ROBLE.md). La aceptación escribe en `project_members`, actualiza cupos y registra una fila en `request_decisions`. Roble no agrupa esos cambios en una transacción; si aparece un error, revisa el proyecto y la solicitud antes de repetir la operación.

**Límite:** estas comprobaciones verifican la respuesta de la web. Los permisos directos de Roble siguen demasiado amplios, según `ROBLE_ACCESS_AUDIT.md`; la lectura cruzada debe impedirse también en el backend antes de publicar.
