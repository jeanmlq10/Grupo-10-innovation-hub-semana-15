# Comprobación de postulaciones y avisos reales

Esta prueba usa el contrato compartido `movil_flutter_dcaabc5f4e` en desarrollo. La web solo lee estas tablas; no envía solicitudes ni marca avisos como leídos.

1. Entra con tu cuenta de Roble y abre **Mi cuenta → Ver mis postulaciones**. Compara las solicitudes enviadas con la app móvil: proyecto, rol, mensaje y fecha. El estado se calcula usando decisiones que Roble permite atribuir al creador.
2. Desde **Mi cuenta → Ver mis avisos en Roble**, comprueba títulos, mensajes y la pestaña **No leídos**. Volver a cargar la página no debe cambiar el estado de lectura en Roble.
3. En otra sesión de navegador, entra con una segunda cuenta. Ninguna vista debe mostrar avisos ni postulaciones de la primera. Prueba las búsquedas y filtros con ambas cuentas.
4. Comprueba que `/notificaciones` sigue siendo la demostración A/B del navegador y que `/notificaciones/roble` muestra únicamente la lectura real.

**Límite:** estas comprobaciones verifican la respuesta de la web. Los permisos directos de Roble siguen demasiado amplios, según `ROBLE_ACCESS_AUDIT.md`; la lectura cruzada debe impedirse también en el backend antes de publicar.
