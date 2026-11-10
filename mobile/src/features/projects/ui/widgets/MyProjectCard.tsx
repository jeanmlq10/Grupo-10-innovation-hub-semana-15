// Equivalente de projects/ui/widgets/my_project_card.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { PopupItem, PopupMenuButton } from "@/src/core/ui/popupMenu";

import { MyProject } from "../../domain/models/myProject";
import { ProjectAvatar } from "./ProjectAvatar";

type CardAction = "edit" | "delete";

function StatusChip({ status }: { status: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: HomeColors.navSelectedBackground,
        borderRadius: 20,
      }}
    >
      <Text style={{ fontSize: 12.5, fontWeight: "600", color: HomeColors.primaryPurple }}>{status}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: number | null; label: string }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 16, fontWeight: "bold", color: HomeColors.textPrimary }}>{`${value ?? 0}`}</Text>
      <View style={{ height: 2 }} />
      <Text style={{ fontSize: 12, color: HomeColors.textSecondary }}>{label}</Text>
    </View>
  );
}

export function MyProjectCard({
  project,
  onTap,
  onEdit,
  onDelete,
}: {
  project: MyProject;
  onTap?: () => void;
  onEdit?: (() => void) | null;
  onDelete?: (() => void) | null;
}) {
  const actions: PopupItem<CardAction>[] = [
    ...(onEdit ? [{ value: "edit" as const, label: "Editar proyecto" }] : []),
    ...(onDelete
      ? [{ value: "delete" as const, label: project.isDraft ? "Eliminar borrador" : "Eliminar proyecto", destructive: true }]
      : []),
  ];
  const hasStats = project.membersCount != null || project.tasksCount != null || project.requestsCount != null;
  return (
    <InkWell
      onPress={onTap}
      borderRadius={16}
      style={{ backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: HomeColors.borderGrey, padding: 16 }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <ProjectAvatar imageUrl={project.imageUrl} imageFileId={project.imageFileId} categories={project.categories} size={44} radius={12} />
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: HomeColors.textPrimary }}>{project.name}</Text>
          <View style={{ height: 4 }} />
          <Text style={{ fontSize: 13, color: HomeColors.textSecondary, lineHeight: 13 * 1.3 }}>{project.description}</Text>
        </View>
        {actions.length > 0 ? (
          <View style={{ marginTop: -10, marginRight: -12 }}>
            <PopupMenuButton<CardAction>
              testID={`my_project_actions_${project.id}`}
              tooltip="Acciones del proyecto"
              color={HomeColors.textSecondary}
              iconSize={22}
              items={actions}
              onSelected={(action) => (action === "edit" ? onEdit?.() : onDelete?.())}
            />
          </View>
        ) : null}
      </View>
      <View style={{ height: 12 }} />
      <StatusChip status={project.status} />
      {hasStats ? (
        <>
          <View style={{ height: 16 }} />
          <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
            <Stat value={project.membersCount} label="Miembros" />
            <Stat value={project.tasksCount} label="Tareas" />
            <Stat value={project.requestsCount} label="Solicitudes" />
          </View>
        </>
      ) : null}
    </InkWell>
  );
}
