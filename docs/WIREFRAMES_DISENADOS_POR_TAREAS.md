# Wireframes diseñados por tareas

Estos **sí son wireframes dibujados para la entrega**, no capturas de la web. La colección usa la identidad visual de Proyéctate como referencia y muestra cinco tareas completas con estados principales, alternativas y resultados.

**Archivo para presentar:** [PDF vectorial de 34 páginas](WIREFRAMES_DISENADOS_POR_TAREAS_2026-11-09.pdf).

**Fuente editable:** [`tools/build_wireframes_design_pdf.py`](../tools/build_wireframes_design_pdf.py).

**Capturas reales, por separado:** [PDF de evidencias](EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf).

| Tarea | Páginas | Wireframes incluidos |
| --- | --- | --- |
| Iniciar sesión | 2–7 | Bienvenida, acceso, error, registro, verificación y cuenta identificada |
| Crear proyecto | 8–15 | Seis pasos del asistente, borrador guardado y publicación |
| Unirse a proyecto | 16–21 | Vacante, postulación, pendiente, decisión, aceptación y rechazo |
| Crear equipo | 22–25 | Cupos, gestión, confirmación e integrantes incorporados |
| Explorar | 26–31 | Catálogo, filtros, resultados, detalle, seguidos y sin resultados |
| Anexo transversal | 32–33 | Perfil y Trayectoria, presentes en el prototipo original |

La página 1 es la portada con el índice; la 34 explica las etiquetas y las validaciones pendientes. En total hay **32 wireframes dibujados**.

## Cómo leer las etiquetas

- **Referencia actual:** distribución tomada de una pantalla existente o del prototipo web. El dibujo del PDF es nuevo.
- **Estado diseñado:** variante necesaria para comprender la tarea. Debe contrastarse con la implementación antes de afirmar paridad.
- **Propuesta nueva:** pantalla que todavía requiere decisión de producto e implementación. Las tres pantallas independientes de gestión de equipo se etiquetan así.

## Decisiones de diseño

1. **Crear equipo** se muestra como tarea propia para la entrega. La aplicación actual define cupos durante «Crear proyecto» y acepta solicitudes desde el detalle; no tiene la ruta `/proyectos/[id]/equipo`. Esa ruta del PDF es **propuesta**, no una función existente.
2. **Unirse a proyecto** incluye resultados aceptado y rechazado para que el recorrido no termine en la pantalla de «Solicitud pendiente». Las capturas actuales terminan antes de esa decisión.
3. **Iniciar sesión** muestra la verificación y la cuenta resultante como parte del recorrido, sin incluir contraseñas, códigos o identificadores reales.
4. **Explorar** añade estados con filtros aplicados y sin resultados, además del catálogo básico.
5. Todos los nombres y datos de los wireframes son ejemplos. Su presencia en el PDF no demuestra sincronización entre móvil y web ni acceso seguro a Roble; eso se verifica aparte con la [matriz de permisos](PLAN_PERMISOS_ROBLE.md).

Para regenerar el PDF desde la fuente editable: `python3 tools/build_wireframes_design_pdf.py docs/WIREFRAMES_DISENADOS_POR_TAREAS_2026-11-09.pdf`. Requiere `fpdf2` y las fuentes Arial incluidas en macOS.
