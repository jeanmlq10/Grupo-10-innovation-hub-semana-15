// Tema Material 3 de la app (react-native-paper), construido con la identidad
// de Proyéctate (`brand.ts`). Lo usan los componentes que no fijan color
// propio: diálogos, botones de texto, indicadores de carga, interruptores,
// selector de fecha, pestañas...
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

import { Brand, Palette } from "./brand";

const lightColors = {
  primary: Palette.primary,
  onPrimary: Palette.onPrimary,
  primaryContainer: Palette.violetTint,
  onPrimaryContainer: Palette.primary,
  secondary: Palette.secondary,
  onSecondary: Palette.onSecondary,
  secondaryContainer: Palette.violetTint,
  onSecondaryContainer: Palette.primary,
  tertiary: Brand.cyan,
  onTertiary: Palette.primary,
  tertiaryContainer: Palette.cyanTint,
  onTertiaryContainer: Palette.primary,
  error: Palette.errorStrong,
  onError: "#FFFFFF",
  errorContainer: Palette.errorTint,
  onErrorContainer: Palette.errorStrong,
  background: Palette.background,
  onBackground: Palette.textPrimary,
  surface: Palette.surface,
  onSurface: Palette.textPrimary,
  surfaceVariant: Palette.surfaceMuted,
  onSurfaceVariant: Palette.textSecondary,
  outline: Palette.textHint,
  outlineVariant: Palette.border,
  shadow: Palette.shadow,
  scrim: "#000000",
  inverseSurface: Palette.primary,
  inverseOnSurface: "#FFFFFF",
  inversePrimary: Palette.violetSoft,
  elevation: {
    level0: "transparent",
    level1: Palette.violetFaint,
    level2: Palette.violetFaint,
    level3: "#FFFFFF",
    level4: "#FFFFFF",
    level5: "#FFFFFF",
  },
  surfaceDisabled: "rgba(42,0,87,0.12)",
  onSurfaceDisabled: "rgba(42,0,87,0.38)",
  backdrop: "rgba(42,0,87,0.4)",
};

// La app pinta todas sus pantallas en claro (como la versión Flutter); el tema
// oscuro solo se conserva para que los componentes por defecto sigan la marca.
const darkColors = {
  ...lightColors,
  primary: Palette.violetSoft,
  onPrimary: Palette.primary,
  primaryContainer: Palette.secondary,
  onPrimaryContainer: "#FFFFFF",
  background: "#140029",
  onBackground: "#FFFFFF",
  surface: "#140029",
  onSurface: "#FFFFFF",
  surfaceVariant: "#2A0057",
  onSurfaceVariant: Palette.violetTint,
  outlineVariant: "#3B1670",
  inverseSurface: "#FFFFFF",
  inverseOnSurface: Palette.primary,
  elevation: {
    level0: "transparent",
    level1: "#1E003D",
    level2: "#230047",
    level3: "#2A0057",
    level4: "#2A0057",
    level5: "#32066A",
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 4,
  colors: { ...MD3LightTheme.colors, ...lightColors },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 4,
  colors: { ...MD3DarkTheme.colors, ...darkColors },
};

/** Colores M3 del esquema claro, para los widgets que no fijan color propio. */
export const M3 = lightTheme.colors;
