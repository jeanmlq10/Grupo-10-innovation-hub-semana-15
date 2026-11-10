// Equivalente de projects/ui/widgets/team_role_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { CounterStepper } from "./CounterStepper";

export function TeamRoleTile({
  icon,
  iconBackground,
  iconColor,
  title,
  subtitle,
  count,
  onIncrement,
  onDecrement,
}: {
  icon: IconName;
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View
      style={{
        marginBottom: 12,
        padding: 14,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ width: 40, height: 40, backgroundColor: iconBackground, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcon name={icon} color={iconColor} size={20} />
      </View>
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold", fontSize: 14.5, color: HomeColors.textPrimary }}>{title}</Text>
        <View style={{ height: 2 }} />
        <Text style={{ fontSize: 12, color: HomeColors.textSecondary }}>{subtitle}</Text>
      </View>
      <View style={{ width: 8 }} />
      <CounterStepper count={count} onIncrement={onIncrement} onDecrement={onDecrement} />
    </View>
  );
}
