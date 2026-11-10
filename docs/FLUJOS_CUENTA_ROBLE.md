# Registro y recuperación de cuenta en desarrollo

Ambos flujos usan el mismo contrato de Roble que la app Flutter. Solo están habilitados con `NODE_ENV=development`; los datos privados reales siguen desconectados hasta corregir los permisos descritos en `PLAN_PERMISOS_ROBLE.md`.

## Registro

1. Abrir `/registro`, ingresar nombre, correo `@uninorte.edu.co`, carrera opcional y una contraseña que cumpla la misma política del móvil.
2. Roble envía un código de seis dígitos. La web guarda **solo el correo** en `sessionStorage` para rellenar `/verificar-correo`; nunca guarda la contraseña ni el código.
3. Verificar el código. Si hace falta, usar «Reenviar código» tras la espera. Después entrar desde `/login` con las credenciales creadas. La misma cuenta puede iniciar sesión en la app móvil.

## Recuperación

1. Desde `/login`, abrir `/recuperar-contrasena` e ingresar el correo. La respuesta no revela si existe una cuenta con ese correo.
2. Abrir el enlace que envíe Roble o copiar el token en `/restablecer-contrasena`. La página acepta `?token=`, `#token=` y entrada manual; quita el token de la barra de direcciones después de leerlo.
3. Establecer una nueva contraseña y volver a iniciar sesión. El cambio de contraseña ocurre en Roble y aplica a móvil y web.

Las rutas del servidor validan dominio, formato y contraseña; envían solicitudes a Roble por HTTPS y no devuelven contraseñas, códigos o tokens en las respuestas. Los errores de Roble se convierten en mensajes generales. No enviar contraseñas, códigos ni tokens por chat ni guardarlos en Git. Los recorridos HTTP se comprobaron con respuestas simuladas; queda pendiente la prueba del correo real con una cuenta controlada.
