// Equivalente de projects/ui/views/audience_page.dart: "Audiencia" (4/4).
// La elección se guarda en Roble de inmediato.
import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors } from "@/src/core/theme/homeColors";
import { IconName } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { SelectableOptionTile } from "../widgets/SelectableOptionTile";
import { WizardHeader, WizardTitle } from "../widgets/wizardBits";
import { WizardNavButtons } from "../widgets/WizardNavButtons";

const OPTIONS: { label: string; subtitle: string; icon: IconName }[] = [
  { label: "Solo yo", subtitle: "Tu proyecto será privado, solo tú podrás verlo", icon: "lock_outline" },
  { label: "Toda la comunidad", subtitle: "Tu proyecto será visible para todos los usuarios", icon: "groups_outlined" },
];

export function AudiencePage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <WizardHeader step={4} />
        <View style={{ height: 20 }} />
        <WizardTitle title="Audiencia" subtitle="¿Quién puede ver tu proyecto?" />
        <View style={{ height: 20 }} />
        <ScrollView style={{ flex: 1 }}>
          {OPTIONS.map((option) => (
            <SelectableOptionTile
              key={option.label}
              icon={option.icon}
              title={option.label}
              subtitle={option.subtitle}
              selected={controller.audience.value === option.label}
              onTap={() => controller.selectAudience(option.label)}
            />
          ))}
        </ScrollView>
        <View style={{ height: 8 }} />
        <WizardNavButtons
          onBack={() => Nav.back()}
          onNext={
            controller.audience.value == null
              ? () => snackbar("Audiencia requerida", "Selecciona quién puede ver tu proyecto.", { position: "BOTTOM" })
              : () => void Nav.to("ReviewPublish")
          }
        />
      </SafeAreaView>
    </View>
  );
}
