// Equivalente de projects/ui/views/home_page.dart: "Explorar proyectos".
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, FilledButton, InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { requireSession } from "@/src/features/auth/ui/widgets/loginRequiredDialog";
import { HomeBottomNavigation } from "@/src/features/home/ui/widgets/HomeBottomNavigation";

import { Project } from "../../domain/models/project";
import { HomeController } from "../viewmodels/homeController";
import { ActiveFiltersBar } from "../widgets/ActiveFiltersBar";
import { CreateIdeaCard } from "../widgets/CreateIdeaCard";
import { ExploreFilterLabels } from "../widgets/exploreFilterLabels";
import { ExploreFilterTabs } from "../widgets/ExploreFilterTabs";
import { ProjectCard } from "../widgets/ProjectCard";
import { ProjectSearchBar } from "../widgets/ProjectSearchBar";

function CircleAction({ icon, label, onTap }: { icon: "tune_rounded" | "login_rounded" | "logout"; label: string; onTap: () => void }) {
  return (
    <InkWell
      circle
      accessibilityLabel={label}
      onPress={onTap}
      style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: HomeColors.flowLavender, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialIcon name={icon} color={HomeColors.flowAccent} size={21} />
    </InkWell>
  );
}

/** Estado de error de Explorar: no se pudo cargar desde Roble. */
function LoadErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
      <MaterialIcon name="wifi_off_rounded" size={46} color={HomeColors.flowEmpty} />
      <View style={{ height: 12 }} />
      <Text style={{ textAlign: "center", fontSize: 14, color: HomeColors.flowSlate }}>{message}</Text>
      <View style={{ height: 16 }} />
      <FilledButton
        onPress={onRetry}
        label="Reintentar"
        icon={<MaterialIcon name="refresh_rounded" size={18} color={Colors.white} />}
        backgroundColor={HomeColors.flowPurple}
        foregroundColor={Colors.white}
        paddingHorizontal={16}
      />
    </View>
  );
}

export function HomePage() {
  const controller = useFind<HomeController>(TOKENS.HomeController);
  const auth = useFind<AuthenticationController>(TOKENS.AuthenticationController);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // addPostFrameCallback → getProjects()
    void controller.getProjects();
  }, [controller]);

  const active = controller.filters.value.activeCount;
  const user = auth.loggedUser;
  const labels = ExploreFilterLabels.activeChips(controller.filters.value);

  const renderBody = () => {
    if (controller.isLoading.value) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    const projects = controller.filteredProjects;
    if (controller.loadError.value !== "" && controller.projects.length === 0) {
      return <LoadErrorView message={controller.loadError.value} onRetry={() => void controller.getProjects()} />;
    }
    const hasSearch = controller.searchQuery.value.trim() !== "";
    if (projects.length === 0 && hasSearch) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: HomeColors.flowEmpty }}>No encontramos proyectos con ese nombre.</Text>
        </View>
      );
    }
    const emptyMessage = !controller.filters.value.isEmpty
      ? "Ningún proyecto coincide con tus filtros."
      : controller.showingFollowed.value
        ? "Todavía no sigues ningún proyecto."
        : "Todavía no hay proyectos publicados. ¡Crea el primero!";

    type Item = { kind: "create" } | { kind: "empty" } | { kind: "project"; project: Project };
    const items: Item[] = [
      { kind: "create" },
      ...(projects.length === 0 ? [{ kind: "empty" } as Item] : projects.map((p) => ({ kind: "project", project: p }) as Item)),
    ];

    return (
      <FlatList
        data={items}
        keyExtractor={(item, i) => (item.kind === "project" ? item.project.id : `${item.kind}${i}`)}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[HomeColors.flowPurple]}
            tintColor={HomeColors.flowPurple}
            onRefresh={async () => {
              setRefreshing(true);
              await controller.getProjects();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => {
          if (item.kind === "create") return <CreateIdeaCard />;
          if (item.kind === "empty") {
            return (
              <View style={{ paddingTop: 34, alignItems: "center" }}>
                <Text style={{ textAlign: "center", fontSize: 13, color: HomeColors.flowEmpty }}>{emptyMessage}</Text>
              </View>
            );
          }
          return (
            <ProjectCard
              project={item.project}
              onTap={async () => {
                await Nav.to("ProjectDetail", { project: item.project });
                void controller.getProjects();
              }}
            />
          );
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View style={{ paddingLeft: 20, paddingTop: 22, paddingRight: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ flex: 1, fontSize: 23, fontWeight: "800", color: HomeColors.flowNavy, letterSpacing: -0.3 }}>
              Explorar proyectos
            </Text>
            <View style={{ paddingRight: 8 }}>
              <View>
                <CircleAction icon="tune_rounded" label="Filtros" onTap={() => void Nav.to("ExploreFilters")} />
                {active > 0 ? (
                  <View
                    style={{
                      position: "absolute",
                      top: -4,
                      left: 42 - 12,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      paddingHorizontal: 4,
                      backgroundColor: HomeColors.flowPurple,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: Colors.white, fontSize: 11, fontWeight: "500" }}>{active}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            {auth.isGuest ? (
              <CircleAction icon="login_rounded" label="Iniciar sesión" onTap={() => auth.leaveGuestMode()} />
            ) : (
              <CircleAction
                icon="logout"
                label={user == null ? "Cerrar sesión" : `Cerrar sesión\n${user.email}`}
                onTap={async () => {
                  await auth.logOut();
                  Nav.offAllNamed(RouteNames.central);
                }}
              />
            )}
          </View>
          <View style={{ height: 8 }} />
          {auth.loggedUser == null ? (
            auth.isGuest ? (
              <Text style={{ fontSize: 13, color: HomeColors.flowMeta }}>Modo visitante · solo puedes explorar</Text>
            ) : null
          ) : (
            <Text style={{ fontSize: 13, color: HomeColors.flowMeta }}>
              {auth.loggedUser.career
                ? `${auth.loggedUser.name} - ${auth.loggedUser.career}`
                : auth.loggedUser.email}
            </Text>
          )}
          <View style={{ height: 10 }} />
          <Text style={{ fontSize: 15.5, color: HomeColors.flowDescription, lineHeight: 15.5 * 1.35 }}>
            {"Descubre ideas y únete\na las que te inspiren"}
          </Text>
          <View style={{ height: 18 }} />
          <ExploreFilterTabs
            showingFollowed={controller.showingFollowed.value}
            onSelectAll={() => controller.showAll()}
            onSelectFollowed={() => {
              if (!requireSession()) return;
              controller.showFollowed();
            }}
          />
          <View style={{ height: 14 }} />
          <ProjectSearchBar onChanged={(v) => controller.updateSearch(v)} />
          {labels.length === 0 ? (
            <View style={{ height: 16 }} />
          ) : (
            <View style={{ paddingTop: 12, paddingBottom: 12 }}>
              <ActiveFiltersBar
                labels={labels}
                onOpenFilters={() => void Nav.to("ExploreFilters")}
                onClear={() => controller.clearFilters()}
              />
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>{renderBody()}</View>
      </SafeAreaView>
      <HomeBottomNavigation />
    </View>
  );
}
