// Equivalente de notifications/ui/views/notification_filters_page.dart.
// Se edita una copia y solo cambia la lista al tocar "Aplicar filtros".
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { FilledButton, IconButton, M3Switch, OutlinedButton } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { NOTIFICATION_CATEGORY_VALUES, NotificationCategory } from "../../domain/models/notificationCategory";
import { NotificationsController } from "../viewmodels/notificationsController";
import { NotificationLabels } from "../widgets/notificationLabels";

function ToggleRow({ icon, title, value, onChanged }: { icon: IconName; title: string; value: boolean; onChanged: (on: boolean) => void }) {
  return (
    <View style={{ paddingVertical: 4, flexDirection: "row", alignItems: "center" }}>
      <MaterialIcon name={icon} color={HomeColors.primaryPurple} size={22} />
      <View style={{ width: 14 }} />
      <Text style={{ flex: 1, fontSize: 14.5, color: HomeColors.textPrimary }}>{title}</Text>
      <M3Switch value={value} activeColor={HomeColors.primaryPurple} onChange={onChanged} />
    </View>
  );
}

export function NotificationFiltersPage() {
  const di = useDI();
  const [controller] = useState(() => di.resolve<NotificationsController>(TOKENS.NotificationsController));
  const [draft, setDraft] = useState<Set<NotificationCategory>>(() => new Set(controller.filters.value));

  const toggle = (category: NotificationCategory, on: boolean) => {
    const next = new Set(draft);
    if (on) next.add(category);
    else next.delete(category);
    setDraft(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingLeft: 20, paddingTop: 12, paddingRight: 8, paddingBottom: 4, flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "bold", color: HomeColors.textPrimary }}>Filtrar notificaciones</Text>
          <IconButton icon="close" tooltip="Cerrar" onPress={() => Nav.back()} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 8 }}>
          <ToggleRow
            icon="radio_button_unchecked"
            title="Todas"
            value={draft.size === 0}
            onChanged={(on) => {
              if (on) setDraft(new Set());
            }}
          />
          {NOTIFICATION_CATEGORY_VALUES.map((category) => (
            <ToggleRow
              key={category}
              icon={NotificationLabels.categoryIcon(category)}
              title={NotificationLabels.category(category)}
              value={draft.has(category)}
              onChanged={(on) => toggle(category, on)}
            />
          ))}
        </ScrollView>
        <View style={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20, paddingBottom: 16 }}>
          <FilledButton
            label="Aplicar filtros"
            onPress={() => {
              controller.applyFilters(draft);
              Nav.back();
            }}
            backgroundColor={HomeColors.primaryPurple}
            borderRadius={10}
            height={50}
            style={{ height: 50 }}
            textStyle={{ fontWeight: "700" }}
          />
          <View style={{ height: 10 }} />
          <OutlinedButton
            label="Limpiar filtros"
            onPress={() => setDraft(new Set())}
            foregroundColor={HomeColors.primaryPurple}
            backgroundColor={HomeColors.flowLavenderFaint}
            borderColor={HomeColors.flowBorder}
            borderRadius={10}
            height={50}
            style={{ height: 50 }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
