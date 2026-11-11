// Barra de desempeño del perfil. Con `value = null` no inventa un porcentaje:
// muestra "Sin información suficiente" (Corrección 8.3).
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { LinearProgressIndicator } from "@/src/core/ui/material";

export function PerformanceBar({ label, value, testID }: { label: string; value: number | null; testID?: string }) {
  return (
    <View testID={testID} style={{ paddingVertical: 8, flexDirection: "row", alignItems: "center" }}>
      <Text style={{ width: 120, fontSize: 13.5, color: HomeColors.textPrimary }}>{label}</Text>
      {value == null ? (
        <Text style={{ flex: 1, fontSize: 12.5, fontStyle: "italic", color: HomeColors.textSecondary }}>Sin información suficiente</Text>
      ) : (
        <>
          <View style={{ flex: 1, borderRadius: 6, overflow: "hidden" }}>
            <LinearProgressIndicator value={value} minHeight={8} backgroundColor={HomeColors.navSelectedBackground} color={HomeColors.primaryPurple} />
          </View>
          <Text style={{ width: 48, textAlign: "right", fontSize: 13, color: HomeColors.textSecondary }}>{`${Math.round(value * 100)}%`}</Text>
        </>
      )}
    </View>
  );
}
