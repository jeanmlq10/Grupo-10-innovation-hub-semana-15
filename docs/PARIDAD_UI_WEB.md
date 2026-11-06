# Paridad visual y de experiencia: móvil → web

Referencias: `docs/disenos-web.html` entregado por el equipo (prototipo web de diez pantallas) para escritorio; implementación Flutter de `semana_final/f_clean_template-main/` y capturas en `semana 6-Home/` del repositorio hermano `Grupo-10-innovation-hub` para móvil. Los datos y las acciones del HTML son ilustrativos, no contratos funcionales.

## Regla de diseño

La web adapta la misma interfaz a más espacio horizontal. Debe conservar jerarquía visual, textos, colores, iconos, componentes, estados y orden de navegación. Los cambios de distribución necesarios para escritorio se documentan por pantalla y se comparan con los prototipos.

El HTML entregado ya define la adaptación de escritorio: fondo lavanda muy claro, barra lateral blanca de 248 px, zona de contenido, tarjetas de proyecto en cuadrícula y panel de filtros a la derecha. La versión móvil conserva la barra de navegación inferior de Flutter. La web inicial, con una cabecera y hero morados, debe reemplazarse por esta estructura.

## Tokens extraídos de Flutter

| Uso | Valor móvil | Fuente |
|---|---|---|
| Morado principal | `#4B309E` | `HomeColors.flowPurple` |
| Azul de acento en títulos | `#3F8AE2` | `HomeColors.titleAccentBlue` |
| Texto principal del flujo | `#16153F` | `HomeColors.flowNavy` |
| Texto secundario del flujo | `#6F7293` | `HomeColors.flowDescription` |
| Lavanda suave | `#ECE8FD` | `HomeColors.flowLavender` |
| Tarjeta «Crea otra idea» | `#DED4FD` | `HomeColors.flowIdeaCard` |
| Borde punteado de esa tarjeta | `#C8B8F4` | `HomeColors.flowIdeaDash` |
| Campo de búsqueda | `#EEEDF2` | `HomeColors.flowSearchFill` |
| Borde de tarjeta de proyecto | `#E3E3E8` | `HomeColors.borderGrey` |

El prototipo web usa `#4A2D9C` como morado principal, `#14123A` como azul muy oscuro, `#F6F5FB` como fondo, `#E4E2EE` como borde y `#DCEFE2` como fondo del icono de proyecto. Estas pequeñas diferencias respecto a Flutter se respetan en escritorio según el diseño entregado.

## Pantallas del prototipo web

Bienvenida, Iniciar sesión, Alta institucional, Explorar, Mis proyectos, Detalle de proyecto, Notificaciones, Perfil, Trayectoria y Crear proyecto. Migrarlas como rutas y componentes reales por etapas; no copiar los botones de demostración que cambian pantallas sin validar datos o sesión.

Estado: Bienvenida (`/`), Iniciar sesión (`/login`), Alta institucional (`/registro`) y Explorar (`/explorar`) están implementadas como interfaz adaptable en Next.js. La navegación entre las rutas públicas funciona. El envío de los formularios se habilitará tras verificar la identidad y los permisos en Roble.

## Pantalla Explorar

1. Encabezado «Explorar proyectos», descripción «Descubre ideas y únete a las que te inspiren», botón de filtros y acceso a sesión.
2. Pestañas «Todos» y «Seguidos», campo «Buscar proyectos....» y filtros activos.
3. Tarjeta lavanda «Crea otra idea», con botón circular morado y borde discontinuo.
4. Tarjetas de proyectos blancas, borde gris, título, descripción y categorías en cápsulas con borde punteado. Mantener el azul bajo el título donde aparece en el prototipo.
5. Navegación «Explorar / Mis proyectos / Notificaciones / Perfil». En móvil, barra inferior; en escritorio, barra lateral o superior con el mismo orden e iconografía.
6. Estados de carga, vacío y error con textos equivalentes a Flutter.

## Validación de cada pantalla

- Comparar captura móvil a ancho de teléfono y captura web a ese mismo ancho. Revisar jerarquía, espaciado, colores, tipografía, bordes e iconos.
- Probar escritorio en un ancho amplio y confirmar que el contenido conserva la identidad visual sin estirarse de forma incómoda.
- Probar teclado, foco visible, etiquetas y contraste. El flujo debe tener el mismo resultado aunque los controles cambien de posición.
- Registrar toda diferencia intencional; no reemplazar componentes del prototipo por estilos genéricos de Next.js.
