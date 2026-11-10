// Equivalente de projects/ui/widgets/explore_filter_tabs.dart: "Todos" / "Seguidos".
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";

function FilterChip({ label, selected, onTap }: { label: string; selected: boolean; onTap: () => void }) {
  return (
    <InkWell
      onPress={onTap}
      borderRadius={8}
      accessibilityLabel={label}
      style={{
        backgroundColor: selected ? HomeColors.flowPurple : HomeColors.flowTabGrey,
        borderRadius: 8,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: selected ? Colors.white : HomeColors.flowTabText, fontWeight: "600", fontSize: 14 }}>{label}</Text>
    </InkWell>
  );
}

export function ExploreFilterTabs({
  showingFollowed,
  onSelectAll,
  onSelectFollowed,
}: {
  showingFollowed: boolean;
  onSelectAll: () => void;
  onSelectFollowed: () => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ flex: 1 }}>
        <FilterChip label="Todos" selected={!showingFollowed} onTap={onSelectAll} />
      </View>
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <FilterChip label="Seguidos" selected={showingFollowed} onTap={onSelectFollowed} />
      </View>
    </View>
  );
}
