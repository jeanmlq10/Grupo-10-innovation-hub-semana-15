// Equivalente de projects/ui/widgets/my_projects_tabs.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";

function TabChip({ label, selected, onTap }: { label: string; selected: boolean; onTap: () => void }) {
  return (
    <InkWell
      onPress={onTap}
      borderRadius={14}
      accessibilityLabel={label}
      style={{
        backgroundColor: selected ? HomeColors.primaryPurple : HomeColors.surfaceGrey,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ color: selected ? Colors.white : HomeColors.textSecondary, fontWeight: "600", fontSize: 13.5 }}>{label}</Text>
    </InkWell>
  );
}

export function MyProjectsTabs({
  publishedCount,
  draftsCount,
  showingDrafts,
  onSelectPublished,
  onSelectDrafts,
}: {
  publishedCount: number;
  draftsCount: number;
  showingDrafts: boolean;
  onSelectPublished: () => void;
  onSelectDrafts: () => void;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ flex: 1 }}>
        <TabChip label={`Mis proyectos (${publishedCount})`} selected={!showingDrafts} onTap={onSelectPublished} />
      </View>
      <View style={{ width: 10 }} />
      <View style={{ flex: 1 }}>
        <TabChip label={`Mis borradores (${draftsCount})`} selected={showingDrafts} onTap={onSelectDrafts} />
      </View>
    </View>
  );
}
