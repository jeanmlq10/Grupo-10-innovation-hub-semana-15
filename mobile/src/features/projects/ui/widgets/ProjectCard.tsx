// Equivalente de projects/ui/widgets/project_card.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { DashedBorder } from "@/src/core/widgets/DashedBorder";

import { Project } from "../../domain/models/project";
import { CATEGORY_ICONS, ProjectAvatar } from "./ProjectAvatar";


function CategoryChip({ label, icon }: { label: string; icon: IconName }) {
  return (
    <DashedBorder color={Colors.black87} strokeWidth={1.2} gap={3} radius={20} dotted>
      <View style={{ paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center" }}>
        <MaterialIcon name={icon} size={14} color={HomeColors.textPrimary} />
        <View style={{ width: 6 }} />
        <Text style={{ fontSize: 12, color: HomeColors.textPrimary }}>{label}</Text>
      </View>
    </DashedBorder>
  );
}

/** Card for a single [Project] in the "Explorar proyectos" feed. */
export function ProjectCard({ project, onTap }: { project: Project; onTap?: () => void }) {
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
          <Text style={{ fontSize: 17, fontWeight: "bold", color: HomeColors.textPrimary }}>
            {project.name === "" ? "(Sin nombre)" : project.name}
          </Text>
          <View style={{ height: 6 }} />
          <Text style={{ fontSize: 13.5, color: HomeColors.textPrimary, lineHeight: 13.5 * 1.3 }}>
            {project.description === "" ? "Sin descripción todavía." : project.description}
          </Text>
        </View>
      </View>
      {project.categories.length > 0 ? (
        <View style={{ marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {project.categories.map((category) => (
            <CategoryChip key={category} label={category} icon={CATEGORY_ICONS[category] ?? "label_outline"} />
          ))}
        </View>
      ) : null}
    </InkWell>
  );
}
