// Equivalente de notifications/ui/widgets/person_header.dart.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

export function PersonHeader({
  name,
  lines,
  time,
  icon = "person_outline",
}: {
  name: string;
  lines: string[];
  time?: string | null;
  icon?: IconName;
}) {
  return (
    <View style={{ alignItems: "center" }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: HomeColors.navSelectedBackground,
          borderWidth: 1,
          borderColor: HomeColors.borderGrey,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcon name={icon} size={38} color={HomeColors.primaryPurple} />
      </View>
      <View style={{ height: 12 }} />
      <Text style={{ textAlign: "center", fontSize: 17, fontWeight: "bold", color: HomeColors.textPrimary }}>{name}</Text>
      {lines.map((line, i) => (
        <Text key={`${i}-${line}`} style={{ paddingTop: 2, textAlign: "center", fontSize: 14, color: HomeColors.textPrimary }}>
          {line}
        </Text>
      ))}
      {time != null ? <Text style={{ marginTop: 6, fontSize: 12, color: HomeColors.textSecondary }}>{time}</Text> : null}
    </View>
  );
}
