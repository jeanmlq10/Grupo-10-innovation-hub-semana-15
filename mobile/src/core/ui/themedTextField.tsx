// TextField SIN decoración propia en Flutter: toma el InputDecorationTheme de
// FlexColorScheme (yellowM3, `inputDecoratorIsFilled: true`,
// `inputDecoratorBorderType: outline`). Se reproduce con la paleta M3.
import React, { forwardRef, useState } from "react";
import { Platform, TextInput, TextInputProps, View } from "react-native";
import type { TextInputInstance } from "react-native";

import { M3 } from "../theme/appTheme";
import { Palette } from "../theme/brand";

export const ThemedTextField = forwardRef<
  TextInputInstance,
  TextInputProps & { hint?: string; radius?: number; dense?: boolean; enabled?: boolean }
>(function ThemedTextField({ hint, style, multiline, radius = 12, dense = false, enabled = true, ...rest }, ref) {
  const [focused, setFocused] = useState(false);
  const pv = dense ? 12 : 16;
  return (
    <View
      style={{
        backgroundColor: enabled ? Palette.field : Palette.surfaceMuted,
        borderRadius: radius,
        borderWidth: focused ? 2 : 1,
        borderColor: !enabled ? Palette.border : focused ? Palette.secondary : Palette.borderStrong,
      }}
    >
      <TextInput
        ref={ref}
        editable={enabled}
        placeholder={hint}
        placeholderTextColor={M3.onSurfaceVariant}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          {
            fontSize: 16,
            color: enabled ? M3.onSurface : M3.onSurfaceDisabled,
            paddingHorizontal: focused ? 11 : 12,
            paddingVertical: focused ? pv - 1 : pv,
            textAlignVertical: multiline ? "top" : "center",
            ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
});
