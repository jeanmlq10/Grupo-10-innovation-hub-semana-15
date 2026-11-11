// Equivalente de projects/ui/views/project_published_page.dart: "¡Proyecto publicado!".
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getContainer } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames, ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { OutlinedButton } from "@/src/core/ui/material";

import { ProjectDetailController } from "../viewmodels/projectDetailController";
import { ConfettiCheckIllustration } from "../widgets/ConfettiCheckIllustration";
import { PurpleWideButton } from "../widgets/wizardBits";

export function ProjectPublishedPage({ args }: { args: ScreenParams["ProjectPublished"] }) {
  const { projectId, isPrivate = false } = args;

  const openMyProject = async () => {
    const project = await getContainer().resolve<ProjectDetailController>(TOKENS.ProjectDetailController).projectById(projectId);
    if (project == null) {
      Nav.offAllNamed(RouteNames.myProjects);
      return;
    }
    if (project.audience === "Solo yo") void Nav.to("CreateProject", { editProjectId: project.id });
    else void Nav.to("ProjectDetail", { project });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 24, paddingTop: 40, paddingRight: 24, paddingBottom: 24, alignItems: "center" }}>
        <View style={{ flex: 1 }} />
        <ConfettiCheckIllustration />
        <View style={{ height: 28 }} />
        <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>
          {isPrivate ? "¡Proyecto guardado!" : "¡Proyecto publicado!"}
        </Text>
        <View style={{ height: 10 }} />
        <Text style={{ textAlign: "center", fontSize: 14.5, color: HomeColors.textSecondary, lineHeight: 14.5 * 1.4 }}>
          {isPrivate
            ? "Tu proyecto quedó guardado en Mis borradores.\nSolo tú puedes verlo."
            : "Tu proyecto ya está disponible en Explorar proyectos.\n¡Ahora otros usuarios podrán unirse!\nLas tareas y convocatorias muestran su fecha límite."}
        </Text>
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: "stretch" }}>
          <PurpleWideButton label={isPrivate ? "Editar mi proyecto" : "Ver mi proyecto"} onPress={() => void openMyProject()} />
          <View style={{ height: 12 }} />
          <OutlinedButton
            label="Volver a mis proyectos"
            onPress={() => Nav.offAllNamed(RouteNames.myProjects)}
            foregroundColor={HomeColors.primaryPurple}
            backgroundColor={HomeColors.navSelectedBackground}
            borderWidth={0}
            borderRadius={14}
            style={{ paddingVertical: 16 }}
            textStyle={{ fontSize: 15, fontWeight: "600" }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
