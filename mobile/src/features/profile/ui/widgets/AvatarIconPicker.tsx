// Equivalente de profile/ui/widgets/avatar_icon_picker.dart: hoja inferior
// para elegir el icono del perfil. Devuelve la clave elegida, '' para volver
// a la inicial, o null si se cierra sin elegir.
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { Overlay } from "@/src/core/ui/overlay";

import { AvatarIcons } from "./avatarIcons";

export async function showAvatarIconPicker(current: string): Promise<string | null> {
  const picked = await Overlay.bottomSheet<string>(() => <AvatarIconPicker current={current} />, {
    backgroundColor: Colors.white,
    radius: 20,
  });
  return picked ?? null;
}

function AvatarIconPicker({ current }: { current: string }) {
  return (
    <SafeAreaView edges={["bottom"]}>
      <View style={{ paddingLeft: 20, paddingTop: 16, paddingRight: 20, paddingBottom: 16 }}>
        <Text style={{ fontSize: 17, fontWeight: "bold", color: HomeColors.textPrimary }}>Elige tu icono</Text>
        <View style={{ height: 14 }} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {AvatarIcons.all.map(([key, icon]) => (
            <InkWell
              key={key}
              circle
              accessibilityLabel={key}
              onPress={() => Nav.back(key)}
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: HomeColors.navSelectedBackground,
                borderWidth: 2,
                borderColor: key === current ? HomeColors.primaryPurple : "transparent",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcon name={icon} color={HomeColors.primaryPurple} size={28} />
            </InkWell>
          ))}
        </View>
        <View style={{ height: 12 }} />
        <TextButton label="Usar mi inicial" onPress={() => Nav.back("")} />
      </View>
    </SafeAreaView>
  );
}
