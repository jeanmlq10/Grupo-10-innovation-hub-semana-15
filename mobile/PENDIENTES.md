# Pendientes (dependen de configuración externa)

## 1 y 2. Imagen del proyecto y documentos de contexto · HECHO (10 nov 2026)

- Bucket `movil-archivos` (Cloudflare R2), conectado en Roble → Configuración →
  Almacenamiento. Es privado y las credenciales solo las tiene Roble.
- Feature `src/features/attachments`: sube con URL firmada (`storage/objects` →
  `PUT` → `complete`), lista, borra y entrega URLs firmadas temporales.
- Imagen: Información básica → botón de cámara → `proyectos/imagenes` →
  `projects.imageFileId`. Se muestra con `ProjectAvatar`, que pide la URL firmada al mostrarla.
- Documentos: Información básica → "Adjuntar archivo" → `proyectos/documentos`
  + fila en `project_attachments`. Se ven en Resumen, solo para el creador y su equipo.

**Sigue pendiente:** fotos de perfil de usuarios (`usuarios/avatares`). La
carpeta está definida en `StorageFolders`, pero la pantalla de Editar perfil
todavía usa iconos de avatar.

## 3. Adjuntar archivos en el chat (Corrección 9.2)

Todavía no tiene icono de clip. El almacenamiento ya existe: hay que reutilizar
`IAttachmentDataSource.upload` con la carpeta `comentarios/adjuntos` y agregar
una columna `attachmentFileId` a `direct_messages` y `project_comments`.

## 4. Recordatorios en notificaciones

Ya existe el tipo `task_reminder` (categoría Recordatorios) y la demo trae
uno. Pero **la app no los genera sola**: Roble no tiene tareas programadas.
Generarlos requiere un proceso externo, por ejemplo un script diario que lea
las tareas próximas a vencer y cree las notificaciones.

## 5. Inicio de sesión con Microsoft en Expo Go

Sin cambios. Sigue pendiente, como en `MIGRACION.md`.
