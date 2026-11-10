// Equivalentes de `TabBar` (Material 3, pestañas primarias) y `TabBarView`.
// - Indicador del ancho del texto, 3 px con esquinas superiores redondeadas.
// - Línea divisoria de 1 px (outlineVariant) a todo lo ancho.
// - TabBarView: páginas deslizables; cada página se crea al abrirse y se
//   destruye al salir (como el PageView de Flutter), así que vuelve a cargar.
import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TextStyle, View } from "react-native";
import type { ScrollViewInstance } from "react-native";

import { M3 } from "../theme/appTheme";
import { InkWell } from "./material";

export function TabBar({
  labels,
  index,
  onChange,
  labelColor = M3.primary,
  unselectedLabelColor = M3.onSurfaceVariant,
  indicatorColor = M3.primary,
  labelPaddingHorizontal = 16,
  labelStyle,
  unselectedLabelStyle,
}: {
  labels: string[];
  index: number;
  onChange: (i: number) => void;
  labelColor?: string;
  unselectedLabelColor?: string;
  indicatorColor?: string;
  labelPaddingHorizontal?: number;
  labelStyle?: TextStyle;
  unselectedLabelStyle?: TextStyle;
}) {
  const [layouts, setLayouts] = useState<{ x: number; w: number }[]>([]);
  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        {labels.map((label, i) => {
          const selected = i === index;
          const style = selected ? labelStyle : (unselectedLabelStyle ?? labelStyle);
          return (
            <InkWell
              key={label}
              testID={`tab_${label}`}
              accessibilityLabel={label}
              onPress={() => onChange(i)}
              style={{ flex: 1, height: 46, alignItems: "center", justifyContent: "center", paddingHorizontal: labelPaddingHorizontal }}
            >
              <View
                onLayout={(e: LayoutChangeEvent) => {
                  const { width } = e.nativeEvent.layout;
                  setLayouts((prev) => {
                    const next = [...prev];
                    next[i] = { x: 0, w: width };
                    return next;
                  });
                }}
              >
                <Text numberOfLines={1} style={[{ fontSize: 14, fontWeight: "500", color: selected ? labelColor : unselectedLabelColor }, style, { color: selected ? labelColor : unselectedLabelColor }]}>
                  {label}
                </Text>
              </View>
              {selected && layouts[i] ? (
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    width: layouts[i].w,
                    height: 3,
                    backgroundColor: indicatorColor,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  }}
                />
              ) : null}
            </InkWell>
          );
        })}
      </View>
      <View style={{ height: 1, backgroundColor: M3.outlineVariant }} />
    </View>
  );
}

export function TabBarView({
  index,
  onChange,
  pages,
}: {
  index: number;
  onChange: (i: number) => void;
  pages: (() => React.ReactNode)[];
}) {
  const scroll = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState<Set<number>>(new Set([index]));
  const [visits, setVisits] = useState<number[]>(() => pages.map(() => 0));
  const lastIndex = useRef(index);

  useEffect(() => {
    if (width > 0) scroll.current?.scrollTo({ x: index * width, animated: true });
    if (lastIndex.current !== index) {
      setVisits((v) => v.map((n, i) => (i === index && !visible.has(i) ? n + 1 : n)));
      lastIndex.current = index;
    }
    setVisible(new Set([index]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, width]);

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) onChange(i);
    else setVisible(new Set([index]));
  };

  return (
    <View style={{ flex: 1 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <ScrollView
          ref={scroll}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: index * width, y: 0 }}
          onScrollBeginDrag={() => setVisible(new Set([index - 1, index, index + 1]))}
          onMomentumScrollEnd={onEnd}
          keyboardShouldPersistTaps="handled"
        >
          {pages.map((render, i) => (
            <View key={`${i}-${visits[i]}`} style={{ width, flex: 1 }}>
              {visible.has(i) ? render() : null}
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
