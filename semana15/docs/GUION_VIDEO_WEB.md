# Guion para grabar la demostración web de Proyéctate

Duración sugerida: 4–5 minutos. Usa una cuenta de prueba y un proyecto de prueba. Antes de grabar, abre `http://localhost:3000`, maximiza el navegador y oculta contraseñas, códigos, correo personal y pestañas ajenas al proyecto. La web debe estar ejecutándose con `npm run dev`; las operaciones con Roble funcionan en desarrollo.

## Preparación de datos (sin grabar)

1. Inicia sesión en la web. En **Mis proyectos**, prepara un proyecto de prueba publicado con descripción, categoría, un rol y una tarea. Si vas a mostrar solicitudes, prepara una segunda cuenta que se postule desde otro perfil de navegador. Usa solo datos de prueba.
2. Comprueba que **Explorar** muestra el proyecto y que **Mis proyectos** lo muestra únicamente con la cuenta creadora.
3. Si mostrarás una portada o documento cargado desde móvil, comprueba que aparece en la ficha web. El documento se muestra al creador o a un integrante aceptado. Si el proyecto no tiene archivos, omite esa parte del video.
4. Ten abiertas las pestañas `/cuenta`, `/explorar/roble`, `/mis-proyectos/roble`, `/notificaciones/roble` y `/perfil`. Comprueba que no aparezcan errores de conexión antes de grabar.

## Recorrido y narración

| Tiempo | Pantalla y acción | Qué decir |
| --- | --- | --- |
| 0:00–0:30 | Bienvenida e inicio de sesión; la web abre **Explorar** directamente. | «Esta es la versión web de Proyéctate, construida con Next.js y adaptada a escritorio y móvil. La cuenta es la misma que usa la aplicación móvil». No grabes al escribir la contraseña. |
| 0:30–1:35 | **Explorar**: busca por nombre o categoría, abre un proyecto y pasa por descripción, tareas y equipo. | «La web consulta proyectos publicados. Cada ficha muestra los roles, cupos y tareas disponibles; también permite seguir y comentar». Si existe portada, muéstrala aquí. |
| 1:35–2:10 | Con la cuenta B, pulsa **Unirme al equipo** o **Postularme a la tarea**, escribe un mensaje y envía. | «La solicitud queda registrada en Roble y la cuenta creadora recibe un aviso». Si solo tienes una cuenta, explica esta función sin simular un envío. |
| 2:10–3:00 | Con la cuenta A, abre **Notificaciones** y **Mis proyectos → Solicitudes**; acepta la solicitud de prueba. | «La creadora decide desde la web. Al aceptar, se actualizan los cupos y el integrante aparece en el proyecto». Puedes mostrar la misma solicitud en móvil si la app está abierta. |
| 3:00–3:40 | **Mis proyectos → Tareas**: cambia el estado de una tarea a **En progreso**. Después abre **Perfil → Trayectoria**. | «El progreso se guarda en Roble y puede verse desde los dos clientes. El perfil resume proyectos y participaciones». |
| 3:40–4:20 | **Mensajes** o **Perfil → Editar perfil**: muestra una conversación de prueba o edita la biografía. Desde **Perfil → Mi cuenta de Roble** puedes mostrar el identificador compartido. | «Mensajes y perfil también usan la identidad compartida». No muestres conversaciones privadas de terceros. |
| 4:20–4:40 | Regresa a **Explorar** o a la portada del proyecto. | «La experiencia web cubre exploración, creación, participación y seguimiento de proyectos con la identidad visual de Proyéctate». |

## Si algo falla durante la grabación

- Si una vista dice **Inicia sesión**, vuelve a `/login` y entra de nuevo antes de grabar ese tramo.
- Si Roble no responde, pausa la grabación y verifica la conexión; no presentes las rutas locales de demostración como datos sincronizados.
- Si no hay segunda cuenta disponible, graba creación, edición, exploración y perfil con A. Explica las solicitudes como funcionalidad implementada sin afirmar que se probó en ese momento.
- Si una acción de escritura da error, revisa el proyecto antes de repetirla; algunas operaciones afectan varias tablas y Roble no ofrece transacción entre ellas.

## Qué queda fuera de esta demo

La grabación demuestra el flujo en el servidor local de desarrollo. No equivale a un despliegue público ni a una auditoría de los permisos directos del contrato Roble. La carga de archivos y la edición de tareas internas siguen en móvil; la web puede mostrar portadas y documentos ya cargados si Roble entrega sus URLs temporales.
