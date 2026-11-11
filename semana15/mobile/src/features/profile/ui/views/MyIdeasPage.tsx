// Equivalente de profile/ui/views/my_ideas_page.dart: "Mis ideas".
import React, { useState } from "react";
import { FlatList, Text, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, IconButton, InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { Project } from "@/src/features/projects/domain/models/project";

import { ProfileController } from "../viewmodels/profileController";
import { Palette } from "@/src/core/theme/brand";

function IdeaCard({ project, onTap }: { project: Project; onTap: () => void }) {
  const date = project.createdAt;
  const draft = project.isDraft;
  return (
    <InkWell
      onPress={onTap}
      borderRadius={14}
      style={{ padding: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14, flexDirection: "row", alignItems: "center" }}
    >
      <View style={{ width: 52, height: 52, backgroundColor: HomeColors.surfaceGrey, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcon name="lightbulb_outline" color={HomeColors.textSecondary} />
      </View>
      <View style={{ width: 12 }} />
      <View style={{ flex: 1, alignItems: "flex-start" }}>
        <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>{project.name === "" ? "Borrador sin nombre" : project.name}</Text>
        <View style={{ height: 4 }} />
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: draft ? Palette.progressBackground : Palette.successBackground, borderRadius: 12 }}>
          <Text style={{ fontSize: 11.5, fontWeight: "600", color: draft ? Palette.progressForeground : Palette.successForeground }}>{draft ? "Borrador" : "Publicada"}</Text>
        </View>
        {date != null ? (
          <Text style={{ marginTop: 4, fontSize: 12, color: HomeColors.textSecondary }}>
            {draft ? `Creado: ${formatShortDate(date)}` : `Publicada: ${formatShortDate(date)}`}
          </Text>
        ) : null}
      </View>
      <MaterialIcon name="chevron_right" color={HomeColors.textSecondary} />
    </InkWell>
  );
}

export function MyIdeasPage() {
  const controller = useFind<ProfileController>(TOKENS.ProfileController);
  const [showDrafts, setShowDrafts] = useState(true);

  const open = async (project: Project) => {
    if (project.isDraft) await Nav.to("CreateProject", { editProjectId: project.id });
    else await Nav.to("ProjectDetail", { project });
    void controller.loadMine();
  };

  const all = controller.myProjects.value;
  const drafts = all.filter((p) => p.isDraft);
  const published = all.filter((p) => !p.isDraft);
  const list = showDrafts ? drafts : published;

  const tab = (label: string, selected: boolean, onTap: () => void) => (
    <View style={{ flex: 1 }}>
      <InkWell
        onPress={onTap}
        style={{ paddingVertical: 10, backgroundColor: selected ? HomeColors.flowLavender : "transparent", borderRadius: 8, alignItems: "center" }}
      >
        <Text style={{ fontWeight: "600", fontSize: 14, color: selected ? HomeColors.primaryPurple : HomeColors.textSecondary }}>{label}</Text>
      </InkWell>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar
        centerTitle
        title="Mis ideas"
        titleStyle={{ fontWeight: "bold" }}
        actions={
          <IconButton
            icon="add_circle"
            tooltip="Nueva idea"
            color={HomeColors.primaryPurple}
            size={30}
            onPress={async () => {
              await Nav.to("CreateProject");
              void controller.loadMine();
            }}
          />
        }
      />
      <View style={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20, paddingBottom: 8, flexDirection: "row" }}>
        {tab(`Borradores (${drafts.length})`, showDrafts, () => setShowDrafts(true))}
        <View style={{ width: 8 }} />
        {tab(`Publicadas (${published.length})`, !showDrafts, () => setShowDrafts(false))}
      </View>
      <View style={{ flex: 1 }}>
        {list.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: HomeColors.textSecondary }}>{showDrafts ? "No tienes borradores." : "Todavía no has publicado ideas."}</Text>
          </View>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20, paddingBottom: 20 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => <IdeaCard project={item} onTap={() => void open(item)} />}
          />
        )}
      </View>
    </View>
  );
}
