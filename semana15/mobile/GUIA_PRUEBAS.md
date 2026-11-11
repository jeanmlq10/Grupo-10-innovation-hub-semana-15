# Guía del entorno de pruebas (demo-2026-11)

Todo lo de la demo está guardado en Roble (y en Cloudflare R2 para los
archivos) y marcado con `demoSeed = 'demo-2026-11'`. Nada está escrito en la
app: las pantallas leen los mismos datos que leerían con uso real.

## Cuentas

Las contraseñas las define quien crea cada cuenta en Roble
(Autenticación → Usuarios → Agregar usuario, rol `user`). No están en el
código ni en el repositorio.

| Cuenta | Persona | Papel en la demo |
|---|---|---|
| `prueba.creador@uninorte.edu.co` | Camila Rojas | **Creadora** de los 5 proyectos |
| `prueba@uninorte.edu.co` | Usuario Prueba | **Integrante activa** de INSTAGRAM, CHISPA y POLAR CRAVING |
| `prueba.integrante@uninorte.edu.co` | Mateo Díaz | **Integrante** de INSTAGRAM, POLAR CRAVING y DUO |
| `prueba.externo@uninorte.edu.co` | Sofía Herrera | **Usuaria externa**: no pertenece a ningún equipo |

## Los 5 proyectos (de Camila)

| Proyecto | Categoría | Estado | Equipo | Tareas (públicas / solo equipo) |
|---|---|---|---|---|
| INSTAGRAM | Tecnología | MVP en pruebas · convocatoria abierta | Usuario Prueba (Diseñador/a), Mateo (Desarrollador/a) | 3 / 2 |
| CHISPA | Arte y cultura | Convocatoria abierta | Usuario Prueba (Comunicador/a) | 3 / 1 |
| POLAR CRAVING | Emprendimiento | Piloto de ventas | Usuario Prueba (Diseñador/a), Mateo (Comunicador/a) | 3 / 1 |
| ARTFEST | Arte y cultura | Planeación · convocatoria abierta | Aún sin integrantes (2 solicitudes pendientes) | 2 / 1 |
| DUO | Educación | Completado (todas las tareas terminadas) | Mateo (Desarrollador/a) | 2 / 1 |

Cada uno tiene:
- Portada propia en R2.
- Descripción, objetivos y etapa.
- Comentarios con respuestas.
- Seguidores.
- CHISPA, INSTAGRAM, POLAR CRAVING y ARTFEST tienen además un documento de contexto (PDF o Word ficticio).

## Qué probar con cada cuenta

### Camila Rojas · creadora
- **Mis proyectos:** los 5, con portada, miembros, tareas y solicitudes pendientes.
- **Notificaciones:** 4 sin leer y 3 leídas.
  - Nuevas solicitudes: Sofía en CHISPA y Usuario Prueba en ARTFEST.
  - Postulación de Mateo a la tarea "Plan de voluntarios".
  - Comentarios de Sofía y de Usuario Prueba.
- **Solicitudes:** desde la campana → icono de bandeja → "Ver solicitudes recibidas", o tocando la notificación. Puede **aceptar o rechazar**.
  - Al aceptar se crea el integrante, sube el contador de su rol o tarea y la otra persona recibe la notificación.
- **Tareas:** en cada proyecto, menú ⋮ de una tarea.
  - Cambiar el estado: disponible, en progreso o completada. Al completar, se avisa a quien la tenía asignada.
  - Cambiar la visibilidad: Público o Solo equipo.
- **Documentos:** en Resumen → "Documentos del proyecto", abre el PDF o Word con una URL firmada temporal.
- **Imagen y documentos:** en Editar proyecto → Información básica, cambia la portada o sube más documentos.
- **Eliminar:** Mis proyectos → ⋮ → Eliminar proyecto. Es una eliminación lógica.
- **Mensajes:** Perfil → Mensajes. Tiene conversaciones con Usuario Prueba y con Sofía.

### Usuario Prueba · integrante activa
- **Notificaciones:** 6 sin leer y 4 leídas, de todos los tipos.
  - Solicitudes aceptadas, tarea asignada, tarea completada y respuesta a su comentario.
  - **Recordatorio** de la tarea del feed, **actualización** de ARTFEST y **mensaje** de Mateo.
  - Prueba "Todas", "No leídas", los filtros rápidos (⚙) y el punto de la barra inferior.
- **Proyectos de su equipo** (INSTAGRAM, CHISPA, POLAR CRAVING):
  - Ve las tareas **Solo equipo** con su contenido.
  - Ve los **documentos** del proyecto.
- **ARTFEST:** su solicitud aparece pendiente. No ve la tarea interna ni los documentos.
- **Perfil:** las estadísticas salen de los registros, no son números escritos a mano.
  - 3 participaciones, 3 tareas asignadas y 1 completada (33 % de cumplimiento).
  - 7 solicitudes enviadas y 6 aceptadas (86 % de calidad de aportes).
  - Colaboración 90 %: sale de 3 participaciones y 3 comentarios.
  - Actividad reciente.
- **Chat:** con Mateo y con Camila.

### Mateo Díaz · integrante
- **DUO:** completado, con sus tareas terminadas.
- **Perfil:** 2 tareas asignadas y 2 completadas (100 % de cumplimiento) y 1 proyecto completado (DUO).
- **INSTAGRAM y POLAR CRAVING:** como integrante.
- **ARTFEST:** su postulación está pendiente.
- **Notificaciones:** aceptaciones, tarea completada, respuestas a sus comentarios y mensaje de Usuario Prueba.
- **Comentar y responder:** en cualquier proyecto, desde el icono de comentarios.

### Sofía Herrera · usuaria externa
- **Explorar:** ve los 5 proyectos publicados con su información pública.
- **No ve:**
  - Las tareas **Solo equipo**: solo el aviso "Hay N tareas internas…".
  - La sección de **documentos**.
- **Notificaciones:**
  - Su solicitud a POLAR CRAVING fue **rechazada**.
  - Su solicitud a CHISPA está **pendiente**.
  - Camila respondió su comentario.
- **Puede:** solicitar unirse a INSTAGRAM o ARTFEST, comentar y escribirle a Camila.

## Límites de privacidad de Roble (aceptados para la demo)

- **Lecturas por condición:** Roble no limita las lecturas por "es integrante del proyecto". La app solo muestra las tareas privadas y los documentos al creador y su equipo. Alguien con sesión que llame a la API directamente podría leer `project_task_private` y `project_attachments`.
- **Archivos:** cualquier usuario con sesión puede pedir la URL firmada de un archivo si conoce su id. El bucket **no es público** y las URLs caducan en minutos.

## Volver a preparar o limpiar

| Qué | Cómo |
|---|---|
| Regenerar el SQL de la demo | `python3 scripts/demo/generar_seed_sql.py` |
| Cargar la demo | Ejecutar `roble/demo/2026-11_seed_demo.sql` en la Consola SQL de Roble |
| Subir portadas y documentos | `node scripts/demo/subir_archivos_demo.mjs` (pide la contraseña de Camila) |
| Borrar los archivos demo de R2 | `node scripts/demo/subir_archivos_demo.mjs --borrar` |
| Borrar los datos demo | Ejecutar `roble/demo/2026-11_limpiar_demo.sql`. Solo borra lo marcado `demo-2026-11` |
