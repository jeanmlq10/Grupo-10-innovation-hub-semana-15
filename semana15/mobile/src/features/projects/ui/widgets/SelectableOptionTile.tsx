// Equivalente de projects/ui/widgets/selectable_option_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

export function SelectableOptionTile({
  icon,
  title,
  subtitle,
  selected,
  onTap,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  selected: boolean;
  onTap: () => void;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <InkWell
        onPress={onTap}
        borderRadius={14}
        accessibilityLabel={title}
        style={{
          padding: 14,
          backgroundColor: selected ? HomeColors.navSelectedBackground : Colors.white,
          borderWidth: selected ? 1.6 : 1,
          borderColor: selected ? HomeColors.primaryPurple : HomeColors.borderGrey,
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <MaterialIcon name={icon} color={HomeColors.primaryPurple} size={22} />
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "bold", fontSize: 14.5, color: HomeColors.textPrimary }}>{title}</Text>
          <View style={{ height: 2 }} />
          <Text style={{ fontSize: 12, color: HomeColors.textSecondary }}>{subtitle}</Text>
        </View>
        {selected ? (
          <MaterialIcon name="check_circle" color={HomeColors.primaryPurple} size={20} />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.4, borderColor: HomeColors.borderGrey }} />
        )}
      </InkWell>
    </View>
  );
}
