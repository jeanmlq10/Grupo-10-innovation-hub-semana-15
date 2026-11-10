# Proyéctate web: wireframes organizados por tareas

**Propósito:** presentar los recorridos que una persona realiza, en vez de entregar pantallas aisladas.

**Documento para exponer:** [PDF visual organizado por las cinco tareas](WIREFRAMES_POR_TAREAS_2026-11-09.pdf).

**Fuentes:** el [prototipo web original](disenos-web.html) contiene diez pantallas; el [PDF de evidencias](EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf) reúne 18 capturas de la implementación. Un wireframe es una propuesta de interfaz; las capturas muestran el estado actual de la web. No deben confundirse con pruebas de integración con Roble.

## Resumen de las cinco tareas

| Tarea solicitada | Pantallas y evidencias | Estado de la evidencia |
| --- | --- | --- |
| 1. Iniciar sesión | Bienvenida E01 → Inicio de sesión E03; Registro E02 como alternativa | Formularios visibles; falta mostrar ingreso completado y `/cuenta` |
| 2. Crear proyecto | Comencemos E07 → Información E08 → Equipo E09 → Tiempo E10 → Audiencia E11 → Revisar E12 → Publicado E17 | Recorrido local documentado; no escribe en Roble |
| 3. Unirse a proyecto | Detalle E13 → Solicitud de B E15 → Aviso para A E16 → Decisión disponible E18 | Falta aceptación o rechazo y resultado para B |
| 4. Crear equipo | Definir cupos E09 → Ver cupos E13 → Gestionar solicitud E18 | No existe como pantalla independiente; falta equipo conformado |
| 5. Explorar | Catálogo E04 → Detalle E13 | Falta capturar búsqueda, filtros y pestaña Seguidos en uso |

Los códigos `E01`–`E18` identifican las páginas 2–19 del PDF de evidencias: por ejemplo, `E15` está en la página 16.

## 1. Iniciar sesión

**Objetivo:** entrar a la web con la misma identidad usada en la app móvil.

**Secuencia principal:** Bienvenida (`E01`, `/`) → Inicio de sesión (`E03`, `/login`) → Cuenta Roble (`/cuenta`, sin captura en este conjunto) → Explorar.

**Ruta alternativa:** Registro institucional (`E02`, `/registro`) → Verificar correo (`/verificar-correo`, sin captura) → Inicio de sesión.

**Estado:** las capturas documentan las tres pantallas iniciales. El login está integrado con Roble en desarrollo, pero estas imágenes muestran los formularios vacíos y no acreditan el ingreso. Para cerrar la evidencia, capturar la pantalla `/cuenta` después de entrar, sin contraseñas, tokens ni códigos visibles.

**Wireframes originales relacionados:** Bienvenida, Iniciar sesión y Alta institucional.

## 2. Crear proyecto

**Objetivo:** transformar una idea en un proyecto publicado o borrador.

**Secuencia:** Comencemos (`E07`) → Información básica (`E08`) → Equipo necesario (`E09`) → Tiempo estimado (`E10`) → Audiencia (`E11`) → Revisar y publicar (`E12`) → Mis proyectos con PROYECTOPRUEBA publicado (`E17`). Todas las etapas del asistente usan `/proyectos/nuevo`.

**Pantallas de apoyo:** Mis proyectos antes de la creación (`E05`) y edición de EcoCampus (`E06`) muestran la gestión de proyectos existentes.

**Estado:** las seis etapas y el proyecto publicado aparecen en las capturas. Es una demostración local guardada en este navegador. El clic de «Publicar demo» no está capturado, aunque `E17` muestra el resultado posterior. Falta capturar el subflujo «Guardar borrador → Mis borradores → Publicar» si se exige esa variante.

**Wireframes originales relacionados:** Crear proyecto y Mis proyectos.

## 3. Unirse a proyecto

**Objetivo:** solicitar participación en un equipo y recibir una decisión del creador.

**Secuencia:** Explorar (`E04`) → Detalle y cupos (`E13`) → B sigue el proyecto y solicita el rol Diseñador/a (`E15`) → A recibe notificación (`E16`) → A ve la solicitud en el proyecto (`E18`). La lista de A también registra una solicitud (`E17`).

**Estado:** se evidencia la solicitud pendiente en las dos perspectivas ficticias. Falta capturar A pulsando «Aceptar» o «Rechazar», el resultado para B y, si se acepta, el cambio de miembro y cupo. Los avisos y solicitudes de estas capturas son locales; no prueban la autorización ni la sincronización de Roble.

**Wireframes originales relacionados:** Explorar, Detalle de proyecto y Notificaciones.

## 4. Crear equipo

**Objetivo:** definir los roles necesarios y conformar el equipo con las solicitudes recibidas.

**Secuencia propuesta:** configurar cupos de roles en el asistente (`E09`) → ver vacantes en el detalle (`E13`) → recibir solicitud (`E18`) → aceptar a la persona → ver miembro y cupo actualizados (**sin captura**).

**Estado:** en el móvil y en la web, la configuración del equipo forma parte de «Crear proyecto». La conformación ocurre cuando la persona creadora decide sobre una solicitud. El prototipo web original **no contiene una pantalla independiente llamada «Crear equipo»**. Si la entrega requiere un wireframe separado para esta tarea, falta diseñar una vista de gestión con roles, solicitudes, decisiones y miembros actuales. `E18` solo muestra las acciones disponibles, no una decisión ejecutada.

**Wireframes originales relacionados:** Crear proyecto y Detalle de proyecto.

## 5. Explorar

**Objetivo:** encontrar proyectos y abrir uno relevante.

**Secuencia:** catálogo (`E04`, `/explorar`) → buscar, filtrar o abrir una tarjeta → detalle (`E13`, `/proyectos/[id]`) → seguir o solicitar participación (`E15`, si corresponde).

**Estado:** se ve el catálogo y un detalle. Falta capturar un término de búsqueda aplicado, filtros abiertos, la pestaña Seguidos y estados vacíos para documentar todas las variantes visuales.

**Wireframes originales relacionados:** Explorar y Detalle de proyecto.

## Pantallas transversales y pendientes

- **Perfil:** capturado en `E14`; sirve para consultar trayectoria e identidad dentro de la demostración, pero no reemplaza la pantalla `/cuenta` de Roble.
- **Trayectoria:** existe en el prototipo original y en la web (`/perfil/trayectoria`), pero no está en las 18 capturas. Por tanto, **9 de las 10 pantallas originales** aparecen en el PDF y esta es la que falta documentar visualmente.
- **Mensajes, privacidad, ajustes, recuperación y verificación:** son vistas adicionales de la implementación web; no estaban entre las diez pantallas del prototipo original y aún no tienen capturas en este documento.
- **Integración real:** los proyectos, equipos y notificaciones de estas evidencias usan cuentas ficticias A/B y almacenamiento del navegador. La [corrección de permisos de Roble](PLAN_PERMISOS_ROBLE.md) es requisito para demostrar los mismos datos en móvil y web con dos cuentas auténticas.
