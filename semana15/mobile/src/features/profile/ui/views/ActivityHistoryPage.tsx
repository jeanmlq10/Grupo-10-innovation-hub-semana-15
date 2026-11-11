// Equivalente de profile/ui/views/activity_history_page.dart (Página 5.2).
import React, { useState } from "react";
import { FlatList, Text, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { M3 } from "@/src/core/theme/appTheme";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, Divider, InkWell } from "@/src/core/ui/material";
import { snackbar } from "@/src/core/ui/overlay";

import { ActivityEntry, ActivityKind } from "../../domain/models/activityEntry";
import { ProfileController } from "../viewmodels/profileController";
import { ActivityEntryTile } from "../widgets/ActivityEntryTile";

const TABS: [string, Set<ActivityKind> | null][] = [
  ["Todos", null],
  ["Publicaciones", new Set([ActivityKind.publication])],
  ["Participaciones", new Set([ActivityKind.participation, ActivityKind.taskAssignment])],
  ["Comentarios", new Set([ActivityKind.comment])],
  ["Favoritos", new Set<ActivityKind>()],
  ["Seguidos", new Set([ActivityKind.follow])],
];

/** `ChoiceChip` de Material 3 sin marca de verificación. */
function ChoiceChip({ label, selected, onSelected }: { label: string; selected: boolean; onSelected: () => void }) {
  return (
    <InkWell
      onPress={onSelected}
      borderRadius={8}
      accessibilityLabel={label}
      style={{
        height: 32,
        borderRadius: 8,
        paddingHorizontal: 15,
        justifyContent: "center",
        backgroundColor: selected ? HomeColors.flowLavender : "transparent",
        borderWidth: 1,
        borderColor: selected ? "transparent" : M3.outlineVariant,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color: selected ? HomeColors.primaryPurple : HomeColors.textSecondary }}>{label}</Text>
    </InkWell>
  );
}

export function ActivityHistoryPage() {
  const controller = useFind<ProfileController>(TOKENS.ProfileController);
  const [selectedLabel, setSelectedLabel] = useState("Todos");
  const [kinds, setKinds] = useState<Set<ActivityKind> | null>(null);

  const openProject = async (entry: ActivityEntry) => {
    const project = await controller.projects.getById(entry.projectId, { viewerId: controller.session.loggedUser?.userId });
    if (project == null) {
      snackbar("Historial", "Ese proyecto ya no está disponible.");
      return;
    }
    void Nav.to("ProjectDetail", { project });
  };

  const entries = kinds == null ? controller.activity.value : controller.activity.value.filter((e) => kinds.has(e.kind));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Historial de actividad" titleStyle={{ fontWeight: "bold" }} />
      <View style={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20, paddingBottom: 8, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {TABS.map(([labelText, set]) => (
          <ChoiceChip
            key={labelText}
            label={labelText}
            selected={selectedLabel === labelText}
            onSelected={() => {
              setSelectedLabel(labelText);
              setKinds(set);
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1 }}>
        {entries.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: HomeColors.textSecondary }}>
              {selectedLabel === "Favoritos" ? "Todavía no tienes favoritos." : "Todavía no hay actividad aquí."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}
            ItemSeparatorComponent={() => <Divider height={1} />}
            renderItem={({ item }) => <ActivityEntryTile entry={item} self onTap={() => void openProject(item)} />}
          />
        )}
      </View>
    </View>
  );
}
