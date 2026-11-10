# Proyéctate Web

El estado actualizado de vistas, diseño y conexión a Roble está en [docs/ESTADO_PROYECTATE.md](docs/ESTADO_PROYECTATE.md). El reparto previo entre Jean y Óscar queda documentado en `docs/REPARTO_JEAN_OSCAR.md`; Jean asumió la implementación web completa.

Cliente web de Proyéctate (Grupo 10), construido con Next.js y TypeScript. La aplicación móvil permanece en el repositorio `Grupo-10-innovation-hub`; ambas usarán el mismo proyecto de Roble y el mismo `userId` para identificar a cada persona.

## Desarrollo local

Requiere Node.js 20.9 o superior.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abrir `http://localhost:3000`. En desarrollo, `/login` autentica con la misma cuenta y contrato de Roble que usa la app móvil; `/cuenta` muestra el `userId` de Roble y permite cerrar sesión. Los tokens quedan solo en memoria del servidor de desarrollo y el navegador recibe una cookie protegida con un identificador aleatorio. Reiniciar el servidor termina la sesión. Este acceso está deshabilitado en compilaciones de producción.

El [registro y la recuperación de contraseña](docs/FLUJOS_CUENTA_ROBLE.md) también funcionan en desarrollo: `/registro` envía el código institucional, `/verificar-correo` confirma la cuenta y permite reenviar el código, y `/recuperar-contrasena` lleva a `/restablecer-contrasena` con el token recibido. La web no persiste contraseñas ni códigos en archivos o almacenamiento del navegador.

La lectura real de proyectos, perfiles, mensajes y avisos permanece desactivada. No establecer `ROBLE_PUBLIC_READ_ENABLED=true` hasta verificar y corregir la lectura pública de borradores en Roble. El archivo `.env.local` no se versiona. Ver [el flujo de identidad](docs/FLUJO_LOGIN_ROBLE.md).

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

## Estado de la migración

La nueva identidad visual usa los logos y colores oficiales recibidos en `proyectate-identidad-visual.zip`. Ya hay rutas para las diez vistas principales del prototipo y para Mensajes y Configuración. Bienvenida y «Comencemos» se adaptaron a las nuevas capturas móviles. El [flujo de proyectos de demostración](docs/FLUJO_PROYECTOS_DEMO.md) permite crear borradores, publicarlos localmente, editarlos, seguirlos, comentar y revisar solicitudes con dos cuentas ficticias. La [guía de comunicaciones](docs/FLUJO_COMUNICACIONES_DEMO.md) cubre mensajes, avisos, leído y preferencias entre esas mismas cuentas. Esta persistencia vive solo en el navegador durante desarrollo. El inicio de sesión real de desarrollo ya está conectado; la escritura real en Roble sigue pendiente.

**Pendiente antes de datos reales:** la [auditoría de Roble](docs/ROBLE_ACCESS_AUDIT.md) confirmó el 9 de noviembre de 2026 que la API pública devuelve borradores y que una cuenta de prueba puede leer avisos de otros destinatarios. Filtrar filas en Next.js no evita que alguien consulte directamente la API. El acceso privado debe protegerse en el backend para los dos clientes.

La [corrección de permisos y solicitud al administrador](docs/PLAN_PERMISOS_ROBLE.md) describe la matriz de acceso y la secuencia compatible con la app móvil. La cuenta probada mostró el mismo `userId` en móvil y web; no se guarda ese identificador en Git.

Para presentar las capturas existentes según las cinco tareas solicitadas, usa la [guía de evidencias por tareas](docs/WIREFRAMES_POR_TAREAS.md) o su [PDF visual](docs/WIREFRAMES_POR_TAREAS_2026-11-09.pdf). Las [18 capturas completas](docs/EVIDENCIAS_FLUJOS_WEB_2026-11-09.pdf) están en un documento aparte.

Los [wireframes nuevos dibujados para esas cinco tareas](docs/WIREFRAMES_DISENADOS_POR_TAREAS.md) tienen su propio [PDF vectorial](docs/WIREFRAMES_DISENADOS_POR_TAREAS_2026-11-09.pdf). Las pantallas de gestión independiente de equipo están identificadas como propuesta, porque aún no son rutas de la aplicación.

## Estructura

- `src/app/`: rutas y presentación.
- `src/lib/roble/`: adaptación de respuestas de Roble.
- `tests/`: pruebas del contrato público.
- `docs/disenos-web.html`: prototipo visual de referencia; sus datos y botones son demostrativos.
- `.github/workflows/ci.yml`: lint, prueba y compilación.

El plan completo está en [docs/MIGRACION_WEB.md](docs/MIGRACION_WEB.md).
