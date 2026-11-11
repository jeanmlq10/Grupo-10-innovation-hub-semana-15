// Equivalente de auth/ui/views/welcome_page.dart.
import React from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getContainer } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { FilledButton, OutlinedButton } from "@/src/core/ui/material";
import { BrandLogo } from "@/src/core/widgets/BrandLogo";

import { AuthenticationController } from "../viewmodels/authenticationController";
import { useFlowWidth } from "../widgets/authFormWidgets";
import { Palette } from "@/src/core/theme/brand";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Pantalla de bienvenida del flujo de autenticación. */
export function WelcomePage() {
  const screen = useWindowDimensions();
  const width = useFlowWidth();

  const titleSize = clamp(width * 0.075, 27, 34);
  const illustrationWidth = clamp(width * 0.91, 315, 370);
  const bodyTextSize = clamp(width * 0.044, 15.5, 18);
  const buttonHeight = clamp(width * 0.135, 52, 58);
  const horizontalPadding = width * 0.07;
  const topSpace = clamp(screen.height * 0.055, 22, 38);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView bounces={false} contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}>
          <View
            style={{
              flex: 1,
              width,
              paddingTop: topSpace,
              paddingHorizontal: horizontalPadding,
              paddingBottom: 24,
            }}
          >
            <View style={{ height: screen.height * 0.06 }} />
            <Text
              style={{
                textAlign: "center",
                fontSize: titleSize,
                fontWeight: "800",
                color: HomeColors.flowNavy,
                letterSpacing: -0.5,
                lineHeight: titleSize * 1.05,
              }}
            >
              ¡Bienvenido!
            </Text>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: width * 0.05 }}>
              <BrandLogo variant="full" size={illustrationWidth * 0.86} halo />
            </View>
            <Text style={{ textAlign: "center", fontSize: bodyTextSize, fontWeight: "400", color: HomeColors.textSecondary, lineHeight: bodyTextSize * 1.28 }}>
              {"Únete a proyectos que transforman\nideas en impacto."}
            </Text>
            <View style={{ height: width * 0.035 }} />
            <View style={[{ borderRadius: 9 }, boxShadow({ color: withAlpha(Palette.shadow, 0.28), blur: 10, dy: 4 })]}>
              <FilledButton
                label="Iniciar sesión"
                onPress={() => void Nav.to("Login")}
                backgroundColor={HomeColors.flowPurple}
                foregroundColor={Colors.white}
                borderRadius={9}
                height={buttonHeight}
                style={{ height: buttonHeight }}
                textStyle={{ fontSize: clamp(width * 0.044, 16, 18), fontWeight: "700" }}
              />
            </View>
            <View style={{ height: width * 0.018 }} />
            <OutlinedButton
              label="¿No tienes cuenta? Regístrate"
              onPress={() => void Nav.to("SignUp")}
              foregroundColor={HomeColors.flowPurple}
              backgroundColor={Colors.white}
              borderColor={HomeColors.flowPurple}
              borderWidth={width * 0.003}
              borderRadius={9}
              height={buttonHeight}
              style={{ height: buttonHeight }}
              textStyle={{ fontSize: clamp(width * 0.041, 15, 17), fontWeight: "700" }}
            />
            <View style={{ height: width * 0.018 }} />
            <FilledButton
              label="Continuar como visitante"
              onPress={() =>
                getContainer().resolve<AuthenticationController>(TOKENS.AuthenticationController).continueAsGuest()
              }
              backgroundColor={HomeColors.flowLavender}
              foregroundColor={HomeColors.flowPurple}
              borderRadius={9}
              height={buttonHeight}
              style={{ height: buttonHeight }}
              textStyle={{ fontSize: clamp(width * 0.041, 15, 17), fontWeight: "700" }}
            />
            <View style={{ height: width * 0.025 }} />
            <Text style={{ textAlign: "center", fontSize: clamp(width * 0.032, 12, 13.5), color: HomeColors.flowSlate }}>
              Explorar proyectos sin iniciar sesión
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
