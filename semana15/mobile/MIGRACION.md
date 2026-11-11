# Migración Flutter → React Native: informe

Proyecto origen: `f_clean_template` (Flutter + GetX, backend Roble).
Proyecto destino: esta carpeta (Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript).
**El proyecto Flutter no se modificó.**

## 1. Resumen

- Se migraron **187 archivos Dart** (unos 17.700 líneas) a **211 archivos TS/TSX**. Cada archivo de
  `lib/` tiene su equivalente con el mismo nombre (tabla de la sección 7).
- Se conservan **las 40 pantallas**, la navegación, las validaciones, los estados (cargando, vacío,
  error, sin conexión) y la lógica de negocio.
- Las **conexiones con Roble no cambiaron**: la misma URL, el mismo contrato, los mismos endpoints,
  métodos, cuerpos, tokens y nombres de variables (sección 3).
- No hay mocks en la app: los datos salen siempre de Roble. Sólo las pruebas usan un `fetch` simulado.
- Se mantuvo la arquitectura limpia por feature (`domain` / `data` / `ui`).

## 2. Pantallas y funcionalidades migradas

| Feature | Pantallas | Funcionalidad |
|---|---|---|
| auth | Central, Bienvenida, Iniciar sesión, Registro (alta institucional + verificación por código), ¿Qué quieres hacer? | Login/registro con Roble, verificación de correo, reenviar código, olvidé mi contraseña, Microsoft (SSO con PKCE), modo visitante, restauración de sesión, primer acceso, AuthGuard, diálogo "Necesitas iniciar sesión", política de contraseña, reintentos con backoff y Retry-After |
| projects | Explorar (Home), Filtros, Mis proyectos, Crear proyecto, Nueva idea, Información básica, Equipo necesario, Tareas, Tiempo estimado, Público, Revisar y publicar, Proyecto publicado, Detalle del proyecto | Listado público/seguido, búsqueda, filtros combinados (fecha, tareas, miembros, roles), asistente de creación/edición, fechas límite, publicar/privado, pestañas del detalle, seguir proyecto, columnas opcionales de Roble |
| tasks | Tareas disponibles | Estado de tarea (disponible, en curso, cerrada, completada), postulación según fecha límite |
| requests | Elegir participación, Unirse al equipo, Solicitud enviada, Solicitudes | Solicitudes de rol o de tarea, aceptar/rechazar, decisiones |
| members / follows | (usadas en el detalle y el perfil) | Miembros del proyecto, seguir/dejar de seguir |
| comments | Hoja de comentarios del proyecto | Listar y publicar comentarios |
| notifications | Notificaciones, Filtrar notificaciones, Notificación de solicitud, Resultado de solicitud, Actividad | Categorías, filtros, marcar como leída, preferencias silenciadas |
| profile | Perfil, Editar perfil, Ajustes, Cerrar sesión, Privacidad, Notificaciones (ajustes), Trayectoria, Historial de actividad, Mis ideas, Perfil público, Participaciones | Resumen de trayectoria y compromiso, exportar/copiar datos, preferencias |
| messages | Mensajes, Chat | Conversaciones agrupadas, no leídos, envío de mensajes |
| home | Barra inferior (Explorar · Mis proyectos · Notificaciones · Perfil) | Navegación con `offNamed` y sesión requerida |

## 3. Conexiones conservadas (sin cambios)

| Elemento | Valor / comportamiento |
|---|---|
| URL base | `ROBLE_BASE_URL` = `https://roble-api.test-openlab.uninorte.edu.co` |
| Contrato | `ROBLE_CONTRACT_ID` = `movil_flutter_dcaabc5f4e` |
| Variables | `ROBLE_BASE_URL`, `ROBLE_CONTRACT_ID`, `ROBLE_SSO_REDIRECT`, `ROBLE_NATIVE_CALLBACK_SCHEME`, `INSTITUTIONAL_EMAIL_DOMAIN`: los mismos nombres; se leen de `.env` o de `dart_defines.json` |
| Auth: `{base}/auth/{contrato}/…` | `POST signup`, `POST verify-email`, `POST resend-code`, `POST login`, `POST logout`, `POST refresh-token`, `GET me`, `POST forgot-password`, `POST reset-password`, `GET providers`, `GET {proveedor}/start` (PKCE S256), `POST token` |
| Datos: `{base}/database/{contrato}/…` | `POST insert-one {tableName, record}`, `GET read?tableName=…&col=valor`, `PUT update {tableName, idColumn:"_id", idValue, updates}`, `DELETE delete {tableName, idColumn:"_id", idValue}`, `GET public-read` (sin `Authorization`) |
| Tokens | `Authorization: Bearer <accessToken>`; ante un 401 se renueva con `refresh-token` y se reintenta una vez; el id del usuario es el `sub` del JWT |
| Sesión guardada | Clave `roble.session.{contrato}` en almacenamiento seguro (expo-secure-store; AsyncStorage en web) |
| Reglas de escritura | Se quita `_owner` antes de escribir; `_id`/`id` no van en `updates` |
| Tablas | `projects`, `project_tasks`, `project_requests`, `request_decisions`, `project_members`, `project_comments`, `project_follows`, `app_notifications`, `user_profiles`, `direct_messages` |
| SDK | Port a TypeScript del paquete `roble` **v1.12.0** (el que fija `pubspec.lock`), tomado de su repositorio oficial |

Las pruebas `__tests__/unit/roble.test.ts` comprueban URL, método, cuerpo y cabeceras de
login, `me`, CRUD, `public-read` y la renovación por 401.

## 4. Cambios técnicos (equivalencias)

| Flutter | React Native |
|---|---|
| `GetMaterialApp`, `GetPage`, `AuthGuard` | `@react-navigation/native-stack` + `src/core/navigation/Nav.ts` (`to`, `off`, `offAll`, `offNamed`, `offAllNamed`, `back(result)`) + `authGuard` |
| `GetxController`, `.obs`, `Obx` | `Controller` + `Rx` + `useController` (`useSyncExternalStore`) en `src/core/state/Controller.ts` |
| `Get.put` / `Get.lazyPut(fenix: true)` / `Get.find` | Contenedor DI (`register`, `registerLazy`, `useFind`) con el mismo ciclo de vida (`onInit`/`onClose`) |
| `Get.dialog`, `Get.bottomSheet`, `Get.snackbar` | `OverlayHost` (`src/core/ui/overlay.tsx`) con el mismo aspecto del snackbar de GetX (gris 20 %, radio 15, 3 s, arriba) |
| `package:http` | `fetch` |
| `shared_preferences` / `flutter_secure_storage` | `@react-native-async-storage/async-storage` / `expo-secure-store` |
| `flutter_svg` | `react-native-svg` |
| `showDatePicker` | `@react-native-community/datetimepicker` (Android nativo; diálogo en iOS/web) |
| `Clipboard` | `expo-clipboard` |
| PKCE (`dart:math`/`crypto`) | `expo-crypto` |
| Abrir Microsoft | `expo-web-browser` (`openAuthSessionAsync`) |
| `Icons.*` de Material | Las fuentes oficiales de Material Icons (Regular, Outlined, Round) con una tabla de glifos generada: son exactamente los mismos iconos |
| `BoxShadow` | `boxShadow` de RN 0.88 (blur convertido) |
| `FlexScheme.yellowM3` | Paleta M3 equivalente para los widgets por defecto; `HomeColors` idénticos |
| `loggy` | `console` |
| `flutter_launcher_icons` | El mismo icono como `icon`, `adaptiveIcon` y `splash` en `app.config.ts` |

Dependencias añadidas a la plantilla del curso, todas en la versión que fija Expo SDK 58:
`react-native-svg 15.16.0`, `@react-native-community/datetimepicker 9.2.1`,
`expo-secure-store ~58.0.2`, `expo-crypto ~58.0.7`, `expo-clipboard ~58.0.4`. Todas funcionan en
Expo Go.

Otros cambios:
- El React Compiler de la plantilla está **desactivado**. Los controladores estilo GetX son mutables
  y el compilador podría memorizar valores viejos. Por la misma razón, `eslint.config.js` apaga sus
  4 reglas exclusivas (`refs`, `set-state-in-effect`, `immutability`, `globals`). `rules-of-hooks`
  y `exhaustive-deps` siguen activas.
- Se quitaron el ejemplo de notas y la pantalla de inicio de la plantilla.

### Actualización a SDK 58 (28 oct 2026)

La plantilla del curso venía en SDK 57, pero Expo Go para iPhone ya se actualizó a SDK 58 y en iOS
no se pueden instalar versiones anteriores. El proyecto se subió a **Expo 58.0.21 · React Native
0.88.1 · React 19.3.0**, con todas las dependencias en las versiones que fija SDK 58. React Native
0.88 cambió la forma de tipar las referencias, así que en 6 archivos los tipos `useRef<View>`,
`useRef<ScrollView>` y `useRef<TextInput>` pasaron a `ViewInstance`, `ScrollViewInstance` y
`TextInputInstance`: es un cambio solo de tipos, sin efecto en ejecución. No cambió nada de Roble.

## 5. Diferencias conocidas y problemas sin resolver

| # | Tema | Detalle | Qué hacer |
|---|---|---|---|
| 1 | Microsoft en Expo Go | Necesita `ROBLE_NATIVE_CALLBACK_SCHEME` y un esquema propio, que Expo Go no permite (en Flutter también hacía falta configurarlo) | Definir el esquema, registrarlo en Roble como destino de retorno y usar una development build (`npx expo run:android`/`ios`) |
| 2 | Pantallas con sesión sin probar contra Roble | Desde el entorno donde se migró no había acceso de red a Roble | Probar en el teléfono con Expo Go: login, crear proyecto, solicitudes, notificaciones, chat (lista en la sección 6) |
| 3 | Transiciones | Se usan las transiciones nativas de cada plataforma en lugar del zoom de Flutter en Android | Ninguna, salvo que se quiera igualar la animación |
| 4 | Snackbar | Sin el desenfoque de fondo del snackbar de GetX (el color y el tamaño son iguales) | Opcional: `expo-blur` |
| 5 | Diálogo "Acerca de" / licencias | La lista de licencias es más simple que `showAboutDialog` | Ninguna |
| 6 | Tema oscuro | El original tenía `darkTheme`, pero todas las pantallas pintan fondo blanco fijo; se mantiene igual | Ninguna |
| 7 | Identificadores | Se conservan `com.example.f_clean_template` (Android) y `com.example.fCleanTemplate` (iOS), igual que en Flutter | Cambiarlos antes de publicar en tiendas |
| 8 | Pruebas de widgets e integración | `test/widget/auth/signup_flow_test.dart` e `integration_test/` y las pruebas de controladores con fakes no se portaron | Portarlas con `@testing-library/react-native` si el curso las pide |

## 6. Pruebas

**Realizadas (todas pasaron):**

| Prueba | Resultado |
|---|---|
| `npm install` | OK (sin `node_modules` en el ZIP) |
| `npx tsc --noEmit` | 0 errores |
| `npx expo lint` | 0 errores, 0 advertencias |
| `npm run test:ci` (Jest) | 3 suites, **47 pruebas OK**: arranque de la app completa hasta la Bienvenida, política de contraseña, filtros de Explorar, fechas límite, trayectoria, categorías de notificación, conversaciones, `RobleAuthConfig`, `AuthenticationUser`, `RetryPolicy`, `RetryAfterClient`, columnas opcionales y el contrato HTTP de Roble |
| `npx expo export -p web` | Bundle OK (1,8 MB) |
| `npx expo export -p android -p ios` | Bundles Hermes OK (3,4 MB cada uno): todos los imports y assets resuelven |
| Prueba visual web (Playwright, 390×844) | Bienvenida, Iniciar sesión (con validación de campos vacíos), Registro, Explorar en modo visitante, Filtros (con el contador de filtros activos) y el diálogo "Necesitas iniciar sesión" se ven bien y sin errores de JavaScript |
| Conexión real | Explorar llamó a `GET …/database/movil_flutter_dcaabc5f4e/public-read?tableName=projects` y `…project_tasks`. El entorno no tenía acceso a Roble, así que se mostró el estado "Sin conexión a internet / Reintentar", igual que en Flutter |

**Pendientes (no se pudieron ejecutar aquí):**
- Abrir la app en Expo Go en un dispositivo físico.
- Todos los flujos con datos reales de Roble: login, registro y verificación, crear/editar proyecto,
  solicitudes, comentarios, notificaciones, perfil y mensajes.
- Microsoft SSO (ver punto 1 de la sección 5).

## 7. Tabla de archivos (Flutter → React Native)

Archivos nuevos de soporte, sin equivalente directo en Dart: `src/core/state/Controller.ts`,
`src/core/di/{container,DIProvider,tokens}.ts(x)`, `src/core/navigation/{Nav,screen}.ts(x)`,
`src/core/roble/sdk/*` (port del paquete `roble`), `src/core/ui/*` (equivalentes de los widgets de
Material), `src/core/theme/shadow.ts`, `src/features/projects/ui/widgets/wizardBits.tsx`,
`src/features/notifications/domain/models/appNotificationType.ts`, `__tests__/unit/*`.

Archivos de la plantilla modificados: `App.tsx`, `app.config.ts` (antes `app.json`), `package.json`,
`tsconfig.json`, `eslint.config.js`, `.gitignore`. Archivos copiados o adaptados del proyecto Flutter: `.env.example` (las mismas
variables), `dart_defines.json`, `ROBLE_PROJECTS_SETUP.md`, `assets/images/icon.png`. Se borró
`__tests__/` de la plantilla (pruebas del ejemplo de notas) y se escribió uno nuevo.

| # | Archivo Flutter (`lib/`) | Archivo React Native | Cambio |
|---|---|---|---|
| 1 | `core/errors/app_failure.dart` | `src/core/errors/appFailure.ts` | Port 1:1 |
| 2 | `core/roble/retry_after_client.dart` | `src/core/roble/retryAfterClient.ts` | 1:1; `package:http` → fetch |
| 3 | `core/roble/roble_client.dart` | `src/core/roble/robleClient.ts` | 1:1; `package:http` → fetch |
| 4 | `core/roble/roble_config.dart` | `src/core/roble/robleConfig.ts` | 1:1; `package:http` → fetch |
| 5 | `core/roble/roble_guard.dart` | `src/core/roble/robleGuard.ts` | 1:1; `package:http` → fetch |
| 6 | `core/roble/roble_optional_columns.dart` | `src/core/roble/robleOptionalColumns.ts` | 1:1; `package:http` → fetch |
| 7 | `core/roble/roble_rows.dart` | `src/core/roble/robleRows.ts` | 1:1; `package:http` → fetch |
| 8 | `core/storage/i_local_preferences.dart` | `src/core/storage/iLocalPreferences.ts` | shared_preferences → AsyncStorage; flutter_secure_storage → expo-secure-store |
| 9 | `core/storage/local_preferences_secured.dart` | `src/core/storage/localPreferencesSecured.ts` | shared_preferences → AsyncStorage; flutter_secure_storage → expo-secure-store |
| 10 | `core/storage/local_preferences_shared.dart` | `src/core/storage/localPreferencesShared.ts` | shared_preferences → AsyncStorage; flutter_secure_storage → expo-secure-store |
| 11 | `core/theme/app_theme.dart` | `src/core/theme/appTheme.ts` | Mismos colores (#4B309E); FlexScheme → paleta M3 |
| 12 | `core/theme/home_colors.dart` | `src/core/theme/homeColors.ts` | Mismos colores (#4B309E); FlexScheme → paleta M3 |
| 13 | `core/utils/date_format.dart` | `src/core/utils/dateFormat.ts` | Port 1:1 |
| 14 | `core/utils/deadline.dart` | `src/core/utils/deadline.ts` | Port 1:1 |
| 15 | `core/utils/error_message.dart` | `src/core/utils/errorMessage.ts` | Port 1:1 |
| 16 | `core/utils/time_ago.dart` | `src/core/utils/timeAgo.ts` | Port 1:1 |
| 17 | `core/widgets/dashed_border.dart` | `src/core/widgets/DashedBorder.tsx` | Widget → componente con los mismos estilos |
| 18 | `di/app_bindings.dart` | `src/core/di/appContainer.ts` | Get.put/lazyPut(fenix) → contenedor DI con el mismo orden y ciclo de vida |
| 19 | `features/auth/data/datasources/remote/authentication_source_service.dart` | `src/features/auth/data/datasources/remote/authenticationSourceService.ts` | Mismas tablas, filtros y llamadas a Roble |
| 20 | `features/auth/data/datasources/remote/i_authentication_source.dart` | `src/features/auth/data/datasources/remote/iAuthenticationSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 21 | `features/auth/data/repositories/auth_repository.dart` | `src/features/auth/data/repositories/authRepository.ts` | Interfaz/implementación 1:1 |
| 22 | `features/auth/data/retry_policy.dart` | `src/features/auth/data/retryPolicy.ts` | Port 1:1 |
| 23 | `features/auth/domain/auth_exceptions.dart` | `src/features/auth/domain/authExceptions.ts` | Port 1:1 |
| 24 | `features/auth/domain/models/authentication_user.dart` | `src/features/auth/domain/models/authenticationUser.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 25 | `features/auth/domain/password_policy.dart` | `src/features/auth/domain/passwordPolicy.ts` | Port 1:1 |
| 26 | `features/auth/domain/repositories/i_auth_repository.dart` | `src/features/auth/domain/repositories/iAuthRepository.ts` | Interfaz/implementación 1:1 |
| 27 | `features/auth/ui/auth_guard.dart` | `src/navigation/authGuard.ts` | Port 1:1 |
| 28 | `features/auth/ui/first_access_store.dart` | `src/features/auth/ui/firstAccessStore.ts` | Port 1:1 |
| 29 | `features/auth/ui/viewmodels/authentication_controller.dart` | `src/features/auth/ui/viewmodels/authenticationController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 30 | `features/auth/ui/views/central.dart` | `src/features/auth/ui/views/Central.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 31 | `features/auth/ui/views/login_page.dart` | `src/features/auth/ui/views/LoginPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 32 | `features/auth/ui/views/signup_page.dart` | `src/features/auth/ui/views/SignUpPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 33 | `features/auth/ui/views/welcome_page.dart` | `src/features/auth/ui/views/WelcomePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 34 | `features/auth/ui/views/what_to_do_page.dart` | `src/features/auth/ui/views/WhatToDoPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 35 | `features/auth/ui/widgets/auth_form_widgets.dart` | `src/features/auth/ui/widgets/authFormWidgets.tsx` | Widget → componente con los mismos estilos |
| 36 | `features/auth/ui/widgets/auth_loading_view.dart` | `src/features/auth/ui/widgets/authLoadingView.tsx` | Widget → componente con los mismos estilos |
| 37 | `features/auth/ui/widgets/login_required_dialog.dart` | `src/features/auth/ui/widgets/loginRequiredDialog.tsx` | Widget → componente con los mismos estilos |
| 38 | `features/auth/ui/widgets/verification_code_input.dart` | `src/features/auth/ui/widgets/verificationCodeInput.tsx` | Widget → componente con los mismos estilos |
| 39 | `features/auth/ui/widgets/welcome_cloud_illustration.dart` | `src/features/auth/ui/widgets/welcomeCloudIllustration.tsx` | Widget → componente con los mismos estilos |
| 40 | `features/comments/data/datasources/i_comment_data_source.dart` | `src/features/comments/data/datasources/iCommentDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 41 | `features/comments/data/datasources/roble_comment_data_source.dart` | `src/features/comments/data/datasources/robleCommentDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 42 | `features/comments/data/repositories/comment_repository.dart` | `src/features/comments/data/repositories/commentRepository.ts` | Interfaz/implementación 1:1 |
| 43 | `features/comments/domain/comment_failure.dart` | `src/features/comments/domain/commentFailure.ts` | Port 1:1 |
| 44 | `features/comments/domain/models/project_comment.dart` | `src/features/comments/domain/models/projectComment.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 45 | `features/comments/domain/repositories/i_comment_repository.dart` | `src/features/comments/domain/repositories/iCommentRepository.ts` | Interfaz/implementación 1:1 |
| 46 | `features/comments/ui/viewmodels/comments_controller.dart` | `src/features/comments/ui/viewmodels/commentsController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 47 | `features/comments/ui/widgets/project_comments_sheet.dart` | `src/features/comments/ui/widgets/ProjectCommentsSheet.tsx` | Widget → componente con los mismos estilos |
| 48 | `features/follows/data/datasources/i_follow_data_source.dart` | `src/features/follows/data/datasources/iFollowDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 49 | `features/follows/data/datasources/roble_follow_data_source.dart` | `src/features/follows/data/datasources/robleFollowDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 50 | `features/follows/data/repositories/follow_repository.dart` | `src/features/follows/data/repositories/followRepository.ts` | Interfaz/implementación 1:1 |
| 51 | `features/follows/domain/follow_failure.dart` | `src/features/follows/domain/followFailure.ts` | Port 1:1 |
| 52 | `features/follows/domain/models/project_follow.dart` | `src/features/follows/domain/models/projectFollow.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 53 | `features/follows/domain/repositories/i_follow_repository.dart` | `src/features/follows/domain/repositories/iFollowRepository.ts` | Interfaz/implementación 1:1 |
| 54 | `features/home/ui/widgets/home_bottom_navigation.dart` | `src/features/home/ui/widgets/HomeBottomNavigation.tsx` | Widget → componente con los mismos estilos |
| 55 | `features/members/data/datasources/i_member_data_source.dart` | `src/features/members/data/datasources/iMemberDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 56 | `features/members/data/datasources/roble_member_data_source.dart` | `src/features/members/data/datasources/robleMemberDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 57 | `features/members/data/repositories/member_repository.dart` | `src/features/members/data/repositories/memberRepository.ts` | Interfaz/implementación 1:1 |
| 58 | `features/members/domain/member_failure.dart` | `src/features/members/domain/memberFailure.ts` | Port 1:1 |
| 59 | `features/members/domain/models/project_member.dart` | `src/features/members/domain/models/projectMember.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 60 | `features/members/domain/repositories/i_member_repository.dart` | `src/features/members/domain/repositories/iMemberRepository.ts` | Interfaz/implementación 1:1 |
| 61 | `features/messages/data/datasources/i_message_data_source.dart` | `src/features/messages/data/datasources/iMessageDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 62 | `features/messages/data/datasources/roble_message_data_source.dart` | `src/features/messages/data/datasources/robleMessageDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 63 | `features/messages/data/repositories/message_repository.dart` | `src/features/messages/data/repositories/messageRepository.ts` | Interfaz/implementación 1:1 |
| 64 | `features/messages/domain/message_failure.dart` | `src/features/messages/domain/messageFailure.ts` | Port 1:1 |
| 65 | `features/messages/domain/models/conversation.dart` | `src/features/messages/domain/models/conversation.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 66 | `features/messages/domain/models/direct_message.dart` | `src/features/messages/domain/models/directMessage.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 67 | `features/messages/domain/repositories/i_message_repository.dart` | `src/features/messages/domain/repositories/iMessageRepository.ts` | Interfaz/implementación 1:1 |
| 68 | `features/messages/ui/viewmodels/messages_controller.dart` | `src/features/messages/ui/viewmodels/messagesController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 69 | `features/messages/ui/views/chat_page.dart` | `src/features/messages/ui/views/ChatPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 70 | `features/messages/ui/views/messages_page.dart` | `src/features/messages/ui/views/MessagesPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 71 | `features/messages/ui/widgets/conversation_tile.dart` | `src/features/messages/ui/widgets/ConversationTile.tsx` | Widget → componente con los mismos estilos |
| 72 | `features/messages/ui/widgets/message_bubble.dart` | `src/features/messages/ui/widgets/MessageBubble.tsx` | Widget → componente con los mismos estilos |
| 73 | `features/notifications/data/datasources/i_notification_data_source.dart` | `src/features/notifications/data/datasources/iNotificationDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 74 | `features/notifications/data/datasources/roble_notification_data_source.dart` | `src/features/notifications/data/datasources/robleNotificationDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 75 | `features/notifications/data/repositories/notification_repository.dart` | `src/features/notifications/data/repositories/notificationRepository.ts` | Interfaz/implementación 1:1 |
| 76 | `features/notifications/domain/models/app_notification.dart` | `src/features/notifications/domain/models/appNotification.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 77 | `features/notifications/domain/models/notification_category.dart` | `src/features/notifications/domain/models/notificationCategory.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 78 | `features/notifications/domain/models/notification_preference.dart` | `src/features/notifications/domain/models/notificationPreference.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 79 | `features/notifications/domain/notification_failure.dart` | `src/features/notifications/domain/notificationFailure.ts` | Port 1:1 |
| 80 | `features/notifications/domain/repositories/i_notification_repository.dart` | `src/features/notifications/domain/repositories/iNotificationRepository.ts` | Interfaz/implementación 1:1 |
| 81 | `features/notifications/ui/viewmodels/notifications_controller.dart` | `src/features/notifications/ui/viewmodels/notificationsController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 82 | `features/notifications/ui/views/activity_notification_page.dart` | `src/features/notifications/ui/views/ActivityNotificationPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 83 | `features/notifications/ui/views/notification_filters_page.dart` | `src/features/notifications/ui/views/NotificationFiltersPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 84 | `features/notifications/ui/views/notifications_page.dart` | `src/features/notifications/ui/views/NotificationsPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 85 | `features/notifications/ui/views/request_notification_page.dart` | `src/features/notifications/ui/views/RequestNotificationPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 86 | `features/notifications/ui/views/request_result_page.dart` | `src/features/notifications/ui/views/RequestResultPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 87 | `features/notifications/ui/widgets/info_nav_tile.dart` | `src/features/notifications/ui/widgets/InfoNavTile.tsx` | Widget → componente con los mismos estilos |
| 88 | `features/notifications/ui/widgets/notification_labels.dart` | `src/features/notifications/ui/widgets/notificationLabels.ts` | Widget → componente con los mismos estilos |
| 89 | `features/notifications/ui/widgets/notification_tile.dart` | `src/features/notifications/ui/widgets/NotificationTile.tsx` | Widget → componente con los mismos estilos |
| 90 | `features/notifications/ui/widgets/person_header.dart` | `src/features/notifications/ui/widgets/PersonHeader.tsx` | Widget → componente con los mismos estilos |
| 91 | `features/notifications/ui/widgets/quote_box.dart` | `src/features/notifications/ui/widgets/QuoteBox.tsx` | Widget → componente con los mismos estilos |
| 92 | `features/profile/data/datasources/i_profile_data_source.dart` | `src/features/profile/data/datasources/iProfileDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 93 | `features/profile/data/datasources/roble_profile_data_source.dart` | `src/features/profile/data/datasources/robleProfileDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 94 | `features/profile/data/repositories/profile_repository.dart` | `src/features/profile/data/repositories/profileRepository.ts` | Interfaz/implementación 1:1 |
| 95 | `features/profile/domain/models/activity_entry.dart` | `src/features/profile/domain/models/activityEntry.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 96 | `features/profile/domain/models/public_profile.dart` | `src/features/profile/domain/models/publicProfile.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 97 | `features/profile/domain/models/trajectory_summary.dart` | `src/features/profile/domain/models/trajectorySummary.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 98 | `features/profile/domain/models/user_profile.dart` | `src/features/profile/domain/models/userProfile.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 99 | `features/profile/domain/profile_failure.dart` | `src/features/profile/domain/profileFailure.ts` | Port 1:1 |
| 100 | `features/profile/domain/repositories/i_profile_repository.dart` | `src/features/profile/domain/repositories/iProfileRepository.ts` | Interfaz/implementación 1:1 |
| 101 | `features/profile/ui/viewmodels/profile_controller.dart` | `src/features/profile/ui/viewmodels/profileController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 102 | `features/profile/ui/views/activity_history_page.dart` | `src/features/profile/ui/views/ActivityHistoryPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 103 | `features/profile/ui/views/edit_profile_page.dart` | `src/features/profile/ui/views/EditProfilePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 104 | `features/profile/ui/views/logout_page.dart` | `src/features/profile/ui/views/LogoutPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 105 | `features/profile/ui/views/my_ideas_page.dart` | `src/features/profile/ui/views/MyIdeasPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 106 | `features/profile/ui/views/notification_settings_page.dart` | `src/features/profile/ui/views/NotificationSettingsPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 107 | `features/profile/ui/views/privacy_page.dart` | `src/features/profile/ui/views/PrivacyPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 108 | `features/profile/ui/views/profile_page.dart` | `src/features/profile/ui/views/ProfilePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 109 | `features/profile/ui/views/public_profile_page.dart` | `src/features/profile/ui/views/PublicProfilePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 110 | `features/profile/ui/views/settings_page.dart` | `src/features/profile/ui/views/SettingsPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 111 | `features/profile/ui/views/trajectory_page.dart` | `src/features/profile/ui/views/TrajectoryPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 112 | `features/profile/ui/views/user_participations_page.dart` | `src/features/profile/ui/views/UserParticipationsPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 113 | `features/profile/ui/widgets/activity_entry_tile.dart` | `src/features/profile/ui/widgets/ActivityEntryTile.tsx` | Widget → componente con los mismos estilos |
| 114 | `features/profile/ui/widgets/avatar_icon_picker.dart` | `src/features/profile/ui/widgets/AvatarIconPicker.tsx` | Widget → componente con los mismos estilos |
| 115 | `features/profile/ui/widgets/avatar_icons.dart` | `src/features/profile/ui/widgets/avatarIcons.ts` | Widget → componente con los mismos estilos |
| 116 | `features/profile/ui/widgets/performance_bar.dart` | `src/features/profile/ui/widgets/PerformanceBar.tsx` | Widget → componente con los mismos estilos |
| 117 | `features/profile/ui/widgets/profile_avatar.dart` | `src/features/profile/ui/widgets/ProfileAvatar.tsx` | Widget → componente con los mismos estilos |
| 118 | `features/profile/ui/widgets/profile_labels.dart` | `src/features/profile/ui/widgets/profileLabels.ts` | Widget → componente con los mismos estilos |
| 119 | `features/profile/ui/widgets/profile_menu_tile.dart` | `src/features/profile/ui/widgets/ProfileMenuTile.tsx` | Widget → componente con los mismos estilos |
| 120 | `features/profile/ui/widgets/trajectory_stats_grid.dart` | `src/features/profile/ui/widgets/TrajectoryStatsGrid.tsx` | Widget → componente con los mismos estilos |
| 121 | `features/projects/data/datasources/i_project_data_source.dart` | `src/features/projects/data/datasources/iProjectDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 122 | `features/projects/data/datasources/roble_project_data_source.dart` | `src/features/projects/data/datasources/robleProjectDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 123 | `features/projects/data/repositories/project_repository.dart` | `src/features/projects/data/repositories/projectRepository.ts` | Interfaz/implementación 1:1 |
| 124 | `features/projects/domain/models/explore_filters.dart` | `src/features/projects/domain/models/exploreFilters.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 125 | `features/projects/domain/models/my_project.dart` | `src/features/projects/domain/models/myProject.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 126 | `features/projects/domain/models/project.dart` | `src/features/projects/domain/models/project.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 127 | `features/projects/domain/models/project_team_role.dart` | `src/features/projects/domain/models/projectTeamRole.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 128 | `features/projects/domain/project_failure.dart` | `src/features/projects/domain/projectFailure.ts` | Port 1:1 |
| 129 | `features/projects/domain/repositories/i_project_repository.dart` | `src/features/projects/domain/repositories/iProjectRepository.ts` | Interfaz/implementación 1:1 |
| 130 | `features/projects/ui/viewmodels/create_project_controller.dart` | `src/features/projects/ui/viewmodels/createProjectController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 131 | `features/projects/ui/viewmodels/home_controller.dart` | `src/features/projects/ui/viewmodels/homeController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 132 | `features/projects/ui/viewmodels/my_projects_controller.dart` | `src/features/projects/ui/viewmodels/myProjectsController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 133 | `features/projects/ui/viewmodels/project_detail_controller.dart` | `src/features/projects/ui/viewmodels/projectDetailController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 134 | `features/projects/ui/views/audience_page.dart` | `src/features/projects/ui/views/AudiencePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 135 | `features/projects/ui/views/basic_info_page.dart` | `src/features/projects/ui/views/BasicInfoPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 136 | `features/projects/ui/views/create_project_page.dart` | `src/features/projects/ui/views/CreateProjectPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 137 | `features/projects/ui/views/estimated_time_page.dart` | `src/features/projects/ui/views/EstimatedTimePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 138 | `features/projects/ui/views/explore_filters_page.dart` | `src/features/projects/ui/views/ExploreFiltersPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 139 | `features/projects/ui/views/home_page.dart` | `src/features/projects/ui/views/HomePage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 140 | `features/projects/ui/views/my_projects_page.dart` | `src/features/projects/ui/views/MyProjectsPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 141 | `features/projects/ui/views/new_idea_page.dart` | `src/features/projects/ui/views/NewIdeaPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 142 | `features/projects/ui/views/project_detail_page.dart` | `src/features/projects/ui/views/ProjectDetailPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 143 | `features/projects/ui/views/project_published_page.dart` | `src/features/projects/ui/views/ProjectPublishedPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 144 | `features/projects/ui/views/review_publish_page.dart` | `src/features/projects/ui/views/ReviewPublishPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 145 | `features/projects/ui/views/task_info_page.dart` | `src/features/projects/ui/views/TaskInfoPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 146 | `features/projects/ui/views/team_needed_page.dart` | `src/features/projects/ui/views/TeamNeededPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 147 | `features/projects/ui/widgets/active_filters_bar.dart` | `src/features/projects/ui/widgets/ActiveFiltersBar.tsx` | Widget → componente con los mismos estilos |
| 148 | `features/projects/ui/widgets/confetti_check_illustration.dart` | `src/features/projects/ui/widgets/ConfettiCheckIllustration.tsx` | Widget → componente con los mismos estilos |
| 149 | `features/projects/ui/widgets/counter_stepper.dart` | `src/features/projects/ui/widgets/CounterStepper.tsx` | Widget → componente con los mismos estilos |
| 150 | `features/projects/ui/widgets/create_idea_card.dart` | `src/features/projects/ui/widgets/CreateIdeaCard.tsx` | Widget → componente con los mismos estilos |
| 151 | `features/projects/ui/widgets/create_project_step_tile.dart` | `src/features/projects/ui/widgets/CreateProjectStepTile.tsx` | Widget → componente con los mismos estilos |
| 152 | `features/projects/ui/widgets/deadline_picker_field.dart` | `src/features/projects/ui/widgets/DeadlinePickerField.tsx` | Widget → componente con los mismos estilos |
| 153 | `features/projects/ui/widgets/explore_filter_labels.dart` | `src/features/projects/ui/widgets/exploreFilterLabels.ts` | Widget → componente con los mismos estilos |
| 154 | `features/projects/ui/widgets/explore_filter_tabs.dart` | `src/features/projects/ui/widgets/ExploreFilterTabs.tsx` | Widget → componente con los mismos estilos |
| 155 | `features/projects/ui/widgets/filter_option_chip.dart` | `src/features/projects/ui/widgets/FilterOptionChip.tsx` | Widget → componente con los mismos estilos |
| 156 | `features/projects/ui/widgets/idea_cloud_illustration.dart` | `src/features/projects/ui/widgets/IdeaCloudIllustration.tsx` | Widget → componente con los mismos estilos |
| 157 | `features/projects/ui/widgets/my_project_card.dart` | `src/features/projects/ui/widgets/MyProjectCard.tsx` | Widget → componente con los mismos estilos |
| 158 | `features/projects/ui/widgets/my_project_placeholder_card.dart` | `src/features/projects/ui/widgets/MyProjectPlaceholderCard.tsx` | Widget → componente con los mismos estilos |
| 159 | `features/projects/ui/widgets/my_projects_tabs.dart` | `src/features/projects/ui/widgets/MyProjectsTabs.tsx` | Widget → componente con los mismos estilos |
| 160 | `features/projects/ui/widgets/project_card.dart` | `src/features/projects/ui/widgets/ProjectCard.tsx` | Widget → componente con los mismos estilos |
| 161 | `features/projects/ui/widgets/project_search_bar.dart` | `src/features/projects/ui/widgets/ProjectSearchBar.tsx` | Widget → componente con los mismos estilos |
| 162 | `features/projects/ui/widgets/selectable_option_tile.dart` | `src/features/projects/ui/widgets/SelectableOptionTile.tsx` | Widget → componente con los mismos estilos |
| 163 | `features/projects/ui/widgets/step_progress_bar.dart` | `src/features/projects/ui/widgets/StepProgressBar.tsx` | Widget → componente con los mismos estilos |
| 164 | `features/projects/ui/widgets/team_role_tile.dart` | `src/features/projects/ui/widgets/TeamRoleTile.tsx` | Widget → componente con los mismos estilos |
| 165 | `features/projects/ui/widgets/wizard_nav_buttons.dart` | `src/features/projects/ui/widgets/WizardNavButtons.tsx` | Widget → componente con los mismos estilos |
| 166 | `features/requests/data/datasources/i_request_data_source.dart` | `src/features/requests/data/datasources/iRequestDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 167 | `features/requests/data/datasources/roble_request_data_source.dart` | `src/features/requests/data/datasources/robleRequestDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 168 | `features/requests/data/repositories/request_repository.dart` | `src/features/requests/data/repositories/requestRepository.ts` | Interfaz/implementación 1:1 |
| 169 | `features/requests/domain/models/participation_request.dart` | `src/features/requests/domain/models/participationRequest.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 170 | `features/requests/domain/repositories/i_request_repository.dart` | `src/features/requests/domain/repositories/iRequestRepository.ts` | Interfaz/implementación 1:1 |
| 171 | `features/requests/domain/request_failure.dart` | `src/features/requests/domain/requestFailure.ts` | Port 1:1 |
| 172 | `features/requests/ui/viewmodels/requests_controller.dart` | `src/features/requests/ui/viewmodels/requestsController.ts` | GetxController/.obs → Controller/Rx (useController) |
| 173 | `features/requests/ui/views/choose_participation_page.dart` | `src/features/requests/ui/views/ChooseParticipationPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 174 | `features/requests/ui/views/join_team_page.dart` | `src/features/requests/ui/views/JoinTeamPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 175 | `features/requests/ui/views/request_sent_page.dart` | `src/features/requests/ui/views/RequestSentPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 176 | `features/requests/ui/views/requests_page.dart` | `src/features/requests/ui/views/RequestsPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 177 | `features/requests/ui/widgets/participation_option_tile.dart` | `src/features/requests/ui/widgets/ParticipationOptionTile.tsx` | Widget → componente con los mismos estilos |
| 178 | `features/tasks/data/datasources/i_task_data_source.dart` | `src/features/tasks/data/datasources/iTaskDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 179 | `features/tasks/data/datasources/roble_task_data_source.dart` | `src/features/tasks/data/datasources/robleTaskDataSource.ts` | Mismas tablas, filtros y llamadas a Roble |
| 180 | `features/tasks/data/repositories/task_repository.dart` | `src/features/tasks/data/repositories/taskRepository.ts` | Interfaz/implementación 1:1 |
| 181 | `features/tasks/domain/models/project_task.dart` | `src/features/tasks/domain/models/projectTask.ts` | Clase inmutable 1:1 (copyWith, fromRow/toRow) |
| 182 | `features/tasks/domain/repositories/i_task_repository.dart` | `src/features/tasks/domain/repositories/iTaskRepository.ts` | Interfaz/implementación 1:1 |
| 183 | `features/tasks/domain/task_failure.dart` | `src/features/tasks/domain/taskFailure.ts` | Port 1:1 |
| 184 | `features/tasks/ui/views/available_tasks_page.dart` | `src/features/tasks/ui/views/AvailableTasksPage.tsx` | Widget → componente; Obx → useController; Get.to/back → Nav |
| 185 | `main.dart` | `App.tsx + index.tsx` | MaterialApp/GetMaterialApp → NavigationContainer + PaperProvider + OverlayHost; mismo tema y locale es |
| 186 | `routes/app_pages.dart` | `src/navigation/RootNavigator.tsx` | GetPage + AuthGuard → native-stack + authGuard |
| 187 | `routes/app_routes.dart` | `src/core/navigation/routes.ts` | GetPage + AuthGuard → native-stack + authGuard |
