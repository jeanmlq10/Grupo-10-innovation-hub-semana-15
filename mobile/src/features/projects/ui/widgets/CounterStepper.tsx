// Equivalente de projects/ui/widgets/counter_stepper.dart: "–  0  +".
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

function StepperButton({ icon, onTap, label }: { icon: IconName; onTap: () => void; label: string }) {
  return (
    <InkWell
      circle
      onPress={onTap}
      accessibilityLabel={label}
      style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: HomeColors.surfaceGrey, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialIcon name={icon} size={15} color={HomeColors.textPrimary} />
    </InkWell>
  );
}

export function CounterStepper({
  count,
  onIncrement,
  onDecrement,
}: {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <StepperButton icon="remove" onTap={onDecrement} label="Restar" />
      <View style={{ width: 26, alignItems: "center" }}>
        <Text style={{ fontWeight: "bold", fontSize: 15, color: HomeColors.textPrimary }}>{`${count}`}</Text>
      </View>
      <StepperButton icon="add" onTap={onIncrement} label="Sumar" />
    </View>
  );
}
