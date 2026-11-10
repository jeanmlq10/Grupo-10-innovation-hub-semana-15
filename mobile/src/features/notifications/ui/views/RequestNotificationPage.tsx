// Equivalente de notifications/ui/views/request_notification_page.dart
// (Página 4.3): solicitud de miembro / postulación a tarea para el creador.
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, CircularProgressIndicator, FilledButton, IconButton, OutlinedButton } from "@/src/core/ui/material";
import { snackbar } from "@/src/core/ui/overlay";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { timeAgo } from "@/src/core/utils/timeAgo";
import { Project } from "@/src/features/projects/domain/models/project";
import { ParticipationRequest, RequestStatus } from "@/src/features/requests/domain/models/participationRequest";
import { RequestsController } from "@/src/features/requests/ui/viewmodels/requestsController";

import { AppNotificationType } from "../../domain/models/appNotification";
import { NotificationsController } from "../viewmodels/notificationsController";
import { InfoNavTile } from "../widgets/InfoNavTile";
import { PersonHeader } from "../widgets/PersonHeader";
import { QuoteBox } from "../widgets/QuoteBox";

export function RequestNotificationPage({ args }: { args: ScreenParams["RequestNotification"] }) {
  const n = args.notification;
  const di = useDI();
  const requests = di.resolve<RequestsController>(TOKENS.RequestsController);
  const notifications = di.resolve<NotificationsController>(TOKENS.NotificationsController);
  const isTask = n.type === AppNotificationType.taskApplication;

  const [future, setFuture] = useState<{ done: boolean; data?: [ParticipationRequest | null, Project | null]; error?: unknown }>({ done: false });
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const project = await notifications.projectById(n.projectId);
        const request = n.requestId == null ? null : await requests.requestFor(n.projectId, n.requestId);
        if (active) setFuture({ done: true, data: [request, project] });
      } catch (error) {
        if (active) setFuture({ done: true, error });
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (request: ParticipationRequest, accept: boolean) => {
    if (deciding) return;
    setDeciding(true);
    try {
      if (accept) await requests.acceptRequest(request);
      else await requests.rejectRequest(request);
      Nav.back();
      snackbar(
        accept ? "¡Listo!" : "Solicitud rechazada",
        accept ? `${request.applicantName} ahora es parte del equipo.` : `Le avisamos a ${request.applicantName}.`,
        { position: "BOTTOM" },
      );
    } catch (error) {
      snackbar("Solicitudes", errorMessage(error), { position: "BOTTOM" });
    } finally {
      setDeciding(false);
    }
  };

  const body = () => {
    if (!future.done) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    if (future.error) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 14 }}>{errorMessage(future.error)}</Text>
        </View>
      );
    }
    const [request, project] = future.data!;
    const applicantName = request?.applicantName ?? n.actorName ?? "Usuario";
    const applicantId = request?.applicantUserId ?? n.actorUserId;
    const projectName = project?.name ?? "tu proyecto";
    const role = request?.role ?? n.detail ?? "";

    return (
      <>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 16 }}>
          <PersonHeader
            name={applicantName}
            lines={isTask ? ["se postuló a la tarea", role] : ["quiere unirse a tu proyecto", projectName]}
            time={timeAgo(n.createdAt)}
          />
          <View style={{ height: 24 }} />
          <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>
            {isTask ? "Mensaje de postulación" : "Mensaje de presentación"}
          </Text>
          <View style={{ height: 8 }} />
          <QuoteBox text={(request?.message ?? "") === "" ? "Sin mensaje." : request!.message} />
          {!isTask && role !== "" ? <Text style={{ marginTop: 8, color: HomeColors.textSecondary, fontSize: 14 }}>{`Rol: ${role}`}</Text> : null}
          <View style={{ height: 22 }} />
          <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>Información del usuario</Text>
          <View style={{ height: 8 }} />
          {applicantId != null ? (
            <>
              <InfoNavTile label="Perfil" onTap={() => void Nav.to("PublicProfile", { userId: applicantId, name: applicantName })} />
              <View style={{ height: 8 }} />
              <InfoNavTile
                label="Proyectos en los que ha participado"
                onTap={() => void Nav.to("UserParticipations", { userId: applicantId, name: applicantName })}
              />
            </>
          ) : null}
        </ScrollView>
        <View style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 16 }}>
          {request == null ? (
            <Text style={{ color: HomeColors.textSecondary, fontSize: 14 }}>Esta solicitud ya no está disponible.</Text>
          ) : request.status !== RequestStatus.pending ? (
            <Text style={{ color: HomeColors.textSecondary, fontSize: 14 }}>
              {request.status === RequestStatus.accepted ? "Ya aceptaste esta solicitud." : "Ya rechazaste esta solicitud."}
            </Text>
          ) : (
            <View style={{ flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <OutlinedButton
                  label="Rechazar"
                  onPress={deciding ? null : () => void decide(request, false)}
                  foregroundColor={HomeColors.primaryPurple}
                  borderColor={HomeColors.primaryPurple}
                  style={{ paddingVertical: 15 }}
                />
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}>
                <FilledButton
                  testID="request_accept"
                  label="Aceptar"
                  onPress={deciding ? null : () => void decide(request, true)}
                  backgroundColor={HomeColors.primaryPurple}
                  style={{ paddingVertical: 15 }}
                />
              </View>
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar leading={<IconButton icon="arrow_back" onPress={() => Nav.back()} />} />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        {body()}
      </SafeAreaView>
    </View>
  );
}
