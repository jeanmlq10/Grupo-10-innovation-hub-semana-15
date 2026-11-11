# Proyéctate · Web y móvil

Proyéctate reúne ideas y personas para crear proyectos universitarios. Este repositorio contiene dos clientes que usan el **mismo contrato de Roble**:

| Carpeta | Aplicación | Cómo se abre |
| --- | --- | --- |
| Raíz (`src/`) | Web con Next.js y TypeScript | Navegador en `http://localhost:3000` |
| [`mobile/`](mobile/) | App con Expo y React Native | Expo Go, emulador o compilación móvil |

Una persona puede iniciar sesión con la misma cuenta en ambos clientes y consultar los datos del contrato compartido. Cada cliente mantiene su propia sesión. La app Flutter original sigue en el [repositorio histórico](https://github.com/jeanmlq10/Grupo-10-innovation-hub).

## Equipo y contribuciones

- **Jean y Óscar:** desarrollo de la parte web de Proyéctate.
- **Andrew:** migración de la aplicación móvil de Flutter a React Native.
- **Jean:** integración del trabajo y la documentación de ambos clientes en este repositorio único.

Las partes se trabajaron localmente y Jean reunió los archivos en el repositorio final. Por eso en este repositorio solo aparecen commits de Jean: ese historial refleja quién integró y subió el trabajo, aunque el desarrollo de la web también fue de Óscar y la migración móvil fue de Andrew.

## Requisitos

- Node.js **24.3 o superior** y npm. Esta versión cubre los requisitos de la web y de `mobile/`.
- Para probar en teléfono: Expo Go compatible con el SDK de `mobile/`, o un emulador/simulador.
- Acceso al contrato `movil_flutter_dcaabc5f4e` de Roble para los flujos con datos reales.

## Ejecutar la web

Desde la raíz del repositorio:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). `.env.example` contiene la URL, el identificador de contrato y las opciones públicas de desarrollo; `.env.local` queda fuera de Git. No guardes contraseñas, códigos ni tokens en el repositorio.

Al iniciar sesión, la web abre **Explorar proyectos**. Las rutas principales incluyen registro y verificación de correo, recuperación de contraseña, catálogo y detalle, creación y edición de proyectos, postulaciones, notificaciones, mensajes, perfil y cuenta.

### Sesión web de desarrollo

El navegador recibe una cookie `HttpOnly` con un identificador aleatorio. Los tokens de Roble se guardan en archivos privados del directorio temporal del sistema, no en el almacenamiento del navegador. La sesión dura hasta **8 horas**, salvo cierre de sesión o rechazo de autenticación de Roble. Sobrevive a la recarga de páginas y al reinicio del servidor local. Cuando varias vistas necesitan renovar el mismo token, la web coordina una sola renovación. Un rechazo de lectura de una tabla no debe cerrar la sesión.

Esta implementación es **solo para desarrollo local**: los endpoints autenticados están deshabilitados fuera de `NODE_ENV=development`. Requiere una solución de sesión de producción y una revisión de permisos antes de desplegar la web con datos reales.

## Ejecutar la app móvil

En otra terminal, desde la raíz:

```bash
npm ci --prefix mobile
npm run mobile:start
```

Escanea el QR con Expo Go. También puedes usar `npm run mobile:android` o `npm run mobile:ios`. Si el teléfono no comparte la red del computador, ejecuta `cd mobile && npx expo start --tunnel`. La configuración pública de Roble de la app está en `mobile/dart_defines.json`; consulta la [guía móvil](mobile/README.md) para configuración, pruebas y limitaciones de Expo Go.

## Datos reales y demostración local

La navegación autenticada consulta Roble para proyectos, solicitudes, avisos, perfil y mensajes. Un proyecto creado desde la web se guarda como borrador, se agregan sus tareas y luego se publica. Si el proceso falla a mitad de camino, la interfaz muestra el identificador para revisar el resultado antes de reintentar.

La web conserva rutas de **demostración local** con cuentas ficticias A y B. Esos datos viven solo en el navegador y **no se sincronizan con Roble ni con móvil**. Sirven para presentar el diseño y los flujos si Roble no está disponible; no son evidencia de sincronización. Consulta [proyectos demo](docs/FLUJO_PROYECTOS_DEMO.md) y [comunicaciones demo](docs/FLUJO_COMUNICACIONES_DEMO.md).

Si Roble responde con **429 (demasiados intentos)** durante el inicio de sesión, deja de reintentar hasta que el servicio permita otro acceso. Reiniciar Next.js no elimina un límite aplicado por Roble. Si una vista muestra un error de lectura, revisa la respuesta de la API y los permisos del contrato; la web no debe interpretar automáticamente ese error como cierre de sesión.

## Verificación

```bash
npm run lint
npm test
npm run build
npm run mobile:check
npm --prefix mobile run test:ci
```

La [prueba E2E manual](docs/E2E_MANUAL_ROBLE.md) describe cómo comprobar los flujos con dos cuentas. El [guion del video web](docs/GUION_VIDEO_WEB.md) cubre solo la presentación en navegador. La [guía de entrega conjunta](docs/ENTREGA_WEB_MOVIL.md) explica cómo mostrar web y móvil en un mismo repositorio.

## Estado y límites

- La interfaz usa el logo, la mascota y los colores oficiales de Proyéctate. El [estado de vistas](docs/ESTADO_PROYECTATE.md) y la [paridad visual](docs/PARIDAD_UI_WEB.md) detallan lo implementado.
- Las portadas y los documentos de proyectos ya cargados pueden consultarse en la web según el acceso del usuario. La carga de archivos y la edición de tareas internas siguen en móvil.
- La auditoría detectó que los permisos directos de Roble pueden exponer datos que la web oculta, incluidos borradores y datos privados. El filtrado en Next.js **no protege el acceso directo a la API**. Por eso `ROBLE_PUBLIC_READ_ENABLED` permanece en `false` y no se debe presentar el contrato como listo para producción. Véanse la [auditoría](docs/ROBLE_ACCESS_AUDIT.md) y el [plan de permisos](docs/PLAN_PERMISOS_ROBLE.md).
- La sincronización entre clientes debe verificarse con dos cuentas y el contrato real antes de la entrega final. Un fallo temporal de Roble puede afectar las vistas reales sin afectar la demo local.

## Estructura y documentación

- `src/app/`: páginas y rutas API de la web.
- `src/lib/roble/`: autenticación, sesiones y adaptación de datos de Roble.
- `mobile/`: app Expo/React Native independiente, con sus propias dependencias.
- `public/brand/`: recursos oficiales de marca.
- `tests/`: pruebas de flujos, acceso y contrato.
- `docs/`: [plan de migración](docs/MIGRACION_WEB.md), [prototipo visual](docs/disenos-web.html), [evidencias](docs/EVIDENCIAS_FLUJOS_WEB.md) y guías de prueba.

La integración continua ejecuta lint, pruebas y compilación de la web en cada push y pull request.
