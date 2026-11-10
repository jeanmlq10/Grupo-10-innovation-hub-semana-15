// Equivalente de core/widgets/dashed_border.dart: dibuja un borde
// redondeado punteado o discontinuo alrededor del hijo.
import React, { useState } from "react";
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { Colors } from "../theme/homeColors";

type Props = {
  children: React.ReactNode;
  color?: string;
  strokeWidth?: number;
  gap?: number;
  radius?: number;
  dotted?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function DashedBorder({
  children,
  color = Colors.black,
  strokeWidth = 1.5,
  gap = 4,
  radius = 16,
  dotted = false,
  style,
}: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };
  // Flutter: trazo de `gap` (o 0.01 si es punteado) cada `gap*2` (o `gap`).
  const dash = dotted ? 0.01 : gap;
  const space = dotted ? gap - 0.01 : gap;
  const half = strokeWidth / 2;
  return (
    <View style={style} onLayout={onLayout}>
      {children}
      {size ? (
        <Svg
          pointerEvents="none"
          width={size.w + strokeWidth}
          height={size.h + strokeWidth}
          style={{ position: "absolute", left: -half, top: -half }}
        >
          <Rect
            x={half}
            y={half}
            width={size.w}
            height={size.h}
            rx={Math.min(radius, size.w / 2, size.h / 2)}
            ry={Math.min(radius, size.w / 2, size.h / 2)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${space}`}
            strokeLinecap={dotted ? "round" : "butt"}
          />
        </Svg>
      ) : null}
    </View>
  );
}
