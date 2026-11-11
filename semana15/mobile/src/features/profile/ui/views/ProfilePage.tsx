// "Perfil" (Corrección 8): presentación completa del usuario.
// Encabezado (avatar, nombre, carrera, descripción, estado en la plataforma),
// Resumen de trayectoria, Desempeño, proyectos en los que ha participado y
// actividad reciente. Todos los números salen de Roble (ProfileController);
// si no hay datos para un indicador se dice, no se inventa.
import React, { useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames, ScreenName } from "@/src/core/navigation/routes";
import { Palette } from "@/src/core/theme/brand";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, InkWell, OutlinedButton, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { HomeBottomNavigation } from "@/src/features/home/ui/widgets/HomeBottomNavigation";

import { ProfileController } from "../viewmodels/profileController";
import { ActivityEntryTile } from "../widgets/ActivityEntryTile";
import { PerformanceBar } from "../widgets/PerformanceBar";
import { ProfileAvatar } from "../widgets/ProfileAvatar";
import { ProfileLabels } from "../widgets/profileLabels";
import { ProfileMenuTile } from "../widgets/ProfileMenuTile";
import { TrajectoryStatsGrid } from "../widgets/TrajectoryStatsGrid";

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
      <Text style={{ flex: 1, fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14.5 }}>{title}</Text>
      {action && onAction ? <TextButton label={action} onPress={onAction} /> : null}
    </View>
  );
}

export function ProfilePage() {
  const controller = useFind<ProfileController>(TOKENS.ProfileController);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void controller.loadMine();
  }, [controller]);

  const go = async (screen: ScreenName) => {
    await Nav.to(screen);
    void controller.loadMine();
  };

  const profile = controller.profile.value;
  const summary = controller.summary.value;
  const loading = controller.isLoading.value && profile == null;
  const me = controller.session.loggedUser;
  const recent = controller.activity.value.slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          testID="profile_scroll"
          contentContainerStyle={{ paddingLeft: 20, paddingTop: 16, paddingRight: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              colors={[HomeColors.primaryPurple]}
              onRefresh={async () => {
                setRefreshing(true);
                await controller.loadMine();
                setRefreshing(false);
              }}
            />
          }
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", color: HomeColors.textPrimary }}>Perfil</Text>
          <View style={{ height: 14 }} />
          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <CircularProgressIndicator />
            </View>
          ) : (
            <>
              {/* 8.1 Perfil principal */}
              <View style={{ alignItems: "center" }}>
                <ProfileAvatar name={profile?.name ?? ""} iconKey={profile?.avatarIcon} size={84} />
                <View style={{ height: 10 }} />
                <Text testID="profile_name" style={{ fontSize: 19, fontWeight: "bold", color: HomeColors.textPrimary, textAlign: "center" }}>
                  {profile?.name ?? ""}
                </Text>
                {(profile?.career ?? "") !== "" ? (
                  <Text style={{ marginTop: 2, fontSize: 13.5, color: HomeColors.textSecondary, textAlign: "center" }}>{profile!.career}</Text>
                ) : null}
                {(profile?.bio ?? "") !== "" ? (
                  <Text style={{ marginTop: 8, fontSize: 13.5, color: HomeColors.textPrimary, textAlign: "center", lineHeight: 13.5 * 1.4 }}>
                    {profile!.bio}
                  </Text>
                ) : null}
                <View style={{ height: 10 }} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: HomeColors.navSelectedBackground, flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcon name="person_outline" size={14} color={HomeColors.primaryPurple} />
                    <View style={{ width: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: HomeColors.primaryPurple }}>{controller.roleLabel}</Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: Palette.limeTint, flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcon name="bar_chart_rounded" size={14} color={Palette.primary} />
                    <View style={{ width: 4 }} />
                    <Text style={{ fontSize: 12, fontWeight: "600", color: Palette.primary }}>
                      {`Compromiso: ${ProfileLabels.commitment(summary.commitment)}`}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: Palette.cyanTint }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: Palette.primary }}>
                      {`Activo en ${summary.activeProjects} ${summary.activeProjects === 1 ? "proyecto" : "proyectos"}`}
                    </Text>
                  </View>
                </View>
                <View style={{ height: 12 }} />
                <OutlinedButton
                  testID="edit_profile_button"
                  label="Editar perfil"
                  icon={<MaterialIcon name="edit_outlined" size={16} color={HomeColors.primaryPurple} />}
                  onPress={() => void go("EditProfile")}
                  foregroundColor={HomeColors.primaryPurple}
                  borderColor={HomeColors.primaryPurple}
                  height={36}
                  paddingHorizontal={18}
                />
              </View>
              {controller.loadError.value !== "" ? (
                <Text style={{ paddingTop: 10, color: Palette.error, fontSize: 14, textAlign: "center" }}>{controller.loadError.value}</Text>
              ) : null}

              {/* 8.2 Resumen de trayectoria */}
              <View style={{ height: 22 }} />
              <SectionHeader title="Resumen de trayectoria" action="Ver más >" onAction={() => void Nav.to("Trajectory")} />
              <TrajectoryStatsGrid summary={summary} />

              {/* 8.3 Desempeño */}
              <View style={{ height: 18 }} />
              <SectionHeader title="Desempeño" />
              <PerformanceBar testID="perf_collaboration" label="Colaboración" value={summary.collaborationOrNull} />
              <PerformanceBar testID="perf_fulfillment" label="Cumplimiento" value={summary.fulfillmentOrNull} />
              <PerformanceBar testID="perf_quality" label="Calidad de aportes" value={summary.qualityOrNull} />

              {/* 8.4 Proyectos en los que ha participado */}
              <View style={{ height: 6 }} />
              <InkWell
                testID="my_participations"
                onPress={me ? () => void Nav.to("UserParticipations", { userId: me.userId, name: profile?.name ?? me.name }) : undefined}
                borderRadius={12}
                style={{ paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: HomeColors.primaryPurple }}>
                  {`Proyectos en los que he participado (${summary.participations}) >`}
                </Text>
              </InkWell>

              {/* 8.5 Actividad reciente */}
              <View style={{ height: 10 }} />
              <SectionHeader title="Actividad reciente" action={recent.length > 0 ? "Ver todo" : undefined} onAction={() => void Nav.to("ActivityHistory")} />
              {recent.length === 0 ? (
                <Text style={{ paddingVertical: 10, color: HomeColors.textSecondary, fontSize: 13.5 }}>
                  Todavía no hay actividad. Publica un proyecto o únete a uno para empezar tu trayectoria.
                </Text>
              ) : (
                recent.map((entry, i) => (
                  <ActivityEntryTile
                    key={`${entry.kind}-${entry.projectId}-${i}`}
                    entry={entry}
                    self
                    onTap={
                      entry.projectId
                        ? async () => {
                            const project = await controller.projects.getById(entry.projectId, { viewerId: me?.userId });
                            if (project != null) await Nav.to("ProjectDetail", { project });
                          }
                        : null
                    }
                  />
                ))
              )}

              {/* Accesos que ya existían */}
              <View style={{ height: 18 }} />
              <ProfileMenuTile icon="folder_open_outlined" title="Mis proyectos" onTap={() => Nav.toNamed(RouteNames.myProjects)} />
              <ProfileMenuTile icon="lightbulb_outline" title="Mis ideas" onTap={() => void go("MyIdeas")} />
              <ProfileMenuTile icon="history" title="Historial de actividad" onTap={() => void Nav.to("ActivityHistory")} />
              <ProfileMenuTile icon="chat_bubble_outline" title="Mensajes" onTap={() => void Nav.to("Messages")} />
              <ProfileMenuTile icon="settings_outlined" title="Configuración" onTap={() => void go("Settings")} />
              <ProfileMenuTile icon="notifications_none" title="Notificaciones" onTap={() => void go("NotificationSettings")} />
              <ProfileMenuTile icon="lock_outline" title="Privacidad" onTap={() => void go("Privacy")} />
              <ProfileMenuTile icon="logout" title="Cerrar sesión" destructive testID="profile_logout" onTap={() => void Nav.to("Logout")} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
      <HomeBottomNavigation currentIndex={3} />
    </View>
  );
}
