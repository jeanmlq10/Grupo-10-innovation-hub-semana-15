// Equivalente de requests/ui/views/requests_page.dart: "Solicitudes" recibidas
// en los proyectos del usuario, en tres pestañas.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, FilledButton, OutlinedButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { TabBar, TabBarView } from "@/src/core/ui/tabs";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { CompactBackArrow } from "@/src/features/projects/ui/widgets/wizardBits";

import { ParticipationRequest, RequestStatus, RequestType } from "../../domain/models/participationRequest";
import { RequestsController } from "../viewmodels/requestsController";
import { Palette } from "@/src/core/theme/brand";

function subtitle(request: ParticipationRequest): string {
  const kind = request.type === RequestType.task ? "Tarea" : "Equipo";
  const project = request.projectName ?? "";
  return project === "" ? `${kind}: ${request.role}` : `${kind}: ${request.role} · ${project}`;
}

function RequestList({
  requests,
  emptyMessage,
  onAccept,
  onReject,
  processingId,
}: {
  requests: ParticipationRequest[];
  emptyMessage: string;
  onAccept?: (r: ParticipationRequest) => void;
  onReject?: (r: ParticipationRequest) => void;
  processingId?: string | null;
}) {
  if (requests.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: HomeColors.textSecondary }}>{emptyMessage}</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={requests}
      keyExtractor={(r) => r.id}
      contentContainerStyle={{ padding: 20 }}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      renderItem={({ item: request }) => (
        <View style={{ padding: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
              <MaterialIcon name="person" color={HomeColors.primaryPurple} size={18} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "bold", fontSize: 14.5, color: HomeColors.textPrimary }}>{request.applicantName}</Text>
              <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{subtitle(request)}</Text>
            </View>
          </View>
          <View style={{ height: 10 }} />
          <Text style={{ fontSize: 13, color: HomeColors.textPrimary, lineHeight: 13 * 1.3 }}>{request.message}</Text>
          {onAccept && onReject ? (
            <View style={{ marginTop: 14, flexDirection: "row" }}>
              <View style={{ flex: 1 }}>
                <OutlinedButton
                  label="Rechazar"
                  onPress={processingId != null ? null : () => onReject(request)}
                  foregroundColor={HomeColors.textPrimary}
                  borderColor={HomeColors.borderGrey}
                  borderRadius={12}
                  style={{ paddingVertical: 12 }}
                />
              </View>
              <View style={{ width: 10 }} />
              <View style={[{ flex: 1, borderRadius: 12 }, boxShadow({ color: withAlpha(Palette.shadow, 0.22), blur: 6, dy: 2 })]}>
                <FilledButton
                  testID={`accept_${request.id}`}
                  onPress={processingId != null ? null : () => onAccept(request)}
                  backgroundColor={HomeColors.primaryPurple}
                  foregroundColor={Colors.white}
                  disabledBackgroundColor={withAlpha(HomeColors.primaryPurple, 0.6)}
                  disabledForegroundColor={Colors.white}
                  borderRadius={12}
                  style={{ paddingVertical: 12 }}
                >
                  {processingId === request.id ? (
                    <CircularProgressIndicator size={18} strokeWidth={2} color={Colors.white} />
                  ) : (
                    <Text style={{ color: Colors.white, fontSize: 14, fontWeight: "500" }}>Aceptar</Text>
                  )}
                </FilledButton>
              </View>
            </View>
          ) : null}
        </View>
      )}
    />
  );
}

export function RequestsPage() {
  const di = useDI();
  const controller = di.resolve<RequestsController>(TOKENS.RequestsController);
  const [tab, setTab] = useState(0);
  const [future, setFuture] = useState<{ done: boolean; data?: ParticipationRequest[]; error?: unknown }>({ done: false });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const decided = useRef(new Map<string, RequestStatus>());
  const [, rerender] = useState(0);

  const reload = useCallback(() => {
    setFuture({ done: false });
    controller
      .requestsForMyProjects()
      .then((data) => setFuture({ done: true, data }))
      .catch((error) => setFuture({ done: true, error }));
  }, [controller]);

  useEffect(() => reload(), [reload]);

  const decide = async (request: ParticipationRequest, accept: boolean) => {
    if (decided.current.has(request.id)) {
      snackbar(
        "Solicitudes",
        decided.current.get(request.id) === RequestStatus.accepted ? "Esta solicitud ya fue aceptada." : "Esta solicitud ya fue rechazada.",
        { position: "BOTTOM" },
      );
      return;
    }
    if (processingId != null) return;
    setProcessingId(request.id);
    try {
      if (accept) await controller.acceptRequest(request);
      else await controller.rejectRequest(request);
      decided.current.set(request.id, accept ? RequestStatus.accepted : RequestStatus.rejected);
      rerender((n) => n + 1);
      snackbar("Solicitudes", accept ? `${request.applicantName} ahora es parte del equipo.` : "Solicitud rechazada.", {
        position: "BOTTOM",
      });
      reload();
    } catch (error) {
      console.log(`RequestsPage: decision failed: ${error}`);
      snackbar("Solicitudes", errorMessage(error), { position: "BOTTOM" });
    } finally {
      setProcessingId(null);
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
          <Text style={{ color: HomeColors.textSecondary }}>{errorMessage(future.error)}</Text>
        </View>
      );
    }
    const all = (future.data ?? []).map((r) => (decided.current.has(r.id) ? r.copyWith({ status: decided.current.get(r.id) }) : r));
    const byStatus = (status: RequestStatus) => all.filter((r) => r.status === status);
    return (
      <TabBarView
        index={tab}
        onChange={setTab}
        pages={[
          () => (
            <RequestList
              requests={byStatus(RequestStatus.pending)}
              emptyMessage="No tienes solicitudes pendientes."
              processingId={processingId}
              onAccept={(r) => void decide(r, true)}
              onReject={(r) => void decide(r, false)}
            />
          ),
          () => <RequestList requests={byStatus(RequestStatus.accepted)} emptyMessage="Todavía no aceptas ninguna solicitud." />,
          () => <RequestList requests={byStatus(RequestStatus.rejected)} emptyMessage="No has rechazado ninguna solicitud." />,
        ]}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingLeft: 20, paddingTop: 12, paddingRight: 20, flexDirection: "row", alignItems: "center" }}>
          <CompactBackArrow />
          <View style={{ width: 8 }} />
          <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>Solicitudes</Text>
        </View>
        <View style={{ height: 12 }} />
        <TabBar
          labels={["Pendientes", "Aceptadas", "Rechazadas"]}
          index={tab}
          onChange={setTab}
          labelColor={HomeColors.primaryPurple}
          unselectedLabelColor={HomeColors.textSecondary}
          indicatorColor={HomeColors.primaryPurple}
          labelStyle={{ fontWeight: "600", fontSize: 13.5 }}
        />
        <View style={{ flex: 1 }}>{body()}</View>
      </SafeAreaView>
    </View>
  );
}
