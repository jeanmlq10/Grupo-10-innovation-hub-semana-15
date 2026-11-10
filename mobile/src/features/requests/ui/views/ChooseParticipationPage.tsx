// Equivalente de requests/ui/views/choose_participation_page.dart:
// "Elige cómo participar".
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { snackbar } from "@/src/core/ui/overlay";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { showProjectComments } from "@/src/features/comments/ui/widgets/ProjectCommentsSheet";
import { CompactBackArrow } from "@/src/features/projects/ui/widgets/wizardBits";
import { ProjectDetailController } from "@/src/features/projects/ui/viewmodels/projectDetailController";
import { ProjectTask } from "@/src/features/tasks/domain/models/projectTask";

import { ParticipationOptionTile } from "../widgets/ParticipationOptionTile";

export function ChooseParticipationPage({ args }: { args: ScreenParams["ChooseParticipation"] }) {
  const { project } = args;
  const di = useDI();
  const [openTasks, setOpenTasks] = useState<ProjectTask[] | null>(null);

  useEffect(() => {
    let active = true;
    di.resolve<ProjectDetailController>(TOKENS.ProjectDetailController)
      .tasksFor(project.id)
      .then((tasks) => active && setOpenTasks(tasks.filter((t) => t.canApplyAt())))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [di, project.id]);

  const tasksFootnote = (() => {
    if (openTasks == null) return null;
    if (openTasks.length === 0) return "No hay tareas disponibles ahora";
    const dates = openTasks
      .map((t) => t.deadline)
      .filter((d): d is Date => d != null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length === 0) return null;
    return `Disponible hasta: ${formatShortDate(dates[dates.length - 1])}`;
  })();

  const teamFootnote = (() => {
    if (!project.isTeamCallOpenAt()) return "Convocatoria cerrada";
    const deadline = project.teamDeadline;
    return deadline == null ? null : `Convocatoria hasta: ${formatShortDate(deadline)}`;
  })();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <CompactBackArrow />
        <View style={{ height: 16 }} />
        <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>Elige cómo participar</Text>
        <View style={{ height: 20 }} />
        <ParticipationOptionTile
          icon="chat_bubble_outline"
          title="Comentar"
          subtitle="Comparte ideas y dudas."
          onTap={() => void showProjectComments(project.id, project.name)}
        />
        <ParticipationOptionTile
          icon="task_alt_outlined"
          title="Postularme a una tarea"
          subtitle="Ayuda en una tarea específica."
          footnote={tasksFootnote}
          onTap={() => void Nav.to("AvailableTasks", { project })}
        />
        <ParticipationOptionTile
          icon="groups_outlined"
          title="Unirme al equipo"
          subtitle="Forma parte del equipo a largo plazo."
          footnote={teamFootnote}
          onTap={() => {
            if (!project.isTeamCallOpenAt()) {
              snackbar("Convocatoria cerrada", "La convocatoria para unirse al equipo ya cerró.", { position: "BOTTOM" });
              return;
            }
            void Nav.to("JoinTeam", { project });
          }}
        />
      </SafeAreaView>
    </View>
  );
}
