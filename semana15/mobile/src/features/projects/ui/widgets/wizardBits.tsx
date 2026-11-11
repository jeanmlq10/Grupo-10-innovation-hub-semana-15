// Piezas repetidas en los pasos del asistente "Crear proyecto" (en Flutter
// estaban escritas igual en cada página): flecha atrás compacta, título,
// campo de texto gris y el botón morado ancho (ElevatedButton).
import React from "react";
import { Platform, StyleProp, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";

import { Nav } from "@/src/core/navigation/Nav";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { FilledButton, InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { StepProgressBar } from "./StepProgressBar";
import { Palette } from "@/src/core/theme/brand";

/** `IconButton(padding: zero, constraints: BoxConstraints())` con la flecha. */
export function CompactBackArrow({ onPress }: { onPress?: () => void }) {
  return (
    <InkWell circle accessibilityLabel="Atrás" onPress={onPress ?? (() => Nav.back())} style={{ width: 24, height: 24 }}>
      <MaterialIcon name="arrow_back" color={HomeColors.textPrimary} />
    </InkWell>
  );
}

/** Fila superior: flecha atrás + barra de progreso "n/4". */
export function WizardHeader({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <CompactBackArrow />
      <View style={{ width: 8 }} />
      <View style={{ flex: 1 }}>
        <StepProgressBar currentStep={step} totalSteps={total} />
      </View>
    </View>
  );
}

export function WizardTitle({ title, subtitle, size = 22 }: { title: string; subtitle: string; size?: number }) {
  return (
    <>
      <Text style={{ fontSize: size, fontWeight: "bold", color: HomeColors.textPrimary }}>{title}</Text>
      <View style={{ height: 4 }} />
      <Text style={{ fontSize: 14.5, color: HomeColors.textSecondary }}>{subtitle}</Text>
    </>
  );
}

/** TextField relleno gris, radio 14, sin borde. */
export function GreyTextField({
  value,
  onChangeText,
  hint,
  maxLines = 1,
  style,
  testID,
  ...rest
}: {
  value: string;
  onChangeText: (v: string) => void;
  hint: string;
  maxLines?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
} & Omit<TextInputProps, "value" | "onChangeText" | "style">) {
  const multiline = maxLines > 1;
  return (
    <View style={[{ backgroundColor: HomeColors.surfaceGrey, borderRadius: 14 }, style]}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={hint}
        placeholderTextColor={HomeColors.textSecondary}
        multiline={multiline}
        numberOfLines={multiline ? maxLines : 1}
        textAlignVertical={multiline ? "top" : "center"}
        style={{
          color: HomeColors.textPrimary,
          fontSize: 16,
          paddingHorizontal: 16,
          paddingVertical: 14,
          minHeight: multiline ? 14 * 2 + 22 * maxLines : undefined,
          ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
        }}
        {...rest}
      />
    </View>
  );
}

/** ElevatedButton morado ancho ("Comenzar", "Siguiente"...). */
export function PurpleWideButton({
  label,
  onPress,
  fontSize = 16,
  testID,
}: {
  label: string;
  onPress: (() => void) | null;
  fontSize?: number;
  testID?: string;
}) {
  return (
    <View style={[{ borderRadius: 14 }, boxShadow({ color: withAlpha(Palette.shadow, 0.22), blur: 6, dy: 2 })]}>
      <FilledButton
        testID={testID}
        label={label}
        onPress={onPress}
        backgroundColor={HomeColors.primaryPurple}
        foregroundColor={Colors.white}
        borderRadius={14}
        style={{ paddingVertical: 16, width: "100%" }}
        textStyle={{ fontSize, fontWeight: "bold" }}
      />
    </View>
  );
}
