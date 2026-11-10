# Proyéctate (Grupo 10): versión React Native

Esta es la migración a **React Native + Expo (SDK 58) + TypeScript** de la app Flutter + GetX
`f_clean_template`. Tiene el mismo diseño, las mismas pantallas y la misma lógica, y usa **el
mismo backend Roble** (Uninorte OpenLab) sin cambiar URL, contrato, endpoints ni la forma de
autenticar.

El detalle de la migración está en [`MIGRACION.md`](MIGRACION.md): tabla de archivos,
conexiones conservadas, cambios técnicos, limitaciones y pruebas. La identidad visual de
Proyéctate (logo, colores, ícono y pantalla inicial) se explica en
[Identidad visual](#identidad-visual-proyéctate).

## Requisitos

- Node.js 20 o superior. La plantilla del curso recomienda la versión de `.nvmrc` (24); se probó con Node 22.
- La app **Expo Go** actualizada (SDK 58, la que hoy instala la App Store) en el teléfono, o un emulador de Android o un simulador de iOS.

## Instalación

```bash
npm install
```

## Configuración (Roble)

La app lee las **mismas variables** que el proyecto Flutter:

| Variable | Para qué sirve |
|---|---|
| `ROBLE_BASE_URL` | URL de Roble (`https://roble-api.test-openlab.uninorte.edu.co`) |
| `ROBLE_CONTRACT_ID` | Contrato del proyecto en la consola de Roble |
| `ROBLE_SSO_REDIRECT` | Nombre del "destino de retorno" para Microsoft (es un nombre, no una URL) |
| `ROBLE_NATIVE_CALLBACK_SCHEME` | Esquema de URL de la app para Microsoft en Android/iOS |
| `INSTITUTIONAL_EMAIL_DOMAIN` | Dominio permitido al registrarse (`uninorte.edu.co`) |

La app las busca en este orden (lo hace `app.config.ts`):

1. un archivo `.env` en la raíz (cópialo de `.env.example`) o el entorno del sistema;
2. si no están ahí, `dart_defines.json`, el mismo archivo que usaba Flutter con
   `--dart-define-from-file`.

`dart_defines.json` ya trae la URL y el contrato públicos del proyecto, así que **la app funciona
sin crear un `.env`**. Si cambias el `.env`, reinicia con `npx expo start -c`.

> No subas un `.env` real al repositorio (`.gitignore` ya lo excluye). El Client ID, el Client
> Secret y el Tenant de Microsoft **no** van en la app: se configuran sólo en la consola de Roble.

Las tablas, columnas y permisos que Roble debe tener son los mismos de siempre y están en
[`ROBLE_PROJECTS_SETUP.md`](ROBLE_PROJECTS_SETUP.md), copiado sin cambios del proyecto Flutter.

## Ejecutar

```bash
npx expo start          # escanea el QR con Expo Go (iPhone: con la cámara)
npx expo start --android
npx expo start --ios
npx expo start --web
```

Si el teléfono no está en la misma red Wi-Fi que el computador, usa `npx expo start --tunnel`.

## Pruebas y análisis

```bash
npm run typecheck   # TypeScript (tsc --noEmit)
npm run lint        # ESLint (expo lint)
npm run test:ci     # Jest: arranque de la app, pruebas unitarias portadas de Flutter y contrato HTTP de Roble
```

## Estructura

Es la misma arquitectura limpia por feature del proyecto Flutter. Cada archivo `.dart` tiene su
equivalente `.ts`/`.tsx` con el mismo nombre en camelCase:

```
App.tsx                      Equivale a main.dart: proveedores, tema, navegación y overlays
app.config.ts                Configuración de Expo y lectura de las variables de Roble
src/
├── core/
│   ├── di/                  Equivale a di/app_bindings.dart: inyección de dependencias (estilo Get.put/lazyPut)
│   ├── navigation/          Equivale a routes/: rutas y Nav (Get.to, Get.offNamed, Get.back…)
│   ├── state/Controller.ts  Equivale a GetxController y .obs/Obx
│   ├── roble/               Cliente de Roble; sdk/ es el port del paquete `roble` v1.12.0
│   ├── storage/ theme/ utils/ errors/ widgets/
│   └── ui/                  Widgets de Material de Flutter (botones, AppBar, diálogos, tabs, iconos…)
├── features/<feature>/
│   ├── domain/              Modelos, interfaces de repositorio y Failure
│   ├── data/                Datasource de Roble y repositorio
│   └── ui/                  Controladores (viewmodels), vistas y widgets
└── navigation/              RootNavigator (equivale a app_pages.dart) y authGuard
```

Features: `auth`, `projects`, `tasks`, `requests`, `members`, `follows`, `comments`,
`notifications`, `profile`, `messages`, `home`.

## Inicio de sesión con Microsoft

Igual que en Flutter, en Android/iOS el inicio con Microsoft necesita
`ROBLE_NATIVE_CALLBACK_SCHEME`, registrado en Roble como destino de retorno. `app.config.ts` lo
declara como `scheme` de la app. **Expo Go no puede usar un esquema propio**, así que para probar
Microsoft en el teléfono hace falta una *development build* (`npx expo run:android` /
`npx expo run:ios`). El correo y la contraseña de Roble funcionan en Expo Go.

## Identidad visual Proyéctate

### Colores

Todos los colores salen de **`src/core/theme/brand.ts`**. Para cambiar la identidad se edita solo
ese archivo.

| Color | Hex | Uso |
|---|---|---|
| Morado principal | `#2A0057` | encabezados, textos importantes, navegación, botones destacados |
| Morado secundario | `#8A3FFC` | botones secundarios, enlaces, elementos interactivos, estados activos |
| Verde limón | `#D9FF4D` | acentos, indicadores (punto de notificaciones), estado "Disponible", avisos |
| Cian de apoyo | `#7ED6FF` | fondos de apoyo, estado "En progreso", ilustraciones, degradados |

- `Palette` (en el mismo archivo) define los colores por uso: textos, fondos, bordes, sombras,
  estados de éxito, progreso y error, campos y tintes claros.
- `HomeColors` (`homeColors.ts`) y el tema Material 3 (`appTheme.ts`) toman sus valores de
  `brand.ts`, así que ninguna pantalla define colores propios de la marca.

### Archivos del logo

Todos salen de la imagen oficial del logo: se recortaron y se les quitó el fondo blanco, sin
redibujar nada.

| Archivo | Qué es | Dónde se usa |
|---|---|---|
| `assets/images/brand/logo-proyectate.png` | logo completo (símbolo + "proyéctate"), fondo transparente | Bienvenida, transición de entrada |
| `assets/images/brand/logo-symbol.png` | solo el símbolo (brote) | "Comencemos" (nueva idea) |
| `assets/images/icon.png` | ícono 1024×1024, símbolo sobre blanco | ícono de iOS y general |
| `assets/images/android-icon-foreground.png` | símbolo dentro de la zona segura, fondo transparente | ícono adaptativo de Android |
| `assets/images/splash-logo.png` | logo completo con margen | pantalla inicial nativa |
| `assets/images/favicon.png` | símbolo pequeño | pestaña del navegador (web) |

El componente `src/core/widgets/BrandLogo.tsx` muestra el logo en las pantallas. Reemplaza a la
antigua nubecita, cuyos archivos se eliminaron.

> Si consiguen el logo original en alta resolución (PNG de 2000 px o más, o SVG), basta con
> reemplazar estos archivos con el mismo nombre y tamaño proporcional.

### Cómo probar el ícono y la pantalla inicial

- **En Expo Go** (`npx expo start -c`):
  - Se ven los colores, el logo en las pantallas y la **transición de entrada**: el logo sobre
    blanco que se desvanece al cargar (`LaunchOverlay.tsx`).
  - El **ícono** de la pantalla de inicio del iPhone y la **pantalla inicial nativa** no cambian:
    Expo Go siempre muestra los suyos.
- **Para ver el ícono y la pantalla inicial reales** hay que **reconstruir la app**: una
  *development build* (`npx expo run:ios` / `npx expo run:android`, o con EAS:
  `npx eas build --profile development`) o una build de producción. En cada reconstrucción,
  Expo genera los íconos y la pantalla inicial a partir de `app.config.ts`.
- El nombre bajo el ícono ahora es **Proyéctate**.
