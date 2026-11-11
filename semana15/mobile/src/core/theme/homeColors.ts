// Nombres de color que usan las pantallas (heredados de core/theme/home_colors.dart).
// Los nombres se conservan para no tocar la lógica de ninguna pantalla, pero
// TODOS los valores salen ahora de la identidad de Proyéctate (`brand.ts`).
import { Brand, Palette } from "./brand";

export const HomeColors = {
  // Botones destacados, navegación, títulos e iconos principales.
  primaryPurple: Palette.primary,
  // Círculos/avatares de acento.
  circlePurple: Palette.secondary,
  ideaCardBackground: Palette.violetSoft,
  // Fondo de elementos seleccionados (pastilla de la barra inferior, chips, iconos).
  navSelectedBackground: Palette.violetTint,
  titleAccentBlue: Brand.cyan,

  surfaceGrey: Palette.surfaceMuted,
  placeholderGrey: Palette.borderStrong,
  borderGrey: Palette.border,
  textPrimary: Palette.textPrimary,
  textSecondary: Palette.textSecondary,

  // Flujos (crear proyecto, auth, filtros...).
  flowPurple: Palette.primary,
  flowAccent: Palette.secondary,
  flowNavy: Palette.textPrimary,
  flowSlate: Palette.textSecondary,
  flowHint: Palette.textHint,
  flowBorder: Palette.border,
  flowFieldFill: Palette.field,
  flowFieldBorder: Palette.borderStrong,
  flowFieldHint: Palette.textMuted,
  flowSoftPurple: Palette.violetSoft,
  flowLavender: Palette.violetTint,
  flowLavenderFaint: Palette.violetFaint,
  flowBackCircle: Palette.surfaceMuted,
  flowGreen: Palette.success,
  flowFootnote: Palette.textMuted,
  flowMeta: Palette.textMuted,
  flowDescription: Palette.textSecondary,
  flowTabGrey: Palette.surfaceMuted,
  flowTabText: Palette.textSecondary,
  flowSearchFill: Palette.surfaceMuted,
  flowSearchHint: Palette.textMuted,
  flowEmpty: Palette.textMuted,

  flowIdeaCard: Palette.violetTint,
  flowIdeaDash: Palette.violetSoft,
  flowIdeaPlus: Palette.secondary,
} as const;

/** Colores neutros y semánticos con nombres de Flutter `Colors.*`. */
export const Colors = {
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
  red: Palette.error,
  green: Palette.success,
  orange: Brand.lime,
  amber: Brand.lime,
  grey: Palette.textMuted,
  black54: "rgba(0,0,0,0.54)",
  black87: "rgba(0,0,0,0.87)",
  black26: "rgba(0,0,0,0.26)",
  black12: "rgba(0,0,0,0.12)",
  white70: "rgba(255,255,255,0.70)",
} as const;

/** Equivalente de `color.withValues(alpha: a)` para colores `#RRGGBB`. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
