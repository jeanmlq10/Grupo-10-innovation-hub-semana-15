// Equivalente de `DropdownButton` de Material: al tocarlo abre un menú con
// las opciones encima del propio botón.
import React, { useRef } from "react";
import { ScrollView, StyleProp, Text, TextStyle, useWindowDimensions, View, ViewStyle } from "react-native";
import type { ViewInstance } from "react-native";

import { Nav } from "../navigation/Nav";
import { M3 } from "../theme/appTheme";
import { boxShadow } from "../theme/shadow";
import { InkWell } from "./material";
import { MaterialIcon } from "./MaterialIcon";
import { Overlay } from "./overlay";
import { Palette } from "../theme/brand";
import { withAlpha } from "../theme/homeColors";

export type DropdownItem = { value: string; label: string };

export function DropdownButton({
  value,
  items,
  hint,
  hintStyle,
  onChanged,
  style,
  testID,
}: {
  value: string | null;
  items: DropdownItem[];
  hint?: string;
  hintStyle?: StyleProp<TextStyle>;
  onChanged: (v: string) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const ref = useRef<ViewInstance>(null);
  const { height: screenH } = useWindowDimensions();
  const selected = items.find((i) => i.value === value);

  const open = () => {
    ref.current?.measureInWindow((x, y, w) => {
      const menuH = Math.min(items.length * 48 + 16, screenH * 0.6);
      const top = Math.max(24, Math.min(y - 8, screenH - menuH - 24));
      void Overlay.dialog<string>(
        () => (
          <View
            style={[
              { position: "absolute", left: x - 16, top, width: w + 32, maxHeight: menuH, backgroundColor: M3.elevation.level2, borderRadius: 4 },
              boxShadow({ color: withAlpha(Palette.shadow, 0.18), blur: 14, dy: 4 }),
            ]}
          >
            <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
              {items.map((item) => (
                <InkWell
                  key={item.value}
                  onPress={() => Nav.back(item.value)}
                  style={{
                    height: 48,
                    paddingHorizontal: 16,
                    justifyContent: "center",
                    backgroundColor: item.value === value ? Palette.violetTint : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 16, color: M3.onSurface }}>{item.label}</Text>
                </InkWell>
              ))}
            </ScrollView>
          </View>
        ),
        { raw: true, barrierColor: "transparent" },
      ).then((picked) => {
        if (picked !== undefined) onChanged(picked);
      });
    });
  };

  return (
    <View ref={ref} collapsable={false} style={style}>
      <InkWell testID={testID} onPress={open} style={{ height: 48, flexDirection: "row", alignItems: "center" }}>
        <Text style={[{ flex: 1, fontSize: 16, color: M3.onSurface }, selected ? null : hintStyle]} numberOfLines={1}>
          {selected ? selected.label : (hint ?? "")}
        </Text>
        <MaterialIcon name="arrow_drop_down" color={M3.onSurfaceVariant} />
      </InkWell>
    </View>
  );
}
