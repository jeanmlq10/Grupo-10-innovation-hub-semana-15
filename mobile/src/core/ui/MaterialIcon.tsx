// Equivalente del widget `Icon(Icons.x)` de Flutter. Usa las fuentes oficiales
// de Material Icons (regular, outlined y round) cargadas en App.tsx, así que el
// glifo es el mismo que dibuja Flutter.
import React from "react";
import { StyleProp, Text, TextStyle } from "react-native";

import { IconName, MATERIAL_ICON_GLYPHS } from "./materialIconGlyphs";

export const ICON_FONTS = {
  regular: "MaterialIcons",
  outlined: "MaterialIconsOutlined",
  round: "MaterialIconsRound",
} as const;

export type { IconName };

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export function MaterialIcon({ name, size = 24, color = "#000", style, accessibilityLabel }: Props) {
  const [family, codepoint] = MATERIAL_ICON_GLYPHS[name];
  return (
    <Text
      accessibilityLabel={accessibilityLabel}
      allowFontScaling={false}
      selectable={false}
      style={[
        {
          fontFamily: ICON_FONTS[family],
          fontSize: size,
          lineHeight: size,
          width: size,
          height: size,
          textAlign: "center",
          color,
          includeFontPadding: false,
          fontWeight: "normal",
          fontStyle: "normal",
        },
        style,
      ]}
    >
      {String.fromCodePoint(codepoint)}
    </Text>
  );
}
