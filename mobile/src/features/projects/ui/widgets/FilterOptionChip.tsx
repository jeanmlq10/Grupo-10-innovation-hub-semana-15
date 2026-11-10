// Equivalente de projects/ui/widgets/filter_option_chip.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";

export function FilterOptionChip({ label, selected, onTap }: { label: string; selected: boolean; onTap: () => void }) {
  const bw = selected ? 1.4 : 1;
  return (
    <InkWell
      onPress={onTap}
      borderRadius={20}
      accessibilityLabel={label}
      style={{
        backgroundColor: selected ? HomeColors.flowLavender : Colors.white,
        borderRadius: 20,
        borderWidth: bw,
        borderColor: selected ? HomeColors.flowPurple : HomeColors.flowBorder,
        paddingHorizontal: 14 - bw,
        paddingVertical: 8 - bw,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {!selected ? (
        <>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: HomeColors.flowHint }} />
          <View style={{ width: 6 }} />
        </>
      ) : null}
      <Text
        style={{
          fontSize: 13,
          fontWeight: selected ? "700" : "500",
          color: selected ? HomeColors.flowPurple : HomeColors.flowTabText,
        }}
      >
        {label}
      </Text>
    </InkWell>
  );
}
