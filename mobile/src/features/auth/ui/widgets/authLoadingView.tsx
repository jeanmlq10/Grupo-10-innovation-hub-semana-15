// Equivalente de auth/ui/widgets/auth_loading_view.dart: "Iniciando sesión...".
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator } from "@/src/core/ui/material";

import { Spacer } from "./authFormWidgets";
import { Palette } from "@/src/core/theme/brand";

export function AuthLoadingView({
  title = "Iniciando sesión...",
  message = "Redirigiendo a tu\npanel principal.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 32 }}>
        <Spacer flex={9} />
        <View style={{ alignItems: "center" }}>
          <CircularProgressIndicator size={60} strokeWidth={4.5} color={HomeColors.flowPurple} backgroundColor={Palette.track} />
        </View>
        <View style={{ height: 32 }} />
        <Text style={{ textAlign: "center", fontSize: 21, fontWeight: "800", color: HomeColors.flowNavy }}>{title}</Text>
        <View style={{ height: 12 }} />
        <Text style={{ textAlign: "center", fontSize: 15.5, color: HomeColors.flowSlate, lineHeight: 15.5 * 1.4 }}>
          {message}
        </Text>
        <Spacer flex={11} />
      </SafeAreaView>
    </View>
  );
}
