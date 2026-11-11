// Equivalente de projects/ui/widgets/wizard_nav_buttons.dart.
import React from "react";
import { View } from "react-native";

import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { FilledButton, OutlinedButton } from "@/src/core/ui/material";
import { Palette } from "@/src/core/theme/brand";

export function WizardNavButtons({
  onBack,
  onNext,
  nextLabel = "Siguiente",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <View style={{ flexDirection: "row" }}>
      <View style={{ flex: 1 }}>
        <OutlinedButton
          label="Anterior"
          onPress={onBack}
          foregroundColor={HomeColors.textPrimary}
          borderColor={HomeColors.borderGrey}
          borderRadius={14}
          style={{ paddingVertical: 16 }}
          textStyle={{ fontSize: 15, fontWeight: "600" }}
        />
      </View>
      <View style={{ width: 12 }} />
      <View style={[{ flex: 1, borderRadius: 14 }, boxShadow({ color: withAlpha(Palette.shadow, 0.22), blur: 6, dy: 2 })]}>
        {/* ElevatedButton (elevación 1 de Material 3) */}
        <FilledButton
          testID="wizard_next"
          label={nextLabel}
          onPress={onNext}
          backgroundColor={HomeColors.primaryPurple}
          foregroundColor={Colors.white}
          borderRadius={14}
          style={{ paddingVertical: 16 }}
          textStyle={{ fontSize: 15, fontWeight: "bold" }}
        />
      </View>
    </View>
  );
}
