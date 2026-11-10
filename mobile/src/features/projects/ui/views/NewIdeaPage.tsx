// Equivalente de projects/ui/views/new_idea_page.dart: "Comencemos".
import React, { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { snackbar } from "@/src/core/ui/overlay";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { CompactBackArrow, GreyTextField, PurpleWideButton } from "../widgets/wizardBits";
import { BrandLogo } from "@/src/core/widgets/BrandLogo";

export function NewIdeaPage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  const [name, setName] = useState(controller.name.value);

  const onContinue = () => {
    if (!controller.canContinue) {
      snackbar("Falta el nombre", "Escribe el nombre de tu idea para continuar.", { position: "BOTTOM" });
      return;
    }
    void Nav.to("BasicInfo");
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <CompactBackArrow />
        <View style={{ height: 20 }} />
        <Text style={{ fontSize: 26, fontWeight: "bold", color: HomeColors.textPrimary }}>Comencemos</Text>
        <View style={{ height: 10 }} />
        <Text style={{ fontSize: 14.5, color: HomeColors.textSecondary, lineHeight: 14.5 * 1.35 }}>
          Tu idea puede generar un gran cambio. Cuéntanos un poco sobre ella.
        </Text>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, overflow: "hidden" }}>
          <BrandLogo variant="symbol" size={190} halo accessibilityLabel="Tu idea empieza a crecer" />
        </View>
        <GreyTextField
          testID="idea_name"
          value={name}
          onChangeText={(v) => {
            setName(v);
            controller.updateName(v);
          }}
          hint="Nombre de tu idea"
        />
        <View style={{ height: 16 }} />
        <PurpleWideButton testID="idea_continue" label="Continuar" onPress={onContinue} />
      </SafeAreaView>
    </View>
  );
}
