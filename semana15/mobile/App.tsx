// Equivalente de lib/main.dart (MyApp / GetMaterialApp): proveedores, tema,
// navegación y la capa de diálogos/snackbars. Ruta inicial: la Central.
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DIProvider } from "./src/core/di/DIProvider";
import { navigationRef, Nav } from "./src/core/navigation/Nav";
import { lightTheme } from "./src/core/theme/appTheme";
import { Palette } from "./src/core/theme/brand";
import { ICON_FONTS } from "./src/core/ui/MaterialIcon";
import { OverlayHost } from "./src/core/ui/overlay";
import { LaunchOverlay } from "./src/core/widgets/LaunchOverlay";
import { authGuard } from "./src/navigation/authGuard";
import RootNavigator from "./src/navigation/RootNavigator";

// Expo Go no deja personalizar la pantalla inicial nativa; las opciones solo aplican en builds
// de desarrollo o producción. En Expo Go, LaunchOverlay muestra igual el logo y su transición.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

SplashScreen.preventAutoHideAsync();
if (!isExpoGo) {
  SplashScreen.setOptions({ duration: 300, fade: true });
}

Nav.setGuard(authGuard);

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Las mismas fuentes de iconos que usa Flutter (Material Icons regular,
        // outlined y round) + la de Paper.
        await Font.loadAsync({
          ...MaterialCommunityIcons.font,
          [ICON_FONTS.regular]: require("./assets/fonts/MaterialIcons-Regular.ttf"),
          [ICON_FONTS.outlined]: require("./assets/fonts/MaterialIconsOutlined-Regular.otf"),
          [ICON_FONTS.round]: require("./assets/fonts/MaterialIconsRound-Regular.otf"),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    void prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) SplashScreen.hide();
  }, [appIsReady]);

  if (!appIsReady) return null;

  // La app Flutter declara tema oscuro pero todas sus pantallas fijan fondo
  // blanco y colores propios: se usa siempre el tema claro.
  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Palette.background,
      card: Palette.surface,
      text: lightTheme.colors.onSurface,
      border: lightTheme.colors.outlineVariant,
      primary: lightTheme.colors.primary,
      notification: lightTheme.colors.error,
    },
  };

  return (
    <SafeAreaProvider>
      <DIProvider>
        <PaperProvider theme={lightTheme}>
          <View style={{ flex: 1 }}>
            <NavigationContainer ref={navigationRef} theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
            <OverlayHost />
            <LaunchOverlay ready={appIsReady} />
          </View>
          <StatusBar style="dark" />
        </PaperProvider>
      </DIProvider>
    </SafeAreaProvider>
  );
}
