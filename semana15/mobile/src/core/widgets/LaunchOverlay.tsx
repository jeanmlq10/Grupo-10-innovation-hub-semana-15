// Entrada de la app: continúa la pantalla inicial nativa (mismo fondo, mismo
// logo en el mismo tamaño y posición) y se desvanece con una animación suave
// cuando la app ya cargó. También se ve en Expo Go, donde la pantalla inicial
// nativa no se puede personalizar.
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet } from "react-native";

import { Palette } from "../theme/brand";
import { BrandLogo } from "./BrandLogo";

/** Ancho del logo en la pantalla inicial nativa (ver `imageWidth` en app.config.ts). */
export const SPLASH_IMAGE_WIDTH = 240;
// splash-logo.png tiene 20 px de margen a cada lado sobre 1113 px de logo.
const LOGO_WIDTH = (SPLASH_IMAGE_WIDTH * 1113) / 1153;

export function LaunchOverlay({ ready }: { ready: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const native = Platform.OS !== "web";
    const animation = Animated.sequence([
      Animated.delay(450),
      Animated.timing(progress, {
        toValue: 1,
        duration: 520,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        useNativeDriver: native,
      }),
    ]);
    animation.start(({ finished }) => finished && setDone(true));
    return () => animation.stop();
  }, [ready, progress]);

  if (done) return null;

  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root, { opacity }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <BrandLogo variant="full" size={LOGO_WIDTH} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: Palette.splash, alignItems: "center", justifyContent: "center" },
});
