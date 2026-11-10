// Equivalente de profile/ui/views/logout_page.dart: "¿Cerrar sesión?".
import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, FilledButton, OutlinedButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { ProfileController } from "../viewmodels/profileController";

export function LogoutPage() {
  const controller = useDI().resolve<ProfileController>(TOKENS.ProfileController);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar />
      <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
        <View style={{ paddingLeft: 24, paddingTop: 16, paddingRight: 24, paddingBottom: 24, alignItems: "center" }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: HomeColors.flowLavender, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcon name="logout_rounded" size={40} color={HomeColors.primaryPurple} />
          </View>
          <View style={{ height: 20 }} />
          <Text style={{ fontSize: 22, fontWeight: "bold", color: HomeColors.textPrimary }}>¿Cerrar sesión?</Text>
          <View style={{ height: 10 }} />
          <Text style={{ textAlign: "center", color: HomeColors.textSecondary, lineHeight: 14 * 1.4, fontSize: 14 }}>
            {"Se cerrará tu sesión en este dispositivo.\nPodrás volver a iniciar sesión cuando quieras."}
          </Text>
          <View style={{ height: 28 }} />
          <FilledButton
            testID="logout_confirm"
            label="Cerrar sesión"
            onPress={async () => {
              await controller.logOut();
              Nav.offAllNamed(RouteNames.central);
            }}
            backgroundColor={HomeColors.primaryPurple}
            height={50}
            style={{ height: 50, alignSelf: "stretch" }}
          />
          <View style={{ height: 10 }} />
          <OutlinedButton
            label="Cancelar"
            onPress={() => Nav.back()}
            foregroundColor={HomeColors.primaryPurple}
            borderColor={HomeColors.primaryPurple}
            height={50}
            style={{ height: 50, alignSelf: "stretch" }}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}
