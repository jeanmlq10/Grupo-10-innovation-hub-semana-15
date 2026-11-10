# Evidencias de los flujos web de Proyéctate

**Fecha de las capturas:** 9 de noviembre de 2026

**Documento para presentar:** [PDF de evidencias, 16 páginas](EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf)

**Alcance:** 14 capturas del entorno local `localhost:3000`, organizadas en siete recorridos.

| Página del PDF | Evidencia | Recorrido | Pantalla |
| --- | --- | --- | --- |
| 2 | E01 | Acceso | Bienvenida y opciones de entrada |
| 3 | E02 | Acceso | Registro institucional |
| 4 | E03 | Acceso | Inicio de sesión |
| 5 | E04 | Descubrimiento | Explorar proyectos |
| 6 | E05 | Gestión | Mis proyectos |
| 7 | E06 | Gestión | Editar EcoCampus |
| 8 | E07 | Creación | 1/6 Comencemos |
| 9 | E08 | Creación | 2/6 Información básica |
| 10 | E09 | Creación | 3/6 Equipo y tareas |
| 11 | E10 | Creación | 4/6 Tiempo estimado |
| 12 | E11 | Creación | 5/6 Audiencia |
| 13 | E12 | Creación | 6/6 Revisar y publicar |
| 14 | E13 | Detalle | PROYECTOPRUEBA y miembros |
| 15 | E14 | Perfil | Cuenta de prueba A y trayectoria |

Las capturas de registro e inicio de sesión muestran formularios, pero no un envío o ingreso completado. La identidad web se integra con Roble en desarrollo según [el estado del proyecto](ESTADO_PROYECTATE.md); esas imágenes por sí solas no prueban la autenticación.

Los proyectos, miembros y métricas de las capturas pertenecen a la **demostración local** del navegador. No evidencian datos sincronizados con la aplicación móvil ni permisos corregidos en Roble. La página 16 del PDF resume lo probado y lo que aún falta demostrar.

El PDF se puede regenerar con `python3 tools/build_evidence_pdf.py --input-dir /ruta/a/las/capturas --output docs/EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf` usando las 14 capturas originales. El generador no altera esos archivos.
