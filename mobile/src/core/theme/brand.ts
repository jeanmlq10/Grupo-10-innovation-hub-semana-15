// Identidad visual de Proyéctate: la ÚNICA fuente de colores de la app.
//
// Los cuatro colores oficiales del logo están en `Brand`. `Palette` agrupa los
// colores por uso (texto, fondos, bordes, estados...) y todo lo demás
// (`HomeColors`, el tema Material 3, las pantallas) los toma de aquí. Para
// cambiar la identidad basta con editar este archivo.
//
// Regla de uso: el morado es el protagonista; el verde limón y el cian son
// acentos. Los fondos son blancos o tintes muy claros de la paleta.

/** Los cuatro colores oficiales del logo. */
export const Brand = {
  /** Morado principal: encabezados, textos importantes, navegación, botones destacados. */
  purple: "#2A0057",
  /** Morado secundario: botones secundarios, elementos interactivos, estados activos. */
  violet: "#8A3FFC",
  /** Verde limón: acentos, indicadores, notificaciones, destacados. */
  lime: "#D9FF4D",
  /** Cian de apoyo: fondos de apoyo, ilustraciones, elementos complementarios. */
  cyan: "#7ED6FF",
} as const;

/** Colores por uso, derivados de `Brand` (tintes claros y neutros con tono morado). */
export const Palette = {
  // ── Marca ───────────────────────────────────────────────
  primary: Brand.purple,
  onPrimary: "#FFFFFF",
  secondary: Brand.violet,
  onSecondary: "#FFFFFF",
  accent: Brand.lime,
  onAccent: Brand.purple,
  support: Brand.cyan,
  onSupport: Brand.purple,

  // Tintes muy claros para fondos de apoyo, chips y estados seleccionados.
  violetTint: "#F0E7FF",
  violetFaint: "#F8F4FF",
  violetSoft: "#CDB2FE",
  limeTint: "#F3FFC4",
  cyanTint: "#E3F6FF",

  // ── Texto ───────────────────────────────────────────────
  textPrimary: Brand.purple,
  textSecondary: "#625B78",
  textMuted: "#8C86A0",
  textHint: "#A7A1B8",
  textOnDark: "#FFFFFF",

  // ── Fondos y superficies ────────────────────────────────
  background: "#FFFFFF",
  /** Crema muy claro de la pantalla inicial. */
  splash: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#F5F2FA",
  field: "#F4F1F9",

  // ── Bordes y divisores ──────────────────────────────────
  border: "#E7E2F0",
  borderStrong: "#D6CFE3",
  track: "#ECE6F5",

  // ── Sombras ─────────────────────────────────────────────
  shadow: Brand.purple,

  // ── Estados ─────────────────────────────────────────────
  /** Éxito / disponible: fondo limón con texto morado (legible y de la marca). */
  successBackground: Brand.lime,
  successForeground: Brand.purple,
  /** Icono de "listo" (check) sobre blanco. */
  success: Brand.violet,
  /** En progreso / borrador: cian de apoyo. */
  progressBackground: "#D6F1FF",
  progressForeground: Brand.purple,
  /** Error y acciones destructivas: un único rojo para toda la app. */
  error: "#D23A55",
  errorStrong: "#B3203E",
  errorTint: "#FDE7EC",
} as const;

/** Degradado del logo (para detalles gráficos; usar con moderación). */
export const BrandGradient = [Brand.lime, Brand.cyan, Brand.violet] as const;
