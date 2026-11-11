// Equivalente de projects/ui/widgets/project_search_bar.dart.
import React from "react";
import { Platform, TextInput, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

export function ProjectSearchBar({ onChanged }: { onChanged: (v: string) => void }) {
  return (
    <View style={{ backgroundColor: HomeColors.flowSearchFill, borderRadius: 8, flexDirection: "row", alignItems: "center" }}>
      <TextInput
        testID="project_search"
        onChangeText={onChanged}
        placeholder="Buscar proyectos...."
        placeholderTextColor={HomeColors.flowSearchHint}
        style={{
          flex: 1,
          color: HomeColors.flowNavy,
          fontSize: 15,
          paddingHorizontal: 16,
          paddingVertical: 15,
          ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
        }}
      />
      <View style={{ width: 48, alignItems: "center" }}>
        <MaterialIcon name="search_rounded" color={HomeColors.flowNavy} size={25} />
      </View>
    </View>
  );
}
