// Equivalente de projects/ui/views/my_projects_page.dart: proyectos
// publicados y borradores, con editar y eliminar.
import React, { useEffect, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AlertDialog, CircularProgressIndicator, InkWell, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { Overlay, snackbar } from "@/src/core/ui/overlay";
import { HomeBottomNavigation } from "@/src/features/home/ui/widgets/HomeBottomNavigation";

import { MyProject } from "../../domain/models/myProject";
import { MyProjectsController } from "../viewmodels/myProjectsController";
import { MyProjectCard } from "../widgets/MyProjectCard";
import { MyProjectPlaceholderCard } from "../widgets/MyProjectPlaceholderCard";
import { MyProjectsTabs } from "../widgets/MyProjectsTabs";
import { Palette } from "@/src/core/theme/brand";

export function MyProjectsPage() {
  const controller = useFind<MyProjectsController>(TOKENS.MyProjectsController);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void controller.getMyProjects();
  }, [controller]);

  const confirmDelete = async (item: MyProject) => {
    const confirm = await Overlay.dialog<boolean>(() => (
      <AlertDialog
        title={item.isDraft ? "¿Eliminar borrador?" : "¿Eliminar proyecto?"}
        content={
          item.isDraft
            ? `Se eliminará "${item.name}" y sus tareas. Esta acción no se puede deshacer.`
            : `"${item.name}" dejará de aparecer en Mis proyectos y en Explorar, y nadie podrá postularse ni comentar. ` +
              "Las solicitudes, comentarios e integrantes se conservan como historial. Esta acción no se puede deshacer desde la app."
        }
        actions={
          <>
            <TextButton label="Cancelar" onPress={() => Nav.back(false)} />
            <TextButton testID="confirm_delete_project" label="Eliminar" onPress={() => Nav.back(true)} foregroundColor={Palette.error} />
          </>
        }
      />
    ));
    if (confirm !== true) return;
    if (await controller.deleteProject(item.id)) {
      snackbar(
        item.isDraft ? "Borrador eliminado" : "Proyecto eliminado",
        item.isDraft ? `"${item.name}" ya no está en tus borradores.` : `"${item.name}" ya no aparece en Mis proyectos ni en Explorar.`,
        { position: "BOTTOM" },
      );
    }
  };

  const renderBody = () => {
    if (controller.isLoading.value) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    const items = controller.visibleProjects;
    if (items.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: HomeColors.textSecondary }}>
            {controller.showingDrafts.value ? "Todavía no tienes borradores." : "Todavía no has creado proyectos."}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[HomeColors.primaryPurple]}
            onRefresh={async () => {
              setRefreshing(true);
              await controller.getMyProjects();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => {
          if (item.isPlaceholder) return <MyProjectPlaceholderCard />;
          const isUserProject = controller.isUserProject(item.id);
          return (
            <MyProjectCard
              project={item}
              onTap={async () => {
                if (!isUserProject) return;
                const project = controller.userProject(item.id);
                if (project == null) return;
                if (project.isDraft) {
                  await Nav.to("CreateProject", { editProjectId: project.id });
                } else {
                  await Nav.to("ProjectDetail", { project });
                }
                void controller.getMyProjects();
              }}
              onEdit={
                isUserProject
                  ? async () => {
                      await Nav.to("CreateProject", { editProjectId: item.id });
                      void controller.getMyProjects();
                    }
                  : null
              }
              onDelete={isUserProject ? () => void confirmDelete(item) : null}
            />
          );
        }}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View style={{ paddingLeft: 20, paddingTop: 20, paddingRight: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: HomeColors.textPrimary }}>Mis proyectos</Text>
            <InkWell
              circle
              accessibilityLabel="Crear proyecto"
              testID="my_projects_add"
              onPress={() => void Nav.to("CreateProject")}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: HomeColors.circlePurple, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcon name="add" color={Colors.white} size={22} />
            </InkWell>
          </View>
          <View style={{ height: 4 }} />
          <Text style={{ fontSize: 14.5, color: HomeColors.textSecondary }}>Proyectos que creas</Text>
          <View style={{ height: 18 }} />
          <MyProjectsTabs
            publishedCount={controller.publishedProjects.length}
            draftsCount={controller.draftProjects.length}
            showingDrafts={controller.showingDrafts.value}
            onSelectPublished={() => controller.showPublished()}
            onSelectDrafts={() => controller.showDrafts()}
          />
          <View style={{ height: 16 }} />
        </View>
        <View style={{ flex: 1 }}>{renderBody()}</View>
      </SafeAreaView>
      <HomeBottomNavigation currentIndex={1} />
    </View>
  );
}
