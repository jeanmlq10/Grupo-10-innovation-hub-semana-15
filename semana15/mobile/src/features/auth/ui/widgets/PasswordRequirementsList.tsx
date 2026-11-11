// Lista de verificación de la contraseña (registro). Cada requisito sale de
// `PasswordPolicy.requirements()`, que es la misma regla que exige Roble, y
// cambia de círculo vacío a check mientras la persona escribe.
import React from "react";
import { Text, View } from "react-native";

import { Palette } from "@/src/core/theme/brand";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { PasswordPolicy } from "../../domain/passwordPolicy";

export function PasswordRequirementsList({ password, testID }: { password: string; testID?: string }) {
  const requirements = PasswordPolicy.requirements();
  return (
    <View testID={testID} accessibilityRole="summary" style={{ marginTop: 10, paddingHorizontal: 4, gap: 6 }}>
      {requirements.map((r) => {
        const ok = r.test(password);
        return (
          <View
            key={r.id}
            testID={`${testID ?? "password_req"}_${r.id}_${ok ? "ok" : "pending"}`}
            accessibilityLabel={`${r.label}: ${ok ? "cumplido" : "pendiente"}`}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <MaterialIcon
              name={ok ? "check_circle" : "radio_button_unchecked"}
              color={ok ? Palette.secondary : Palette.textHint}
              size={18}
            />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 13.5,
                color: ok ? Palette.textPrimary : Palette.textMuted,
                fontWeight: ok ? "600" : "400",
              }}
            >
              {r.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
