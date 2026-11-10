// Equivalente de projects/ui/views/estimated_time_page.dart: "Tiempo estimado" (3/4).
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors } from "@/src/core/theme/homeColors";
import { IconName } from "@/src/core/ui/MaterialIcon";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { SelectableOptionTile } from "../widgets/SelectableOptionTile";
import { WizardHeader, WizardTitle } from "../widgets/wizardBits";
import { WizardNavButtons } from "../widgets/WizardNavButtons";

const OPTIONS: { label: string; subtitle: string; icon: IconName }[] = [
  { label: "Días", subtitle: "1 - 30 días", icon: "calendar_today_outlined" },
  { label: "Semanas", subtitle: "1 - 12 semanas", icon: "calendar_today_outlined" },
  { label: "Meses", subtitle: "1 - 12 meses", icon: "calendar_today_outlined" },
  { label: "Años", subtitle: "Más de 1 año", icon: "schedule_outlined" },
];

export function EstimatedTimePage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <WizardHeader step={3} />
        <View style={{ height: 20 }} />
        <WizardTitle title="Tiempo estimado" subtitle="¿Cuánto tiempo crees que tomará?" />
        <View style={{ height: 20 }} />
        <ScrollView style={{ flex: 1 }}>
          {OPTIONS.map((option) => (
            <SelectableOptionTile
              key={option.label}
              icon={option.icon}
              title={option.label}
              subtitle={option.subtitle}
              selected={controller.duration.value === option.label}
              onTap={() => controller.selectDuration(option.label)}
            />
          ))}
        </ScrollView>
        <View style={{ height: 8 }} />
        <WizardNavButtons onBack={() => Nav.back()} onNext={() => void Nav.to("Audience")} />
      </SafeAreaView>
    </View>
  );
}
