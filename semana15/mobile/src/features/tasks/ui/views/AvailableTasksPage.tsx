// Equivalente de tasks/ui/views/available_tasks_page.dart: "Tareas disponibles".
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator } from "@/src/core/ui/material";
import { snackbar } from "@/src/core/ui/overlay";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { ProjectDetailController } from "@/src/features/projects/ui/viewmodels/projectDetailController";
import { SelectableOptionTile } from "@/src/features/projects/ui/widgets/SelectableOptionTile";
import { CompactBackArrow, PurpleWideButton, WizardTitle } from "@/src/features/projects/ui/widgets/wizardBits";

import { ProjectTask } from "../../domain/models/projectTask";

export function AvailableTasksPage({ args }: { args: ScreenParams["AvailableTasks"] }) {
  const { project } = args;
  const di = useDI();
  const [state, setState] = useState<{ done: boolean; data?: ProjectTask[]; error?: unknown }>({ done: false });
  const [selected, setSelected] = useState<ProjectTask | null>(null);

  useEffect(() => {
    let active = true;
    di.resolve<ProjectDetailController>(TOKENS.ProjectDetailController)
      .tasksFor(project.id)
      .then((tasks) => active && setState({ done: true, data: tasks.filter((t) => t.canApplyAt()) }))
      .catch((error) => active && setState({ done: true, error }));
    return () => {
      active = false;
    };
  }, [di, project.id]);

  const body = () => {
    if (!state.done) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    const tasks = state.data ?? [];
    if (state.error || tasks.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ textAlign: "center", color: HomeColors.textSecondary }}>
            {state.error ? errorMessage(state.error) : "Este proyecto no tiene tareas disponibles."}
          </Text>
        </View>
      );
    }
    return (
      <ScrollView>
        {tasks.map((task) => (
          <SelectableOptionTile
            key={task.id}
            icon="task_alt_outlined"
            title={task.title}
            subtitle={
              task.deadline == null
                ? `Se necesitan ${task.numberNeeded - task.numberAccepted}`
                : `Se necesitan ${task.numberNeeded - task.numberAccepted} · Disponible hasta: ${formatShortDate(task.deadline)}`
            }
            selected={selected?.id === task.id}
            onTap={() => setSelected(task)}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <CompactBackArrow />
        <View style={{ height: 16 }} />
        <WizardTitle title="Tareas disponibles" subtitle="Elige en cuál quieres ayudar" />
        <View style={{ height: 20 }} />
        <View style={{ flex: 1 }}>{body()}</View>
        <View style={{ height: 8 }} />
        <PurpleWideButton
          label="Continuar"
          onPress={() => {
            if (selected == null) {
              snackbar("Elige una tarea", "Selecciona en cuál tarea quieres ayudar.", { position: "BOTTOM" });
              return;
            }
            void Nav.to("JoinTeam", { project, task: selected });
          }}
        />
      </SafeAreaView>
    </View>
  );
}
