// Equivalente de notifications/ui/views/activity_notification_page.dart
// ("Comentario" y "Tarea completada", Página 4.3).
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, FilledButton, IconButton } from "@/src/core/ui/material";
import { timeAgo } from "@/src/core/utils/timeAgo";
import { Project } from "@/src/features/projects/domain/models/project";

import { AppNotificationType } from "../../domain/models/appNotification";
import { NotificationsController } from "../viewmodels/notificationsController";
import { PersonHeader } from "../widgets/PersonHeader";
import { QuoteBox } from "../widgets/QuoteBox";

export function ActivityNotificationPage({ args }: { args: ScreenParams["ActivityNotification"] }) {
  const n = args.notification;
  const di = useDI();
  const [project, setProject] = useState<Project | null>(null);
  const isComment = n.type === AppNotificationType.newComment;

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

  const projectName = project?.name ?? "el proyecto";
  const detail = n.detail ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar leading={<IconButton icon="arrow_back" onPress={() => Nav.back()} />} />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <View style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 20 }}>
          <PersonHeader
            icon={isComment ? "person_outline" : "check_box_outlined"}
            name={n.actorName ?? "Alguien"}
            lines={isComment ? ["comentó en el proyecto", projectName] : ["completó la tarea", detail]}
            time={timeAgo(n.createdAt)}
          />
          <View style={{ height: 24 }} />
          {isComment ? <QuoteBox text={detail === "" ? n.message : detail} /> : <QuoteBox text={n.message} />}
          <View style={{ height: 24 }} />
          <FilledButton
            label={isComment ? "Ver proyecto" : "Ver tarea"}
            onPress={project == null ? null : () => void Nav.off("ProjectDetail", { project })}
            backgroundColor={HomeColors.primaryPurple}
            borderRadius={12}
            height={50}
            style={{ height: 50 }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
