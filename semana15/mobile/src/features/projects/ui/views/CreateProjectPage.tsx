// Equivalente de projects/ui/views/create_project_page.dart: resumen del
// asistente. Empieza un borrador nuevo o carga uno existente para editarlo.
import React from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { CreateProjectStepTile } from "../widgets/CreateProjectStepTile";
import { CompactBackArrow, PurpleWideButton } from "../widgets/wizardBits";

const STEPS = [
  { title: "Información básica", subtitle: "Nombre y descripción" },
  { title: "Equipo necesario", subtitle: "¿Qué miembros necesitas?" },
  { title: "Tiempo estimado", subtitle: "Define la duración del proyecto" },
  { title: "Audiencia", subtitle: "¿Quién puede ver tu proyecto?" },
  { title: "Revisar y publicar", subtitle: "Confirma la información" },
];

export function CreateProjectPage({ args }: { args: ScreenParams["CreateProject"] }) {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  const editProjectId = args?.editProjectId ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <CompactBackArrow />
        <View style={{ height: 8 }} />
        <Text style={{ fontSize: 24, fontWeight: "bold", color: HomeColors.textPrimary }}>Crear proyecto</Text>
        <View style={{ height: 4 }} />
        <Text style={{ fontSize: 14.5, color: HomeColors.textSecondary }}>Convierte tu idea en un proyecto real</Text>
        <View style={{ height: 20 }} />
        <FlatList
          style={{ flex: 1 }}
          data={STEPS}
          keyExtractor={(s) => s.title}
          renderItem={({ item, index }) => (
            <CreateProjectStepTile number={index + 1} title={item.title} subtitle={item.subtitle} showConnector={index !== STEPS.length - 1} />
          )}
        />
        <PurpleWideButton
          testID="create_project_start"
          label="Comenzar"
          onPress={async () => {
            if (editProjectId == null) {
              controller.startNewDraft();
              void Nav.to("NewIdea");
              return;
            }
            const ok = await controller.loadForEdit(editProjectId);
            if (ok) void Nav.to("NewIdea");
          }}
        />
      </SafeAreaView>
    </View>
  );
}
