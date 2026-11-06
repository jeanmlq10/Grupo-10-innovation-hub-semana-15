# Innovation Hub Web

El reparto de trabajo para Jean y Óscar está en [docs/REPARTO_JEAN_OSCAR.md](docs/REPARTO_JEAN_OSCAR.md). También están en `docs/` el plan general de migración, la guía de paridad visual y la auditoría inicial de acceso a Roble.

Cliente web de Innovation Hub (Grupo 10), construido con Next.js y TypeScript. La aplicación móvil permanece en el repositorio `Grupo-10-innovation-hub`; ambas usarán el mismo proyecto de Roble y el mismo `userId` para identificar a cada persona.

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

Bienvenida, Iniciar sesión, Registro y Explorar adaptan el prototipo web entregado por el equipo (`docs/disenos-web.html`). Explorar tiene barra lateral en escritorio, navegación inferior en móvil, buscador, pestañas, tarjetas y panel de filtros. En desarrollo muestra proyectos de ejemplo con una etiqueta visible para revisar el diseño; en producción no muestra esos ejemplos. Los formularios de acceso y registro están deshabilitados hasta validar Roble. Perfil, filtros de datos y escritura aún no están conectados. El adaptador de proyectos devuelve solo campos aptos para la tarjeta pública y solo acepta filas publicadas para «Toda la comunidad».

**Pendiente antes de datos reales:** resolver los permisos de lectura de Roble descritos en `ROBLE_PROJECTS_SETUP.md` del repositorio móvil. Filtrar filas en Next.js no evita que alguien consulte directamente la API de Roble. El acceso privado debe protegerse en el backend para los dos clientes.

## Estructura

- `src/app/`: rutas y presentación.
- `src/lib/roble/`: adaptación de respuestas de Roble.
- `tests/`: pruebas del contrato público.
- `docs/disenos-web.html`: prototipo visual de referencia; sus datos y botones son demostrativos.
- `.github/workflows/ci.yml`: lint, prueba y compilación.

El plan completo está en [docs/MIGRACION_WEB.md](docs/MIGRACION_WEB.md).
