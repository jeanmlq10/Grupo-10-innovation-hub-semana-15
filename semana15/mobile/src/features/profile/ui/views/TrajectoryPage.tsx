// Equivalente de profile/ui/views/trajectory_page.dart: "Resumen de trayectoria".
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar } from "@/src/core/ui/material";

import { ProfileController } from "../viewmodels/profileController";
import { PerformanceBar } from "../widgets/PerformanceBar";
import { TrajectoryStatsGrid } from "../widgets/TrajectoryStatsGrid";

export function TrajectoryPage() {
  const controller = useFind<ProfileController>(TOKENS.ProfileController);
  const s = controller.summary.value;
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Resumen de trayectoria" titleStyle={{ fontWeight: "bold" }} />
      <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 24 }}>
        <TrajectoryStatsGrid summary={s} />
        <View style={{ height: 22 }} />
        <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>Tu desempeño</Text>
        <View style={{ height: 6 }} />
        <PerformanceBar label="Colaboración" value={s.collaborationOrNull} />
        <PerformanceBar label="Cumplimiento" value={s.fulfillmentOrNull} />
        <PerformanceBar label="Calidad de aportes" value={s.qualityOrNull} />
        <View style={{ height: 16 }} />
        <Text style={{ fontSize: 12, color: HomeColors.textSecondary }}>
          Colaboración: participaciones, proyectos creados y comentarios. Cumplimiento: tareas asignadas que se completaron. Calidad de
          aportes: solicitudes tuyas que fueron aceptadas.
        </Text>
      </ScrollView>
    </View>
  );
}
