// Equivalente de auth/ui/views/central.dart: mientras se restaura la sesión
// muestra un indicador; luego Home (con sesión o visitante) o Bienvenida.
import React from "react";
import { View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Colors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator } from "@/src/core/ui/material";
import { HomePage } from "@/src/features/projects/ui/views/HomePage";

import { AuthenticationController } from "../viewmodels/authenticationController";
import { WelcomePage } from "./WelcomePage";

export function Central() {
  const auth = useFind<AuthenticationController>(TOKENS.AuthenticationController);
  if (auth.isRestoring) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white }}>
        <CircularProgressIndicator />
      </View>
    );
  }
  return auth.canBrowse ? <HomePage /> : <WelcomePage />;
}
