// Equivalente de notifications/ui/widgets/info_nav_tile.dart.
import React from "react";
import { Text } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

export function InfoNavTile({ label, onTap }: { label: string; onTap: () => void }) {
  return (
    <InkWell
      onPress={onTap}
      borderRadius={10}
      accessibilityLabel={label}
      style={{
        backgroundColor: Colors.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        paddingHorizontal: 13,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Text style={{ flex: 1, fontSize: 14, color: HomeColors.textPrimary }}>{label}</Text>
      <MaterialIcon name="chevron_right" color={HomeColors.textSecondary} />
    </InkWell>
  );
}
