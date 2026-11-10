// Equivalente de notifications/ui/views/request_result_page.dart (Página 4.2):
// respuesta a quien pidió participar (aceptada / rechazada).
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames, ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, FilledButton, IconButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { Project } from "@/src/features/projects/domain/models/project";

import { NotificationsController } from "../viewmodels/notificationsController";
import { QuoteBox } from "../widgets/QuoteBox";
import { Palette } from "@/src/core/theme/brand";

export function RequestResultPage({ args }: { args: ScreenParams["RequestResult"] }) {
  const n = args.notification;
  const di = useDI();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    let active = true;
    di.resolve<NotificationsController>(TOKENS.NotificationsController)
      .projectById(n.projectId)
      .then((p) => active && setProject(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [di, n.projectId]);

  const openProject = (p: Project | null) => {
    if (p == null) return;
    void Nav.off("ProjectDetail", { project: p });
  };

  const accepted = n.isAccepted;
  const task = n.isAboutTask;
  const detail = n.detail ?? "";
  const projectName = project?.name ?? "el proyecto";
  let title: string;
  let subtitle: string;
  let hint: string;
  let button: string;
  if (accepted && task) {
    title = "¡Listo!";
    subtitle = `Fuiste asignado a la tarea\n${detail}`;
    hint = "Ya puedes ver los detalles de la tarea y comenzar a trabajar en ella.";
    button = "Ver tarea";
  } else if (accepted) {
    title = "¡Listo!";
    subtitle = `Fuiste aceptado en el proyecto\n${projectName}`;
    hint = "Ahora puedes acceder al proyecto y comenzar a colaborar con el equipo.";
    button = "Ir al proyecto";
  } else if (task) {
    title = "Postulación rechazada";
    subtitle = `Tu postulación para la tarea ${detail} no fue aceptada.`;
    hint = "Puedes seguir explorando otras tareas dentro del proyecto o en otros proyectos.";
    button = "Explorar proyectos";
  } else {
    title = "Solicitud rechazada";
    subtitle = `Tu solicitud para unirte al proyecto ${projectName} no fue aceptada.`;
    hint = "Puedes seguir explorando otros proyectos o postularte a nuevas oportunidades.";
    button = "Explorar proyectos";
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar leading={<IconButton icon="arrow_back" onPress={() => Nav.back()} />} />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <View style={{ flex: 1, paddingLeft: 24, paddingTop: 8, paddingRight: 24, paddingBottom: 20, alignItems: "center" }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: accepted ? HomeColors.primaryPurple : Colors.white,
              borderWidth: accepted ? 0 : 3,
              borderColor: Palette.error,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcon name={accepted ? "check_rounded" : "close_rounded"} size={48} color={accepted ? Colors.white : "#E35D5B"} />
          </View>
          <View style={{ height: 18 }} />
          <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>{title}</Text>
          <View style={{ height: 8 }} />
          <Text style={{ textAlign: "center", fontSize: 14.5, color: HomeColors.textSecondary, lineHeight: 14.5 * 1.35 }}>{subtitle}</Text>
          <View style={{ height: 22 }} />
          <View
            style={{
              alignSelf: "stretch",
              padding: 14,
              borderWidth: 1,
              borderColor: HomeColors.borderGrey,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ width: 46, height: 46, backgroundColor: Palette.limeTint, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcon name="eco_outlined" color={Palette.primary} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>{projectName}</Text>
              {detail !== "" ? <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{detail}</Text> : null}
              {project != null ? (
                <Pressable onPress={() => openProject(project)} accessibilityRole="link">
                  <Text style={{ fontSize: 12.5, fontWeight: "600", color: HomeColors.primaryPurple }}>Ver proyecto &gt;</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
          <View style={{ height: 14 }} />
          <View style={{ alignSelf: "stretch" }}>
            <QuoteBox text={hint} />
          </View>
          <View style={{ flex: 1 }} />
          <FilledButton
            label={button}
            onPress={accepted ? () => openProject(project) : () => Nav.offAllNamed(RouteNames.home)}
            backgroundColor={HomeColors.primaryPurple}
            borderRadius={12}
            height={52}
            style={{ height: 52, alignSelf: "stretch" }}
            textStyle={{ fontWeight: "700" }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
