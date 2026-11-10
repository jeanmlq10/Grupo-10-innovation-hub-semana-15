// Logo de Proyéctate. Usa las imágenes recortadas del logo oficial (no se
// redibuja): `full` es el símbolo con la palabra "proyéctate" y `symbol` es
// solo el brote. Reemplaza a las antiguas ilustraciones de la nubecita.
import React from "react";
import { Image, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

import { Brand } from "../theme/brand";

const FULL = require("../../../assets/images/brand/logo-proyectate.png");
const SYMBOL = require("../../../assets/images/brand/logo-symbol.png");

// Proporciones de los archivos recortados (ancho / alto).
const FULL_RATIO = 1113 / 477;
const SYMBOL_RATIO = 359 / 473;

type Props = {
  variant?: "full" | "symbol";
  /** Ancho para `full`; alto para `symbol`. */
  size: number;
  /** Halo suave con los colores de la marca detrás del logo. */
  halo?: boolean;
  accessibilityLabel?: string;
};

export function BrandLogo({ variant = "full", size, halo = false, accessibilityLabel = "Proyéctate" }: Props) {
  const width = variant === "full" ? size : size * SYMBOL_RATIO;
  const height = variant === "full" ? size / FULL_RATIO : size;
  const image = (
    <Image
      source={variant === "full" ? FULL : SYMBOL}
      style={{ width, height }}
      resizeMode="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
  if (!halo) return image;

  const haloW = width * (variant === "full" ? 1.15 : 1.9);
  const haloH = height * (variant === "full" ? 1.9 : 1.35);
  return (
    <View style={{ width: haloW, height: haloH, alignItems: "center", justifyContent: "center" }}>
      <Svg width={haloW} height={haloH} style={{ position: "absolute" }} pointerEvents="none">
        <Defs>
          <RadialGradient id="halo" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={Brand.cyan} stopOpacity={0.28} />
            <Stop offset="0.45" stopColor={Brand.violet} stopOpacity={0.1} />
            <Stop offset="0.8" stopColor={Brand.lime} stopOpacity={0.06} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={haloW / 2} cy={haloH / 2} rx={haloW / 2} ry={haloH / 2} fill="url(#halo)" />
      </Svg>
      {image}
    </View>
  );
}
