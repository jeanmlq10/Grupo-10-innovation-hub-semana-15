// Equivalente de projects/ui/widgets/confetti_check_illustration.dart:
// el círculo morado con el check y el confeti, con las MISMAS posiciones.
import React from "react";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { Brand } from "@/src/core/theme/brand";

const CONFETTI_COLORS = [Brand.purple, Brand.lime, Brand.cyan, Brand.violet, Brand.lime];

// [x, y, tamaño, color, forma(0 = punto, 1 = guion)]
const CONFETTI: number[][] = [
  [0.08, 0.2, 0.035, 0, 0],
  [0.18, 0.05, 0.03, 1, 1],
  [0.34, 0.02, 0.03, 2, 0],
  [0.62, 0.03, 0.035, 3, 1],
  [0.82, 0.1, 0.03, 4, 0],
  [0.92, 0.3, 0.035, 1, 1],
  [0.9, 0.55, 0.03, 2, 0],
  [0.06, 0.55, 0.03, 3, 1],
  [0.02, 0.38, 0.025, 4, 0],
  [0.5, 0.0, 0.025, 0, 0],
];

export function ConfettiCheckIllustration({ size = 170 }: { size?: number }) {
  const w = size;
  const h = size;
  const cx = w / 2;
  const cy = h / 2;
  const radius = w * 0.32;
  return (
    <Svg width={w} height={h} style={{ overflow: "visible" }}>
      {CONFETTI.map((dot, i) => {
        const color = CONFETTI_COLORS[dot[3]];
        const x = w * dot[0];
        const y = h * dot[1];
        if (dot[4] === 0) return <Circle key={i} cx={x} cy={y} r={w * dot[2]} fill={color} />;
        return (
          <Line
            key={i}
            x1={x}
            y1={y}
            x2={x + w * dot[2]}
            y2={y + w * dot[2]}
            stroke={color}
            strokeWidth={w * 0.02}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={cx} cy={cy} r={radius} fill={HomeColors.primaryPurple} />
      <Path
        d={`M ${cx - radius * 0.45} ${cy} L ${cx - radius * 0.1} ${cy + radius * 0.35} L ${cx + radius * 0.5} ${cy - radius * 0.35}`}
        stroke={Colors.white}
        strokeWidth={w * 0.05}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
