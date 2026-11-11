// Configuración de Expo. Equivale a pubspec.yaml + AndroidManifest/Info.plist
// + flutter_launcher_icons.yaml del proyecto Flutter.
//
// Variables de Roble: se leen con los MISMOS nombres que en Flutter
// (ROBLE_BASE_URL, ROBLE_CONTRACT_ID, ROBLE_SSO_REDIRECT,
// ROBLE_NATIVE_CALLBACK_SCHEME, INSTITUTIONAL_EMAIL_DOMAIN):
//   1) del archivo .env (Expo CLI lo carga solo) o del entorno, y si no
//   2) de dart_defines.json (el mismo archivo que usaba `--dart-define-from-file`).
import type { ConfigContext, ExpoConfig } from "expo/config";
import fs from "fs";
import path from "path";

const KEYS = [
  "ROBLE_BASE_URL",
  "ROBLE_CONTRACT_ID",
  "ROBLE_SSO_REDIRECT",
  "ROBLE_NATIVE_CALLBACK_SCHEME",
  "INSTITUTIONAL_EMAIL_DOMAIN",
] as const;

function readDartDefines(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "dart_defines.json"), "utf8"));
  } catch {
    return {};
  }
}

const defines = readDartDefines();
const env: Record<string, string> = {};
for (const key of KEYS) {
  const value = process.env[key] ?? defines[key];
  if (value !== undefined) env[key] = value;
}

const callbackScheme = (env.ROBLE_NATIVE_CALLBACK_SCHEME ?? "").trim();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // Nombre visible bajo el ícono.
  name: "Proyéctate",
  slug: "f-clean-template",
  version: "1.0.0",
  orientation: "portrait",
  // Ícono: el símbolo del logo de Proyéctate sobre fondo blanco (1024×1024, sin transparencia).
  icon: "./assets/images/icon.png",
  // Esquema propio de la app (deep links). Si se configura
  // ROBLE_NATIVE_CALLBACK_SCHEME para el login con Microsoft, se usa ese.
  scheme: callbackScheme !== "" ? callbackScheme : "fcleantemplate",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.example.fCleanTemplate",
  },
  android: {
    package: "com.example.f_clean_template",
    // Ícono adaptativo: el símbolo dentro de la zona segura para que ninguna
    // forma de ícono (círculo, gota, cuadrado) lo corte.
    adaptiveIcon: {
      backgroundColor: "#FFFFFF",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "single",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    [
      "expo-splash-screen",
      {
        // Pantalla inicial: el logo completo de Proyéctate centrado sobre blanco.
        // imageWidth debe coincidir con SPLASH_IMAGE_WIDTH (src/core/widgets/LaunchOverlay.tsx).
        image: "./assets/images/splash-logo.png",
        imageWidth: 240,
        resizeMode: "contain",
        backgroundColor: "#FFFFFF",
      },
    ],
    "expo-web-browser",
    "expo-font",
    "expo-secure-store",
    "expo-status-bar",
    "@react-native-community/datetimepicker",
  ],
  extra: {
    env,
  },
});
