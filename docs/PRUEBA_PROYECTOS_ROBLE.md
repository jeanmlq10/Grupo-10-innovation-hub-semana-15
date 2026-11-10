# Comprobación de proyectos reales entre móvil y web

Esta guía verifica el avance de **lectura** con el contrato compartido `movil_flutter_dcaabc5f4e`. No modifica proyectos ni permisos. Requiere ejecutar la web con `npm run dev` y las variables locales de Roble configuradas.

1. Inicia sesión en la web con la misma cuenta que usas en la app móvil. Abre **Mi cuenta → Ver mis proyectos en Roble**.
2. Compara las tarjetas de **Publicados** y **Privados y borradores** con «Mis proyectos» en móvil. La búsqueda debe encontrar un proyecto por nombre, descripción o categoría.
3. Abre **Ver detalle** en un proyecto propio. Compara descripción, duración, fecha límite, roles y cupos, tareas, miembros y solicitudes con la app móvil. Esta ficha solo permite consultar.
4. Si tienes una segunda cuenta, abre la web con ella en otra sesión de navegador. Su lista no debe incluir proyectos de la primera cuenta. Si conoces el identificador de un proyecto de la primera, al intentar su URL de detalle con la segunda cuenta debe aparecer «Proyecto no disponible».
5. Comprueba que los proyectos de la demostración A/B siguen en `/mis-proyectos` y no aparecen mezclados con los de Roble.
6. En **Explorar → Explorar proyectos reales en Roble**, busca y filtra proyectos de la comunidad. Abre una ficha y compara descripción, tareas y cupos con móvil. Los borradores y proyectos «Solo yo» no deben aparecer ni abrirse desde una URL directa de esta sección.

**Límite de esta prueba:** que la web filtre correctamente no prueba que Roble impida consultas directas. La auditoría `ROBLE_ACCESS_AUDIT.md` documenta el acceso excesivo actual; antes de publicar deben corregirse y volver a probarse los permisos para ambos clientes.
