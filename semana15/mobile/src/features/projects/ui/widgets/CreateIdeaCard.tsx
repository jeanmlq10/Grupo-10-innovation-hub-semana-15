// Equivalente de projects/ui/widgets/create_idea_card.dart: "Crea otra idea".
import React from "react";
import { Text, View } from "react-native";

import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { DashedBorder } from "@/src/core/widgets/DashedBorder";
import { requireSession } from "@/src/features/auth/ui/widgets/loginRequiredDialog";

export function CreateIdeaCard() {
  return (
    <DashedBorder color={HomeColors.flowIdeaDash} strokeWidth={1.4} radius={16}>
      <InkWell
        testID="create_idea_card"
        borderRadius={16}
        onPress={() => {
          if (!requireSession()) return;
          void Nav.to("CreateProject");
        }}
        style={{
          backgroundColor: HomeColors.flowIdeaCard,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 18,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: HomeColors.flowIdeaPlus, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcon name="add" color={Colors.white} size={24} />
        </View>
        <View style={{ width: 14 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: HomeColors.flowNavy }}>Crea otra idea</Text>
          <View style={{ height: 4 }} />
          <Text style={{ fontSize: 12.5, color: HomeColors.flowNavy, lineHeight: 12.5 * 1.3 }}>
            Comparte tu idea y encuentra personas que quieren construirla contigo
          </Text>
        </View>
      </InkWell>
    </DashedBorder>
  );
}
