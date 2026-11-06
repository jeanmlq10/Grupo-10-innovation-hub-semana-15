# Innovation Hub Web

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

La primera pantalla Explorar y el adaptador de lectura de proyectos públicos están preparados. Inicio de sesión, perfil y escritura de datos aún no están conectados. El adaptador devuelve solo campos aptos para la tarjeta pública y solo acepta filas publicadas para «Toda la comunidad».

**Pendiente antes de datos reales:** resolver los permisos de lectura de Roble descritos en `ROBLE_PROJECTS_SETUP.md` del repositorio móvil. Filtrar filas en Next.js no evita que alguien consulte directamente la API de Roble. El acceso privado debe protegerse en el backend para los dos clientes.

## Estructura

- `src/app/`: rutas y presentación.
- `src/lib/roble/`: adaptación de respuestas de Roble.
- `tests/`: pruebas del contrato público.
- `.github/workflows/ci.yml`: lint, prueba y compilación.

El plan completo está en `MIGRACION_WEB.md` del repositorio móvil.
