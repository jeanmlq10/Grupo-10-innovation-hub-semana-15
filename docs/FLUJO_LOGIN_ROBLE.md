# Inicio de sesión de desarrollo con Roble

1. Ejecutar `npm ci`, copiar `.env.example` a `.env.local` y ejecutar `npm run dev`.
2. Abrir `/login` y usar la misma cuenta registrada en la app móvil. No guardar credenciales en Git ni compartirlas por chat.
3. Tras entrar, `/cuenta` consulta `auth/me` y muestra el `userId` que Roble devuelve. Ese identificador permite comprobar que ambas apps usan la misma identidad. Cerrar sesión desde esa página invalida la sesión web local.

La ruta `/api/auth/session` está habilitada solo con `NODE_ENV=development`. El servidor envía correo y contraseña a Roble por HTTPS y guarda los tokens únicamente en memoria; el navegador recibe una cookie `HttpOnly` y `SameSite=Strict` con un identificador aleatorio. La sesión dura como máximo ocho horas y termina al reiniciar el servidor. No se persistieron tokens ni contraseñas en archivos, logs ni pruebas.

Este flujo solo confirma la identidad. Las cuentas ficticias A/B, sus proyectos, perfiles, mensajes y avisos siguen siendo datos locales del navegador y no representan información de la cuenta Roble. La auditoría de permisos de `docs/ROBLE_ACCESS_AUDIT.md` bloquea su conexión real y la publicación de este acceso hasta corregir la API y probarla con dos cuentas.
