// Equivalente de requests/ui/views/join_team_page.dart: "Envía tu solicitud"
// (postularse a una tarea o unirse al equipo con un rol abierto).
import React, { useEffect, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { DropdownButton } from "@/src/core/ui/dropdown";
import { CircularProgressIndicator } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { ProjectTeamRole } from "@/src/features/projects/domain/models/projectTeamRole";
import { ProjectDetailController } from "@/src/features/projects/ui/viewmodels/projectDetailController";
import { CompactBackArrow, GreyTextField, PurpleWideButton } from "@/src/features/projects/ui/widgets/wizardBits";

import { RequestsController } from "../viewmodels/requestsController";
import { Palette } from "@/src/core/theme/brand";

export function JoinTeamPage({ args }: { args: ScreenParams["JoinTeam"] }) {
  const { project, task = null, initialRoleName = null } = args;
  const di = useDI();
  const controller = di.resolve<ProjectDetailController>(TOKENS.ProjectDetailController);
  const requests = di.resolve<RequestsController>(TOKENS.RequestsController);

  const [message, setMessage] = useState("");
  const [roles, setRoles] = useState<{ done: boolean; data?: ProjectTeamRole[]; error?: unknown }>({ done: false });
  const [selectedRole, setSelectedRole] = useState<ProjectTeamRole | null>(null);
  const [sending, setSending] = useState(false);

  const isTask = task != null;
  const isOpen = isTask ? task.canApplyAt() : project.isTeamCallOpenAt();

  const deadlineText = (() => {
    if (!isOpen) {
      return isTask ? "La postulación a esta tarea ya cerró." : "La convocatoria para unirse al equipo ya cerró.";
    }
    const deadline = isTask ? task.deadline : project.teamDeadline;
    if (deadline == null) return null;
    return isTask
      ? `Postulación disponible hasta: ${formatShortDate(deadline)}`
      : `Convocatoria abierta hasta: ${formatShortDate(deadline)}`;
  })();

  useEffect(() => {
    if (isTask) return;
    let active = true;
    controller
      .rolesFor(project.id)
      .then((all) => {
        const open = all.filter((r) => r.hasSpots);
        const initial = open.filter((r) => r.role === initialRoleName);
        if (!active) return;
        if (initial.length > 0) setSelectedRole(initial[0]);
        setRoles({ done: true, data: open });
      })
      .catch((error) => active && setRoles({ done: true, error }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (sending) return;
    if (!isTask && selectedRole == null) {
      snackbar("Falta el rol", "Selecciona a qué rol quieres aplicar.", { position: "BOTTOM" });
      return;
    }
    const clean = message.trim();
    if (clean === "") {
      snackbar(
        "Falta el mensaje",
        isTask ? "Cuéntanos por qué quieres ayudar en esta tarea." : "Cuéntanos por qué quieres unirte al equipo.",
        { position: "BOTTOM" },
      );
      return;
    }
    Keyboard.dismiss();
    setSending(true);
    try {
      if (isTask) {
        await requests.submitTaskRequest({ project, task, message: clean });
      } else {
        await requests.submitTeamRequest({ project, role: selectedRole!, message: clean });
      }
      void Nav.to("RequestSent");
    } catch (error) {
      snackbar("No se pudo enviar", errorMessage(error), { position: "BOTTOM" });
    } finally {
      setSending(false);
    }
  };

  const roleSelector = () => {
    if (isTask) {
      return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: HomeColors.surfaceGrey, borderRadius: 14 }}>
          <Text style={{ color: HomeColors.textPrimary, fontSize: 14 }}>{task.title}</Text>
        </View>
      );
    }
    if (!roles.done) {
      return (
        <View style={{ paddingVertical: 12, alignItems: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    const list = roles.data ?? [];
    if (roles.error || list.length === 0) {
      return (
        <Text style={{ color: HomeColors.textSecondary }}>
          {roles.error ? errorMessage(roles.error) : "Este proyecto no tiene roles disponibles en este momento."}
        </Text>
      );
    }
    return (
      <View style={{ paddingHorizontal: 16, backgroundColor: HomeColors.surfaceGrey, borderRadius: 14 }}>
        <DropdownButton
          testID="role_dropdown"
          value={selectedRole?.id ?? null}
          hint="Selecciona un rol"
          hintStyle={{ color: HomeColors.textSecondary }}
          items={list.map((r) => ({ value: r.id, label: r.role }))}
          onChanged={(v) => setSelectedRole(list.find((r) => r.id === v) ?? null)}
        />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <CompactBackArrow />
        <View style={{ height: 16 }} />
        <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>Envía tu solicitud</Text>
        <View style={{ height: 20 }} />
        <Text style={{ fontWeight: "600", fontSize: 14, color: HomeColors.textPrimary }}>
          {isTask ? "Cuéntanos por qué quieres ayudar en esta tarea." : "Cuéntanos por qué quieres unirte al equipo."}
        </Text>
        <View style={{ height: 8 }} />
        <GreyTextField testID="request_message" value={message} onChangeText={setMessage} hint="Escribe tu mensaje..." maxLines={4} />
        <View style={{ height: 20 }} />
        <Text style={{ fontWeight: "600", fontSize: 14, color: HomeColors.textPrimary }}>
          {isTask ? "Tarea a la que te postulas" : "Rol al que aplicas"}
        </Text>
        <View style={{ height: 8 }} />
        {roleSelector()}
        {deadlineText != null ? (
          <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
            <MaterialIcon
              name={isOpen ? "calendar_month_outlined" : "event_busy_outlined"}
              size={16}
              color={isOpen ? HomeColors.primaryPurple : Palette.error}
            />
            <View style={{ width: 6 }} />
            <Text style={{ flex: 1, fontSize: 12.5, color: HomeColors.textSecondary }}>{deadlineText}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <PurpleWideButton testID="send_request" label="Enviar solicitud" onPress={sending || !isOpen ? null : () => void submit()} />
      </SafeAreaView>
    </View>
  );
}
