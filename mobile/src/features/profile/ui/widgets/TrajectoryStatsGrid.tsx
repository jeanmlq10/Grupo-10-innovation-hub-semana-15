// Equivalente de profile/ui/widgets/trajectory_stats_grid.dart: 4 indicadores en 2×2.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { TrajectorySummary } from "../../domain/models/trajectorySummary";
import { ProfileLabels } from "./profileLabels";

export function TrajectoryStatsGrid({ summary }: { summary: TrajectorySummary }) {
  const stats: [IconName, string, string][] = [
    ["folder_outlined", `${summary.projectsCompleted}`, "Proyectos\ncompletados"],
    ["check_circle_outline", `${summary.tasksCompleted}`, "Tareas\ncompletadas"],
    ["groups_outlined", `${summary.participations}`, "Participaciones\nen proyectos"],
    ["bar_chart_rounded", ProfileLabels.commitment(summary.commitment), "Compromiso\nen la plataforma"],
  ];
  return (
    <View style={{ borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14 }}>
      {[0, 1].map((row) => (
        <View key={row} style={{ flexDirection: "row", alignItems: "stretch" }}>
          {[0, 1].map((col) => {
            const [icon, value, label] = stats[row * 2 + col];
            return (
              <View
                key={col}
                style={{
                  flex: 1,
                  padding: 14,
                  borderRightWidth: col === 0 ? 1 : 0,
                  borderBottomWidth: row === 0 ? 1 : 0,
                  borderColor: HomeColors.borderGrey,
                  flexDirection: "row",
                  alignItems: "flex-start",
                }}
              >
                <MaterialIcon name={icon} color={HomeColors.primaryPurple} size={24} />
                <View style={{ width: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "bold", color: HomeColors.textPrimary }}>{value}</Text>
                  <Text style={{ fontSize: 11.5, color: HomeColors.textSecondary }}>{label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
