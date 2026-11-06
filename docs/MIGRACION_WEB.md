# Plan de migración: Flutter móvil + Next.js web

Estado: implementación iniciada. Repositorio móvil: `Grupo-10-innovation-hub`. Repositorio web local: `Grupo-10-innovation-hub-web`.

## Avance inicial

- Se creó un repositorio Git local independiente con Next.js 16, React y TypeScript en `../Grupo-10-innovation-hub-web`.
- La pantalla Explorar, el adaptador de proyectos publicados, `.env.example`, CI y una prueba de filtrado están preparados. Lint, prueba y compilación pasaron.
- La lectura real de Roble está desactivada por defecto. Falta corregir o verificar en el backend la exposición de borradores antes de activarla.
- La matriz inicial de riesgos y las pruebas con usuarios A/B están en `docs/ROBLE_ACCESS_AUDIT.md` de este repositorio.
- El repositorio remoto privado `jeanmlq10/Grupo-10-innovation-hub-web` ya contiene la base web. La copia local sigue `origin/main` y está limpia.
- El prototipo web de diez pantallas entregado por el equipo quedó en `docs/disenos-web.html` del repositorio web. Bienvenida, Iniciar sesión, Alta institucional y Explorar ya tienen rutas y diseño adaptable basados en él. Los formularios de acceso y registro permanecen deshabilitados hasta validar permisos y sesión de Roble; las otras seis pantallas siguen pendientes.

## Objetivo y organización

Mantener la app móvil en Flutter y construir una aplicación web independiente con Next.js, React y TypeScript. Los dos clientes usarán las mismas cuentas y los mismos datos de Roble. No hay que comprimir, fusionar ni copiar todo el repositorio móvil: el nuevo repositorio contendrá solo el código web. El móvil será la referencia de comportamiento durante la migración.

En un proyecto local de Codex, agregar ambas carpetas desde **Editar proyecto → Añadir carpeta**. Elegir como principal el repositorio que se esté trabajando; las operaciones Git automáticas apuntan al principal. Cada repositorio conserva sus ramas, CI y despliegues.

## Inventario confirmado

- App actual: `semana_final/f_clean_template-main/`, Flutter + GetX + SDK Dart de Roble. Ya incluye una compilación web y pruebas en Chrome que sirven como referencia.
- Módulos: autenticación, proyectos, tareas, solicitudes, miembros, comentarios, seguidos, mensajes, notificaciones y perfil.
- Tablas compartidas: `projects`, `project_tasks`, `project_requests`, `request_decisions`, `project_members`, `project_comments`, `project_follows`, `app_notifications`, `user_profiles` y `direct_messages`.
- La autenticación móvil incluye correo/contraseña, verificación, recuperación y Microsoft SSO. El retorno web de SSO se configura por entorno.
- Las reglas de datos y permisos están documentadas en `semana_final/f_clean_template-main/ROBLE_PROJECTS_SETUP.md`.

## Arquitectura propuesta

```text
Flutter móvil ────────┐
                     ├── Roble: identidad y datos compartidos
Next.js web ─────────┘
```

- Next.js App Router para páginas públicas y privadas. TypeScript para los modelos y contratos. Mantener el acceso a Roble detrás de una capa de servicios del repositorio web; confirmar los métodos de API, CORS y sesión antes de elegir SDK o cliente HTTP.
- Páginas públicas: Explorar y detalle publicado, si los permisos reales de Roble lo permiten. Páginas privadas: Mis proyectos, edición, solicitudes, mensajes, notificaciones y perfil.
- La web tendrá diseño adaptable a escritorio y móvil, rutas compartibles, estados de carga y error, y navegación accesible.
- La interfaz debe mantener paridad visual y de experiencia con los prototipos y la app Flutter. Tokens, componentes y criterios de comparación están en `docs/PARIDAD_UI_WEB.md` de este repositorio.
- Configuración separada para desarrollo, pruebas y producción. Cada origen web necesita su retorno de Microsoft SSO. Las credenciales privadas nunca van al navegador ni al repositorio.
- No duplicar base de datos ni sincronizar copias. Los dos clientes deben leer y escribir el mismo contrato de Roble. Los cambios incompatibles de esquema requieren una secuencia compatible con ambas versiones.

## Misma cuenta en móvil y web

- La persona inicia sesión en ambos clientes contra el **mismo proyecto de Roble**. La web usará el `userId` que devuelve Roble para buscar sus datos, igual que Flutter; el correo no será la clave para vincular información.
- El perfil usa `user_profiles.userId`. Los proyectos propios se identifican por la autoría de Roble (`_owner`/`createdBy`). Solicitudes, tareas, mensajes y notificaciones conservan sus identificadores y relaciones actuales.
- Cada dispositivo mantiene su propia sesión. Cerrar sesión en la web no debe borrar datos ni cerrar inesperadamente la sesión móvil; esto se comprobará con el comportamiento real de Roble.
- Después de guardar un cambio en un cliente, el otro debe mostrarlo al volver a cargar los datos. No se promete actualización en tiempo real hasta confirmar que el backend la ofrece o implementar un mecanismo específico.
- La web no crea un perfil duplicado al primer inicio de sesión: consulta por `userId` y solo crea la fila cuando no existe, con el mismo criterio que la app móvil.

Pruebas mínimas con dos cuentas de prueba A y B:

| Caso | Resultado esperado |
|---|---|
| A inicia sesión en móvil y web | Ve el mismo perfil, proyectos propios y participación. |
| A edita perfil o proyecto en móvil | La web muestra el cambio al recargar. |
| A edita desde web | El móvil muestra el cambio al recargar. |
| B inicia sesión | No recibe datos privados de A, ni por interfaz ni mediante acceso directo a la API. |
| A cierra sesión en web | Los datos persisten; la sesión móvil se comporta según lo comprobado en Roble. |

## Revisión obligatoria de acceso a datos

El archivo `ROBLE_PROJECTS_SETUP.md` advierte que el filtrado de borradores, notificaciones, mensajes y perfiles se hace parcialmente en el cliente. Según ese inventario, usuarios con acceso a la API podrían leer filas que la interfaz oculta, y `projects` pública permite consultar borradores por API. Esta es una limitación existente, no creada por Next.js. **No publicar datos sensibles en la nueva web hasta verificar y corregir los controles de lectura en Roble o en una arquitectura de backend que proteja ambos clientes.** Un filtro de interfaz no es un control de acceso.

Antes de implementar funciones privadas, probar con cuentas de distintos usuarios qué filas puede leer cada token directamente desde Roble y definir la corrección compatible con la app móvil. También comprobar qué datos de proyectos publicados pueden ser realmente públicos.

## Entregas

| Etapa | Trabajo | Criterio de salida |
|---|---|---|
| 0. Contrato y seguridad | Inventariar modelos, reglas, permisos, operaciones Roble y flujos de sesión. Probar acceso cruzado con cuentas de prueba. | Contrato documentado y decisión sobre permisos de lectura; no quedan datos privados expuestos para el alcance del lanzamiento. |
| 1. Base web | Crear repositorio Next.js + TypeScript, configuración por entorno, lint, build, CI, estructura de servicios y diseño base. | La web compila en CI y corre localmente sin secretos en Git. |
| 2. Primer flujo | Explorar, detalle de proyecto publicado y autenticación básica. Conectar al mismo Roble. | La misma cuenta ve su identidad y sus datos en ambos clientes; un proyecto publicado desde móvil aparece en web. |
| 3. Proyectos | Mis proyectos, borradores, creación, edición, tareas, roles y audiencia. | Las acciones hechas en web aparecen en móvil; borradores ajenos no son accesibles. |
| 4. Colaboración | Solicitudes, decisiones, miembros, comentarios y seguidos. | Contadores, autoría y permisos coinciden entre clientes. |
| 5. Cuenta | Perfil, mensajes, notificaciones, preferencias y Microsoft SSO. | Se validan privacidad, destinatarios, retorno SSO y sesiones en ambos clientes. |
| 6. Publicación | Pruebas cruzadas, accesibilidad, rendimiento, dominio, monitoreo y despliegue gradual. | Móvil sigue operativo; web puede publicarse y revertirse de forma independiente. |

## Primeras tareas técnicas (histórico)

1. Extraer de Flutter una matriz de pantallas, modelos, campos y operaciones Roble; registrar cuáles son públicas.
2. Verificar en Roble los permisos reales de dos usuarios y un visitante; acordar la corrección de los datos privados.
3. Crear `Grupo-10-innovation-hub-web` con Next.js y TypeScript, más README, `.env.example` y CI.
4. Implementar un adaptador de Roble y la página Explorar con datos de prueba o datos públicos verificados.
5. Comparar el resultado web con la app Flutter y registrar diferencias antes de continuar con escritura de datos.

## Decisiones por cerrar

- Condiciones para mantener el repositorio privado o hacerlo público después de la revisión de seguridad.
- Dominio y proveedor de despliegue para cada entorno.
- Alcance exacto del primer lanzamiento: lectura pública y login, o también creación de proyectos.
- Mecanismo de corrección de permisos de lectura en Roble compatible con móvil y web.
