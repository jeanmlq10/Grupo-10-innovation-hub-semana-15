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

Abrir `http://localhost:3000`. La consulta real a Roble permanece desactivada por defecto. No establecer `ROBLE_PUBLIC_READ_ENABLED=true` hasta verificar y corregir la lectura pública de borradores en Roble. El archivo `.env.local` no se versiona.

## Comprobaciones

```bash
npm run lint
npm test
npm run build
```

## Estado de la migración

La nueva identidad visual usa los logos y colores oficiales recibidos en `proyectate-identidad-visual.zip`. Ya hay rutas para las diez vistas principales del prototipo y para Mensajes y Configuración. Bienvenida y «Comencemos» se adaptaron a las nuevas capturas móviles. El [flujo de proyectos de demostración](docs/FLUJO_PROYECTOS_DEMO.md) permite crear borradores, publicarlos localmente, editarlos, seguirlos, comentar y revisar solicitudes con dos cuentas ficticias. La [guía de comunicaciones](docs/FLUJO_COMUNICACIONES_DEMO.md) cubre mensajes, avisos, leído y preferencias entre esas mismas cuentas. Esta persistencia vive solo en el navegador durante desarrollo. El inicio de sesión y la escritura real en Roble siguen pendientes.

**Pendiente antes de datos reales:** la [auditoría de Roble](docs/ROBLE_ACCESS_AUDIT.md) confirmó el 9 de noviembre de 2026 que la API pública devuelve borradores y que una cuenta de prueba puede leer avisos de otros destinatarios. Filtrar filas en Next.js no evita que alguien consulte directamente la API. El acceso privado debe protegerse en el backend para los dos clientes.

## Estructura

- `src/app/`: rutas y presentación.
- `src/lib/roble/`: adaptación de respuestas de Roble.
- `tests/`: pruebas del contrato público.
- `docs/disenos-web.html`: prototipo visual de referencia; sus datos y botones son demostrativos.
- `.github/workflows/ci.yml`: lint, prueba y compilación.

El plan completo está en [docs/MIGRACION_WEB.md](docs/MIGRACION_WEB.md).
