// Caja con el degradado suave de la marca (limón → cian → morado, en tintes
// claros). Para detalles gráficos puntuales; no usar como fondo de pantallas.
import React, { useState } from "react";
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import { Brand } from "../theme/brand";

export function BrandGradientBox({
  style,
  children,
  strength = 0.28,
}: {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Opacidad de los colores de la marca sobre blanco (0–1). */
  strength?: number;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };
  return (
    <View style={[{ overflow: "hidden", backgroundColor: "#FFFFFF" }, style]} onLayout={onLayout}>
      {size.w > 0 ? (
        <Svg width={size.w} height={size.h} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
          <Defs>
            <LinearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Brand.lime} stopOpacity={strength} />
              <Stop offset="0.5" stopColor={Brand.cyan} stopOpacity={strength} />
              <Stop offset="1" stopColor={Brand.violet} stopOpacity={strength} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#brandGradient)" />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}
