// Equivalente de `PopupMenuButton` de Material 3: un botón con icono que abre
// un menú flotante junto a él.
import React, { useRef } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import type { ViewInstance } from "react-native";

import { Nav } from "../navigation/Nav";
import { M3 } from "../theme/appTheme";
import { boxShadow } from "../theme/shadow";
import { IconButton, InkWell } from "./material";
import { IconName } from "./MaterialIcon";
import { Overlay } from "./overlay";
import { Palette } from "../theme/brand";
import { withAlpha } from "../theme/homeColors";

export type PopupItem<T> = { value: T; label: string; destructive?: boolean };

function Menu<T>({ items, x, y, onPick }: { items: PopupItem<T>[]; x: number; y: number; onPick: (v: T) => void }) {
  const { width } = useWindowDimensions();
  const menuWidth = 220;
  const left = Math.max(8, Math.min(x, width - menuWidth - 8));
  return (
    <View
      style={[
        {
          position: "absolute",
          top: y,
          left,
          minWidth: 112,
          maxWidth: 280,
          backgroundColor: M3.elevation.level2,
          borderRadius: 4,
          paddingVertical: 8,
        },
        boxShadow({ color: withAlpha(Palette.shadow, 0.18), blur: 14, dy: 4 }),
      ]}
    >
      {items.map((item) => (
        <InkWell
          key={String(item.value)}
          onPress={() => onPick(item.value)}
          testID={`popup_item_${String(item.value)}`}
          style={{ height: 48, paddingHorizontal: 12, justifyContent: "center" }}
        >
          <Text style={{ fontSize: 14, color: item.destructive ? Palette.error : M3.onSurface }}>{item.label}</Text>
        </InkWell>
      ))}
    </View>
  );
}

export function PopupMenuButton<T>({
  icon = "more_vert",
  iconSize = 24,
  color,
  tooltip,
  items,
  onSelected,
  testID,
}: {
  testID?: string;
  icon?: IconName;
  iconSize?: number;
  color?: string;
  tooltip?: string;
  items: PopupItem<T>[];
  onSelected: (value: T) => void;
}) {
  const ref = useRef<ViewInstance>(null);
  const open = () => {
    ref.current?.measureInWindow((x, y, w) => {
      void Overlay.dialog<T>(
        () => <Menu items={items} x={x + w - 220} y={y} onPick={(v) => Nav.back(v)} />,
        { raw: true, barrierColor: "transparent" },
      ).then((value) => {
        if (value !== undefined) onSelected(value);
      });
    });
  };
  return (
    <View ref={ref} collapsable={false}>
      <IconButton testID={testID} icon={icon} size={iconSize} color={color} tooltip={tooltip} onPress={open} />
    </View>
  );
}
