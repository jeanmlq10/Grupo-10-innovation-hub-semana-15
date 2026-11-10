# Comprobación de proyectos reales entre móvil y web

Esta guía verifica la lectura y escritura de proyectos con el contrato compartido `movil_flutter_dcaabc5f4e`. Requiere ejecutar la web con `npm run dev` y las variables locales de Roble configuradas. Los pasos de escritura crean datos reales en la cuenta de prueba.

1. Inicia sesión en la web con la misma cuenta que usas en la app móvil. Abre **Mi cuenta → Ver mis proyectos en Roble**.
2. Compara las tarjetas de **Publicados** y **Privados y borradores** con «Mis proyectos» en móvil. La búsqueda debe encontrar un proyecto por nombre, descripción o categoría.
3. Abre **Ver detalle** en un proyecto propio. Compara descripción, duración, fecha límite, roles y cupos, tareas, miembros y solicitudes con la app móvil. Esta ficha solo permite consultar.
4. Si tienes una segunda cuenta, abre la web con ella en otra sesión de navegador. Su lista no debe incluir proyectos de la primera cuenta. Si conoces el identificador de un proyecto de la primera, al intentar su URL de detalle con la segunda cuenta debe aparecer «Proyecto no disponible».
5. Comprueba que los proyectos de la demostración A/B siguen en `/mis-proyectos` y no aparecen mezclados con los de Roble.
6. En **Explorar → Explorar proyectos reales en Roble**, busca y filtra proyectos de la comunidad. Abre una ficha y compara descripción, tareas y cupos con móvil. Los borradores y proyectos «Solo yo» no deben aparecer ni abrirse desde una URL directa de esta sección.

**Límite de esta prueba:** que la web filtre correctamente no prueba que Roble impida consultas directas. La auditoría `ROBLE_ACCESS_AUDIT.md` documenta el acceso excesivo actual; antes de publicar deben corregirse y volver a probarse los permisos para ambos clientes.

## Guardado real en desarrollo

1. Desde **Mis proyectos en Roble**, abre **Nuevo proyecto en Roble**. Escribe un nombre, avanza a información básica y pulsa **Guardar borrador**. Comprueba que aparece en **Privados y borradores** y en la app móvil con la misma cuenta.
2. Abre **Editar**, completa descripción, categorías, roles, una tarea, duración y audiencia **Toda la comunidad**. Pulsa **Publicar en Roble**. Comprueba que aparece en **Publicados** y que la tarea se ve en la ficha y en móvil.
3. Edita de nuevo nombre y cupos de la tarea. Verifica los cambios en ambas apps. Usa una segunda cuenta para comprobar que la edición de un proyecto ajeno se rechaza.
4. Si aparece un error con enlace para revisar el proyecto, ábrelo antes de repetir el guardado: Roble no ofrece una transacción para proyecto y tareas, y puede haber cambios parciales.

Las rutas de escritura web operan solo con `NODE_ENV=development`, exigen sesión y verifican `_owner` antes de editar. La API directa de Roble mantiene permisos amplios según la auditoría; este flujo sigue siendo de prueba hasta corregirlos.
