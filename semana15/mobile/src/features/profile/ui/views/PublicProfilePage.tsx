// Perfil de otra persona (Corrección 8.6): avatar, nombre, carrera, proyectos
// activos y publicaciones centrados; "Enviar mensaje" abre el chat interno
// (Corrección 9.1). Respeta la privacidad del perfil: si es privado no se
// muestran trayectoria, actividad ni contadores.
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { M3 } from "@/src/core/theme/appTheme";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, CircularProgressIndicator, OutlinedButton, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { errorMessage } from "@/src/core/utils/errorMessage";

import { PublicProfile } from "../../domain/models/publicProfile";
import { ProfileController } from "../viewmodels/profileController";
import { ActivityEntryTile } from "../widgets/ActivityEntryTile";
import { PerformanceBar } from "../widgets/PerformanceBar";
import { ProfileAvatar } from "../widgets/ProfileAvatar";
import { TrajectoryStatsGrid } from "../widgets/TrajectoryStatsGrid";

export function PublicProfilePage({ args }: { args: ScreenParams["PublicProfile"] }) {
  const { userId, name } = args;
  const controller = useDI().resolve<ProfileController>(TOKENS.ProfileController);
  const [state, setState] = useState<{ done: boolean; data?: PublicProfile; error?: unknown }>({ done: false });

  useEffect(() => {
    let active = true;
    controller
      .publicProfile(userId, { fallbackName: name })
      .then((data) => active && setState({ done: true, data }))
      .catch((error) => active && setState({ done: true, error }));
    return () => {
      active = false;
    };
  }, [controller, userId, name]);

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
    const data = state.data!;
    const p = data.profile;
    const isMe = userId === controller.session.loggedUser?.userId;
    const bold = { fontWeight: "bold" as const, color: M3.onSurface, fontSize: 14 };
    return (
      <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 24 }}>
        <View style={{ alignItems: "center" }}>
          <ProfileAvatar name={p.name} iconKey={p.avatarIcon} size={80} />
        </View>
        <View style={{ height: 10 }} />
        <Text style={{ textAlign: "center", fontSize: 19, fontWeight: "bold", color: HomeColors.textPrimary }}>{p.name}</Text>
        {p.career !== "" ? <Text style={{ textAlign: "center", color: HomeColors.textSecondary, fontSize: 14 }}>{p.career}</Text> : null}
        {data.canSeeDetails && data.summary ? (
          <Text testID="public_profile_stats" style={{ marginTop: 2, textAlign: "center", color: HomeColors.textSecondary, fontSize: 13.5 }}>
            {`Activo en ${data.summary.activeProjects} ${data.summary.activeProjects === 1 ? "proyecto" : "proyectos"} | ${data.summary.publications} ${
              data.summary.publications === 1 ? "publicación" : "publicaciones"
            }`}
          </Text>
        ) : null}
        {p.bio !== "" && data.canSeeDetails ? (
          <Text style={{ marginTop: 10, textAlign: "center", color: HomeColors.textPrimary, fontSize: 14 }}>{p.bio}</Text>
        ) : null}
        <View style={{ height: 14 }} />
        {!isMe && p.acceptsMessages ? (
          <View style={{ alignItems: "center" }}>
            <OutlinedButton
              testID="send_message_button"
              label="ENVIAR MENSAJE"
              icon={<MaterialIcon name="chat_bubble_outline" size={18} color={HomeColors.primaryPurple} />}
              onPress={() => void Nav.to("Chat", { otherUserId: userId, otherName: p.name })}
              foregroundColor={HomeColors.primaryPurple}
              borderColor={HomeColors.primaryPurple}
              borderRadius={22}
              paddingHorizontal={20}
            />
          </View>
        ) : null}
        <View style={{ height: 18 }} />
        {!data.canSeeDetails ? (
          <Text style={{ paddingVertical: 30, textAlign: "center", color: HomeColors.textSecondary, fontSize: 14 }}>
            Este perfil es privado: su trayectoria y actividad no son visibles.
          </Text>
        ) : (
          <>
            <Text style={bold}>Resumen de trayectoria</Text>
            <View style={{ height: 10 }} />
            <TrajectoryStatsGrid summary={data.summary!} />
            <View style={{ height: 16 }} />
            <Text style={bold}>Desempeño</Text>
            <PerformanceBar label="Colaboración" value={data.summary!.collaborationOrNull} />
            <PerformanceBar label="Cumplimiento" value={data.summary!.fulfillmentOrNull} />
            <PerformanceBar label="Calidad de aportes" value={data.summary!.qualityOrNull} />
            <View style={{ height: 10 }} />
            <View style={{ alignItems: "center" }}>
              <TextButton label="Proyectos en los que ha participado >" onPress={() => void Nav.to("UserParticipations", { userId, name: p.name })} />
            </View>
            <View style={{ height: 6 }} />
            <Text style={bold}>Actividad reciente</Text>
            {data.activity.length === 0 ? (
              <Text style={{ paddingVertical: 16, color: HomeColors.textSecondary, fontSize: 14 }}>Todavía no hay actividad.</Text>
            ) : null}
            {data.activity.slice(0, 10).map((entry, i) => (
              <ActivityEntryTile key={i} entry={entry} self={isMe} />
            ))}
          </>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Perfil" titleStyle={{ fontWeight: "bold" }} />
      {body()}
    </View>
  );
}
