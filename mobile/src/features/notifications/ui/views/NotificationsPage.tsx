// "Notificaciones" (Corrección 6): encabezado con regresar y gestionar
// lectura, búsqueda, pestañas Todas / No leídas, botón de filtros que
// despliega los filtros rápidos (usuarios, mensajes, recordatorios, tareas,
// completadas) y la lista en tarjetas. Todo sale del mismo
// NotificationsController que ya existía (no hay un sistema paralelo).
import React, { useEffect, useState } from "react";
import { FlatList, Platform, RefreshControl, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { Palette } from "@/src/core/theme/brand";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, InkWell, M3Switch } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { PopupMenuButton } from "@/src/core/ui/popupMenu";
import { HomeBottomNavigation } from "@/src/features/home/ui/widgets/HomeBottomNavigation";
import { CompactBackArrow } from "@/src/features/projects/ui/widgets/wizardBits";

import { AppNotification, AppNotificationType } from "../../domain/models/appNotification";
import { NotificationsController, QUICK_FILTERS, QuickFilter } from "../viewmodels/notificationsController";
import { NotificationTile } from "../widgets/NotificationTile";

const QUICK_FILTER_UI: Record<QuickFilter, { icon: IconName; label: string }> = {
  [QuickFilter.users]: { icon: "person_outline", label: "Usuarios" },
  [QuickFilter.messages]: { icon: "mail_outline", label: "Mensajes y comentarios" },
  [QuickFilter.reminders]: { icon: "alarm", label: "Recordatorios" },
  [QuickFilter.tasks]: { icon: "check_box_outlined", label: "Tareas" },
  [QuickFilter.completed]: { icon: "check_circle_outline", label: "Completadas" },
};

function TabPill({
  label,
  count,
  selected,
  onPress,
  testID,
}: {
  label: string;
  count: number;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <InkWell
        testID={testID}
        onPress={onPress}
        borderRadius={8}
        accessibilityLabel={`${label}: ${count}`}
        accessibilityState={{ selected }}
        style={{
          backgroundColor: selected ? Palette.primary : HomeColors.flowTabGrey,
          borderRadius: 8,
          height: 40,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 14, color: selected ? Colors.white : HomeColors.flowTabText }}>{label}</Text>
        <View
          style={{
            marginLeft: 6,
            minWidth: 20,
            height: 18,
            paddingHorizontal: 5,
            borderRadius: 9,
            backgroundColor: selected ? Palette.accent : HomeColors.placeholderGrey,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: Palette.primary }}>{count > 99 ? "99+" : count}</Text>
        </View>
      </InkWell>
    </View>
  );
}

function QuickFilterBar({ controller }: { controller: NotificationsController }) {
  return (
    <View
      testID="notification_quick_filters"
      style={{
        marginTop: 10,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      {QUICK_FILTERS.map((filter) => {
        const ui = QUICK_FILTER_UI[filter];
        const on = controller.isQuickFilterOn(filter);
        return (
          <View key={filter} accessibilityLabel={ui.label} style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcon name={ui.icon} size={18} color={HomeColors.primaryPurple} />
            <View testID={`quick_filter_${filter}`} style={{ width: 42, height: 40, alignItems: "center", justifyContent: "center" }}>
              <View style={{ transform: [{ scale: 0.68 }] }}>
                <M3Switch value={on} activeColor={HomeColors.primaryPurple} onChange={(v) => controller.toggleQuickFilter(filter, v)} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function NotificationsPage() {
  const controller = useFind<NotificationsController>(TOKENS.NotificationsController);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(controller.filters.value.size > 0);

  useEffect(() => {
    void controller.load();
  }, [controller]);

  const open = async (notification: AppNotification) => {
    await controller.markRead(notification);
    const type = notification.type;
    if (AppNotificationType.decidable.has(type)) {
      await Nav.to("RequestNotification", { notification });
    } else if (notification.isResponse) {
      await Nav.to("RequestResult", { notification });
    } else if (type === AppNotificationType.commentReply && notification.projectId !== "") {
      const project = await controller.projectById(notification.projectId);
      if (project != null) await Nav.to("ProjectComments", { projectId: project.id, projectName: project.name });
      else snackbar("Comentarios", "Ese proyecto ya no está disponible.", { position: "BOTTOM" });
    } else if (type === AppNotificationType.newComment || type === AppNotificationType.taskCompleted) {
      await Nav.to("ActivityNotification", { notification });
    } else if (type === AppNotificationType.newMessage && (notification.actorUserId ?? "") !== "") {
      await Nav.to("Chat", { otherUserId: notification.actorUserId!, otherName: notification.actorName ?? "Usuario" });
    } else {
      const project = await controller.projectById(notification.projectId);
      if (project != null) await Nav.to("ProjectDetail", { project });
    }
    void controller.load();
  };

  const markAll = async () => {
    const count = await controller.markAllRead();
    snackbar(
      "Notificaciones",
      count === 0 ? "No tienes notificaciones sin leer." : count === 1 ? "1 notificación marcada como leída." : `${count} notificaciones marcadas como leídas.`,
      { position: "BOTTOM" },
    );
  };

  const filtersActive = controller.filters.value.size > 0;
  const total = controller.visibleIgnoringReadState.length;
  const unread = controller.visibleIgnoringReadState.filter((n) => !n.read).length;

  const list = () => {
    if (controller.isLoading.value && controller.visible.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    const items = controller.visible;
    if (items.length === 0) {
      const error = controller.loadError.value;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <MaterialIcon name="notifications_none" size={40} color={HomeColors.placeholderGrey} />
          <View style={{ height: 10 }} />
          <Text style={{ textAlign: "center", color: HomeColors.textSecondary }}>
            {error !== ""
              ? error
              : controller.search.value.trim() !== ""
                ? "Ninguna notificación coincide con tu búsqueda."
                : filtersActive
                  ? "No hay notificaciones con estos filtros."
                  : controller.unreadOnly.value
                    ? "No tienes notificaciones sin leer."
                    : "Todavía no tienes notificaciones."}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        testID="notifications_list"
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[HomeColors.primaryPurple]}
            onRefresh={async () => {
              setRefreshing(true);
              await controller.load();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => <NotificationTile notification={item} onTap={() => void open(item)} />}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20 }} edges={["top", "left", "right"]}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <CompactBackArrow onPress={() => Nav.offNamed(RouteNames.home)} />
          <View style={{ width: 14 }} />
          <Text style={{ flex: 1, fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>Notificaciones</Text>
          <PopupMenuButton<"read" | "requests">
            testID="notifications_manage"
            icon="inbox_outlined"
            tooltip="Gestionar notificaciones"
            color={HomeColors.primaryPurple}
            items={[
              { value: "read", label: "Marcar todas como leídas" },
              { value: "requests", label: "Ver solicitudes recibidas" },
            ]}
            onSelected={async (value) => {
              if (value === "read") {
                await markAll();
              } else {
                await Nav.to("Requests");
                void controller.load();
              }
            }}
          />
        </View>
        <View style={{ height: 12 }} />
        <View style={{ backgroundColor: HomeColors.flowSearchFill, borderRadius: 10, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 44, alignItems: "center" }}>
            <MaterialIcon name="search_rounded" color={HomeColors.flowSearchHint} />
          </View>
          <TextInput
            testID="notification_search"
            defaultValue={controller.search.value}
            onChangeText={(v) => (controller.search.value = v)}
            placeholder="Buscar notificaciones..."
            placeholderTextColor={HomeColors.flowSearchHint}
            style={{
              flex: 1,
              fontSize: 15,
              color: Palette.textPrimary,
              paddingVertical: 13,
              paddingRight: 12,
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
        </View>
        <View style={{ height: 12 }} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TabPill testID="tab_all" label="Todas" count={total} selected={!controller.unreadOnly.value} onPress={() => controller.showAll()} />
          <TabPill testID="tab_unread" label="No leídas" count={unread} selected={controller.unreadOnly.value} onPress={() => controller.showUnread()} />
          <View>
            <InkWell
              testID="toggle_filters"
              accessibilityLabel={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
              accessibilityState={{ expanded: showFilters }}
              onPress={() => setShowFilters((v) => !v)}
              borderRadius={8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                backgroundColor: showFilters || filtersActive ? HomeColors.circlePurple : HomeColors.flowTabGrey,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcon name="tune_rounded" color={showFilters || filtersActive ? Colors.white : HomeColors.primaryPurple} />
            </InkWell>
            {filtersActive && !showFilters ? (
              <View style={{ position: "absolute", top: -3, right: -3, width: 10, height: 10, borderRadius: 5, backgroundColor: Palette.accent, borderWidth: 1.5, borderColor: Palette.primary }} />
            ) : null}
          </View>
        </View>
        {showFilters ? <QuickFilterBar controller={controller} /> : null}
        <View style={{ height: 12 }} />
        <View style={{ flex: 1 }}>{list()}</View>
      </SafeAreaView>
      <HomeBottomNavigation currentIndex={2} />
    </View>
  );
}
