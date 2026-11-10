// Equivalente de profile/ui/views/user_participations_page.dart.
import React, { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { M3 } from "@/src/core/theme/appTheme";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, CircularProgressIndicator } from "@/src/core/ui/material";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { Project } from "@/src/features/projects/domain/models/project";
import { ProjectCard } from "@/src/features/projects/ui/widgets/ProjectCard";

import { ProfileController } from "../viewmodels/profileController";

export function UserParticipationsPage({ args }: { args: ScreenParams["UserParticipations"] }) {
  const { userId, name } = args;
  const controller = useDI().resolve<ProfileController>(TOKENS.ProfileController);
  const [state, setState] = useState<{ done: boolean; data?: Project[]; error?: unknown }>({ done: false });

  useEffect(() => {
    let active = true;
    controller
      .participationsOf(userId)
      .then((data) => active && setState({ done: true, data }))
      .catch((error) => active && setState({ done: true, error }));
    return () => {
      active = false;
    };
  }, [controller, userId]);

  const body = () => {
    if (!state.done) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    if (state.error) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: M3.onSurface, fontSize: 14 }}>{errorMessage(state.error)}</Text>
        </View>
      );
    }
    const projects = state.data ?? [];
    if (projects.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: HomeColors.textSecondary }}>Todavía no ha participado en proyectos.</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={projects}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => <ProjectCard project={item} onTap={() => void Nav.to("ProjectDetail", { project: item })} />}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar title={`Proyectos de ${name}`} />
      {body()}
    </View>
  );
}
