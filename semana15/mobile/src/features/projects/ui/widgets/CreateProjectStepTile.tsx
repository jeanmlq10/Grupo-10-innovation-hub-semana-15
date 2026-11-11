// Equivalente de projects/ui/widgets/create_project_step_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";

export function CreateProjectStepTile({
  number,
  title,
  subtitle,
  showConnector = true,
}: {
  number: number;
  title: string;
  subtitle: string;
  showConnector?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "stretch" }}>
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: HomeColors.primaryPurple, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: Colors.white, fontWeight: "bold", fontSize: 14 }}>{`${number}`}</Text>
        </View>
        {showConnector ? <View style={{ flex: 1, width: 2, backgroundColor: HomeColors.navSelectedBackground }} /> : null}
      </View>
      <View style={{ width: 14 }} />
      <View style={{ flex: 1, paddingBottom: showConnector ? 22 : 0 }}>
        <Text style={{ fontWeight: "bold", fontSize: 15.5, color: HomeColors.textPrimary }}>{title}</Text>
        <View style={{ height: 3 }} />
        <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>{subtitle}</Text>
      </View>
    </View>
  );
}
