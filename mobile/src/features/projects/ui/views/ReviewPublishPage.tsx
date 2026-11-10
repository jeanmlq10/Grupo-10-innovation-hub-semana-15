// Equivalente de projects/ui/views/review_publish_page.dart: "Revisar y publicar".
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { formatShortDate } from "@/src/core/utils/dateFormat";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { WizardHeader, WizardTitle } from "../widgets/wizardBits";
import { WizardNavButtons } from "../widgets/WizardNavButtons";
import { Palette } from "@/src/core/theme/brand";

function SectionTitle({ children }: { children: string }) {
  return <Text style={{ fontWeight: "bold", fontSize: 14.5, color: HomeColors.textPrimary }}>{children}</Text>;
}

export function ReviewPublishPage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  const noTeam = [...controller.teamRoles.value.values()].every((c) => c === 0);

  const publish = async () => {
    const ok = await controller.finish();
    if (!ok) return;
    if (controller.isEditing) {
      Nav.offAllNamed(RouteNames.myProjects);
      return;
    }
    void Nav.offAll("ProjectPublished", {
      projectId: controller.draftId,
      isPrivate: controller.audience.value === "Solo yo",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <WizardHeader step={4} />
        <View style={{ height: 20 }} />
        <WizardTitle title="Revisar y publicar" subtitle="Verifica la información de tu proyecto" />
        <View style={{ height: 20 }} />
        <ScrollView style={{ flex: 1 }}>
          <View
            style={{
              padding: 14,
              borderWidth: 1,
              borderColor: HomeColors.borderGrey,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "flex-start",
            }}
          >
            <View style={{ width: 40, height: 40, backgroundColor: Palette.limeTint, borderRadius: 12, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcon name="eco_outlined" color={Palette.primary} size={20} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 15, color: HomeColors.textPrimary }}>
                {controller.name.value === "" ? "(Sin nombre)" : controller.name.value}
              </Text>
              <View style={{ height: 2 }} />
              <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>
                {controller.description.value === "" ? "Sin descripción todavía." : controller.description.value}
              </Text>
            </View>
          </View>
          <View style={{ height: 20 }} />
          <SectionTitle>Equipo necesario</SectionTitle>
          <View style={{ height: 8 }} />
          {noTeam ? (
            <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>No se especificó equipo todavía.</Text>
          ) : (
            CreateProjectController.teamRoleOrder
              .filter((role) => controller.roleCount(role) > 0)
              .map((role) => (
                <Text key={role} style={{ paddingBottom: 4, fontSize: 13.5, color: HomeColors.textPrimary }}>
                  {`${controller.roleCount(role)} ${
                    role === "Otro" && controller.otherRoleName.value.trim() !== "" ? controller.otherRoleName.value.trim() : role
                  }`}
                </Text>
              ))
          )}
          {controller.teamDeadline.value != null ? (
            <Text style={{ paddingTop: 4, fontSize: 13, color: HomeColors.textSecondary }}>
              {`Convocatoria abierta hasta: ${formatShortDate(controller.teamDeadline.value)}`}
            </Text>
          ) : null}
          <View style={{ height: 20 }} />
          <SectionTitle>Tareas específicas</SectionTitle>
          <View style={{ height: 8 }} />
          {controller.tasks.value.length === 0 ? (
            <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>No se agregaron tareas todavía.</Text>
          ) : (
            controller.tasks.value.map((task, i) => (
              <Text key={`${task.title}-${i}`} style={{ paddingBottom: 4, fontSize: 13.5, color: HomeColors.textPrimary }}>
                {`${task.numberNeeded} · ${task.title}${task.deadline == null ? "" : ` · hasta ${formatShortDate(task.deadline)}`}`}
              </Text>
            ))
          )}
          <View style={{ height: 20 }} />
          <SectionTitle>Tiempo estimado</SectionTitle>
          <View style={{ height: 8 }} />
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: HomeColors.navSelectedBackground,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: "600", color: HomeColors.primaryPurple }}>
              {controller.duration.value ?? "No seleccionado"}
            </Text>
          </View>
          <View style={{ height: 20 }} />
          <SectionTitle>Audiencia</SectionTitle>
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcon name="groups_outlined" size={18} color={HomeColors.textSecondary} />
            <View style={{ width: 6 }} />
            <Text style={{ fontSize: 13.5, color: HomeColors.textPrimary }}>{controller.audience.value ?? "No seleccionada"}</Text>
          </View>
        </ScrollView>
        <View style={{ height: 8 }} />
        <WizardNavButtons
          onBack={() => Nav.back()}
          nextLabel={
            controller.isEditing
              ? "Guardar cambios"
              : controller.audience.value === "Solo yo"
                ? "Guardar en borradores"
                : "Publicar proyecto"
          }
          onNext={() => void publish()}
        />
      </SafeAreaView>
    </View>
  );
}
