// Equivalente de auth/ui/widgets/login_required_dialog.dart.
import React from "react";
import { Text, View } from "react-native";

import { getContainer } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { FilledButton, IconButton, OutlinedButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { Overlay } from "@/src/core/ui/overlay";

import { AuthenticationController } from "../viewmodels/authenticationController";

/**
 * Regla de acceso del modo visitante: sin sesión solo se puede explorar y
 * consultar proyectos; cualquier otra acción pide iniciar sesión.
 */
export function requireSession(): boolean {
  const auth = getContainer().resolve<AuthenticationController>(TOKENS.AuthenticationController);
  if (auth.isLogged) return true;
  void Overlay.dialog(() => <LoginRequiredDialog />, { barrierDismissible: true });
  return false;
}

/** Aviso "Necesitas iniciar sesión" (pantalla 5 del flujo actualizado). */
export function LoginRequiredDialog() {
  return (
    <View
      style={{
        backgroundColor: Colors.white,
        marginHorizontal: 32,
        borderRadius: 18,
        paddingTop: 12,
        paddingHorizontal: 22,
        paddingBottom: 22,
        alignItems: "center",
        maxWidth: 560,
        alignSelf: "center",
        width: "auto",
      }}
    >
      <View style={{ alignSelf: "stretch", alignItems: "flex-end" }}>
        <IconButton icon="close" tooltip="Cerrar" color={HomeColors.flowNavy} onPress={() => Nav.back()} />
      </View>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: HomeColors.flowLavender,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcon name="lock_rounded" color={HomeColors.flowPurple} size={30} />
      </View>
      <View style={{ height: 16 }} />
      <Text style={{ textAlign: "center", fontSize: 18, fontWeight: "800", color: HomeColors.flowNavy }}>
        Necesitas iniciar sesión
      </Text>
      <View style={{ height: 8 }} />
      <Text style={{ textAlign: "center", fontSize: 14, color: HomeColors.flowSlate, lineHeight: 14 * 1.35 }}>
        Para participar en el proyecto o realizar otras acciones, primero debes iniciar sesión.
      </Text>
      <View style={{ height: 20 }} />
      <FilledButton
        label="Iniciar sesión"
        onPress={() => {
          Nav.back();
          void Nav.to("Login");
        }}
        backgroundColor={HomeColors.flowPurple}
        foregroundColor={Colors.white}
        borderRadius={9}
        height={48}
        style={{ alignSelf: "stretch", height: 48 }}
        textStyle={{ fontSize: 15, fontWeight: "700" }}
      />
      <View style={{ height: 10 }} />
      <OutlinedButton
        label="Cancelar"
        onPress={() => Nav.back()}
        foregroundColor={HomeColors.flowPurple}
        borderColor={HomeColors.flowPurple}
        borderRadius={9}
        height={48}
        style={{ alignSelf: "stretch", height: 48 }}
        textStyle={{ fontSize: 15, fontWeight: "700" }}
      />
    </View>
  );
}
