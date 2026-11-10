// Equivalente de projects/ui/widgets/step_progress_bar.dart.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { LinearProgressIndicator } from "@/src/core/ui/material";

export function StepProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ flex: 1, borderRadius: 6, overflow: "hidden" }}>
        <LinearProgressIndicator
          value={currentStep / totalSteps}
          minHeight={6}
          backgroundColor={HomeColors.surfaceGrey}
          color={HomeColors.primaryPurple}
        />
      </View>
      <View style={{ width: 10 }} />
      <Text style={{ fontWeight: "600", color: HomeColors.textSecondary, fontSize: 13 }}>{`${currentStep}/${totalSteps}`}</Text>
    </View>
  );
}
