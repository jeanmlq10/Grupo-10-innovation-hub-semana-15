// Equivalente de projects/ui/widgets/my_project_placeholder_card.dart.
import React from "react";
import { View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

function Bar({ widthFactor }: { widthFactor: number }) {
  return <View style={{ width: `${widthFactor * 100}%`, height: 10, backgroundColor: HomeColors.placeholderGrey, borderRadius: 6 }} />;
}

export function MyProjectPlaceholderCard() {
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <View style={{ width: 64, height: 64, backgroundColor: HomeColors.surfaceGrey, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcon name="image_outlined" color={HomeColors.placeholderGrey} size={30} />
      </View>
      <View style={{ width: 14 }} />
      <View style={{ flex: 1 }}>
        <Bar widthFactor={1} />
        <View style={{ height: 8 }} />
        <Bar widthFactor={1} />
        <View style={{ height: 8 }} />
        <Bar widthFactor={0.5} />
      </View>
    </View>
  );
}
