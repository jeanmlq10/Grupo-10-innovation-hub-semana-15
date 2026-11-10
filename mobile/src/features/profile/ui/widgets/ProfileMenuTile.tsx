// Equivalente de profile/ui/widgets/profile_menu_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { Palette } from "@/src/core/theme/brand";

export function ProfileMenuTile({
  icon,
  title,
  onTap,
  subtitle,
  destructive = false,
  testID,
}: {
  icon: IconName;
  title: string;
  onTap: () => void;
  subtitle?: string | null;
  destructive?: boolean;
  testID?: string;
}) {
  const color = destructive ? Palette.error : HomeColors.primaryPurple;
  return (
    <InkWell onPress={onTap} testID={testID} accessibilityLabel={title} style={{ paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
      <MaterialIcon name={icon} color={color} size={23} />
      <View style={{ width: 14 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14.5, color: HomeColors.textPrimary }}>{title}</Text>
        {subtitle != null ? <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{subtitle}</Text> : null}
      </View>
      <MaterialIcon name="chevron_right" color={HomeColors.textSecondary} />
    </InkWell>
  );
}
