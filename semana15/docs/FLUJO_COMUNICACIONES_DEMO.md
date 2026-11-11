# Probar mensajes y avisos locales

Ejecuta `npm run dev` y abre la web. Todo ocurre en este navegador; las cuentas A/B no son sesiones de Roble.

1. En la barra de demostración, elige **Cuenta de prueba A**. Abre `/proyectos/green-lab`, entra al perfil de la persona creadora y pulsa **Enviar mensaje**. Escribe algo y vuelve a **Mensajes**.
2. Cambia a **Cuenta de prueba B**. La barra muestra un mensaje sin leer. Abre **Mensajes**, entra a la conversación y comprueba que el contador se limpia. En **Notificaciones** aparece el aviso de nuevo mensaje, que queda leído al entrar al chat.
3. Desde B, abre `/proyectos/eco-campus`, solicita participar y comenta. Cambia a A: en **Notificaciones** verás la solicitud y el comentario. Pulsa la solicitud para ir al proyecto, acéptala y cambia de nuevo a B para ver la decisión.
4. En A, entra a `/perfil/ajustes/notificaciones` y desactiva **Comentarios**. El aviso correspondiente desaparece de la bandeja y del contador de A; al reactivar la categoría vuelve a mostrarse con su estado de leído conservado.
5. En B, entra a `/perfil/privacidad`, cambia **Quién puede contactarte** a **Nadie** y guarda. En A, el perfil de B ya no ofrece **Enviar mensaje**; la conversación anterior sigue visible, pero no permite enviar nuevos mensajes.

**Reiniciar datos** borra proyectos, perfiles, mensajes y estados de leído de esta demostración. Las cuentas reales, la entrega de avisos y el control de acceso en la API quedan pendientes de Roble.
