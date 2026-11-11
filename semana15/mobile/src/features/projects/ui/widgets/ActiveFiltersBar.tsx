// Equivalente de projects/ui/widgets/active_filters_bar.dart.
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { InkWell, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

export function ActiveFiltersBar({
  labels,
  onOpenFilters,
  onClear,
}: {
  labels: string[];
  onOpenFilters: () => void;
  onClear: () => void;
}) {
  return (
    <View style={{ height: 36 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: "center" }}>
        {labels.map((label) => (
          <View key={label} style={{ marginRight: 8 }}>
            <InkWell
              onPress={onOpenFilters}
              borderRadius={18}
              style={{
                backgroundColor: HomeColors.flowLavender,
                borderRadius: 18,
                height: 36,
                paddingHorizontal: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: HomeColors.flowPurple }}>{label}</Text>
              <MaterialIcon name="keyboard_arrow_down_rounded" size={18} color={HomeColors.flowPurple} />
            </InkWell>
          </View>
        ))}
        <TextButton label="Limpiar" onPress={onClear} foregroundColor={HomeColors.flowSlate} paddingHorizontal={8} />
      </ScrollView>
    </View>
  );
}
