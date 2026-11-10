// Equivalente de requests/ui/widgets/participation_option_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

export function ParticipationOptionTile({
  icon,
  title,
  subtitle,
  onTap,
  selected = false,
  footnote,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  onTap: () => void;
  selected?: boolean;
  footnote?: string | null;
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
        <View style={{ width: 40, height: 40, backgroundColor: HomeColors.navSelectedBackground, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcon name={icon} color={HomeColors.primaryPurple} size={20} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "bold", fontSize: 14.5, color: HomeColors.textPrimary }}>{title}</Text>
          <View style={{ height: 2 }} />
          <Text style={{ fontSize: 12, color: HomeColors.textSecondary }}>{subtitle}</Text>
          {footnote != null ? (
            <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center" }}>
              <MaterialIcon name="calendar_month_outlined" size={14} color={HomeColors.primaryPurple} />
              <View style={{ width: 5 }} />
              <Text style={{ flex: 1, fontSize: 11.5, color: HomeColors.textSecondary }}>{footnote}</Text>
            </View>
          ) : null}
        </View>
        <MaterialIcon
          name={selected ? "check_circle" : "chevron_right"}
          color={selected ? HomeColors.primaryPurple : HomeColors.textSecondary}
          size={selected ? 20 : 22}
        />
      </InkWell>
    </View>
  );
}
