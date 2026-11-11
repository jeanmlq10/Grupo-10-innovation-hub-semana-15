# Entrega conjunta de Proyéctate: web y móvil

## Qué pidió Andrew y cómo se entrega

Hay **un repositorio Git** con dos clientes que comparten Roble:

| Carpeta | Cliente | Se abre con |
|---|---|---|
| Raíz (`src/`) | Web Next.js | Navegador en `http://localhost:3000` |
| `mobile/` | App Expo/React Native | Expo Go, emulador Android o simulador iOS |

Ambos usan el contrato `movil_flutter_dcaabc5f4e`. Una persona inicia sesión con
la **misma cuenta** en cada cliente; los proyectos, solicitudes, notificaciones,
perfil y mensajes se leen del mismo servicio. Las sesiones de web y móvil son
independientes. Abrir una URL desde el navegador de un teléfono muestra la
**web adaptable**; para abrir la app nativa se escanea el QR de Expo o se
instala una compilación móvil. Tener un solo repositorio no hace que una URL
de navegador se convierta automáticamente en la app instalada.

La app Flutter original sigue disponible en su repositorio histórico. La
carpeta `mobile/` contiene la nueva versión React Native que compartió Andrew.

## Preparación

Se recomienda Node.js 24 o superior. Desde la raíz:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

En otra terminal, desde la misma raíz:

```bash
npm ci --prefix mobile
npm run mobile:start
```

Expo muestra un QR para el teléfono. También se puede ejecutar
`npm run mobile:android` o `npm run mobile:ios`. Para el teléfono físico y el
servidor Expo, usa la misma red; `cd mobile && npx expo start --tunnel` sirve
si no comparten red. La configuración pública de Roble para la app móvil está
en `mobile/dart_defines.json`; cualquier `.env` local se mantiene fuera de Git.
Los secretos y contraseñas de prueba nunca se añaden al repositorio.

## Recorrido para la prueba manual y el video

1. Mostrar la raíz y `mobile/` en el mismo repositorio. Enseñar las órdenes de
   arranque de web y Expo y el mismo identificador de contrato en ambos
   `.env.example`.
2. Abrir web y app móvil. Mostrar la identidad visual Proyéctate, el logo y
   la mascota.
3. Iniciar sesión con una cuenta de prueba **sin mostrar contraseña ni código**.
   Abrir `/cuenta` en la web y mostrar que el ID de Roble coincide con el de
   la app móvil.
4. En web: Explorar → abrir proyecto → revisar descripción, roles y tareas
   públicas → solicitar unirse. En móvil: comprobar la solicitud con la misma
   cuenta.
5. Con la cuenta creadora, revisar Mis proyectos, solicitudes y notificaciones.
   Aceptar o rechazar una solicitud de prueba y verificar el cambio en el otro
   cliente. Evitar tocar datos reales que no sean de prueba.
6. En web, abrir Perfil y Mensajes. Editar nombre, biografía, privacidad y
   preferencias de avisos; comparar los cambios y una conversación con móvil.
   Comentar y seguir un proyecto de prueba; comprobar trayectoria y actividad.
7. Explicar que los proyectos eliminados desde móvil no aparecen en web y que
   el detalle público web omite tareas marcadas `visibility=team`.
8. Cerrar con lo verificado y los límites descritos a continuación.

## Estado y límites para explicar con precisión

- La web usa Roble para autenticación, catálogo con sesión, proyectos propios,
  solicitudes, notificaciones, perfil y mensajes. La web conserva sus antiguas
  rutas de demostración profundas para referencia, pero la navegación principal
  lleva a Roble.
- La web aún ejecuta sus endpoints autenticados **solo en desarrollo**. Antes
  de desplegar, hay que persistir sesiones de forma segura y revisar los
  permisos del contrato. La API pública del contrato había expuesto borradores;
  por eso `ROBLE_PUBLIC_READ_ENABLED` permanece en `false`.
- Roble no aplica una política que limite la lectura de `direct_messages` a
  sus dos participantes ni la de `project_task_private` a miembros del equipo.
  La web filtra lo que presenta, pero esto **no protege la API directa**. No
  presentar esas tablas como privadas frente a usuarios autenticados maliciosos.
- La web muestra portadas R2 y documentos ya cargados por móvil a quien creó
  el proyecto o pertenece al equipo. La carga de archivos y la edición de
  tareas internas siguen en móvil. El contenido interno no aparece en la
  ficha pública.
- La web sí muestra tareas internas al creador cuando el contenido está en
  `project_task_private`; no las muestra en la ficha pública.
- El contenido del PDF de pruebas incluye cuentas y contraseñas de referencia.
  Ese PDF no forma parte del repositorio ni del archivo de código.

## Verificación local

```bash
npm run lint
npm test
npm run build
npm run mobile:check
npm --prefix mobile run test:ci
```

La guía visual móvil proporcionada es
`DOCUMENTACION_VISUAL_APLICACION_MOVIL.pdf`. Esta entrega incorpora el código
de la app y la guía de recorrido; el PDF se puede adjuntar por separado a la
presentación si se necesita.

Para grabar la explicación web, sigue `docs/GUION_VIDEO_WEB.md`.
