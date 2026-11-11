// Equivalente de auth/ui/widgets/verification_code_input.dart: seis cajas
// para el código del correo. Un único campo invisible encima recibe el
// teclado (así pegar y el autocompletado de código siguen funcionando).
import React, { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";

import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { Palette } from "@/src/core/theme/brand";

export function VerificationCodeInput({
  value,
  onChangeText,
  width,
  length = 6,
  testID,
}: {
  value: string;
  onChangeText: (v: string) => void;
  width: number;
  length?: number;
  testID?: string;
}) {
  const [focused, setFocused] = useState(false);
  const activeIndex = value.length >= length ? length - 1 : value.length;
  const gap = width * 0.028;
  let boxWidth = (width - gap * (length - 1)) / length;
  if (boxWidth > 54) boxWidth = 54;
  const boxHeight = boxWidth * 1.2;

  return (
    <View style={{ alignItems: "center" }}>
      <View>
        <View style={{ flexDirection: "row" }}>
          {Array.from({ length }, (_, index) => {
            const char = index < value.length ? value[index] : "";
            const active = focused && index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  {
                    width: boxWidth,
                    height: boxHeight,
                    marginRight: index === length - 1 ? 0 : gap,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: Colors.white,
                    borderRadius: 8,
                    borderColor: active ? HomeColors.flowAccent : HomeColors.flowBorder,
                    borderWidth: active ? 1.6 : 1.2,
                  },
                  boxShadow({ color: withAlpha(Palette.shadow, 0.05), blur: 6, dy: 2 }),
                ]}
              >
                <Text style={{ fontSize: boxWidth * 0.46, fontWeight: "700", color: HomeColors.flowAccent }}>{char}</Text>
              </View>
            );
          })}
        </View>
        <TextInput
          testID={testID}
          value={value}
          onChangeText={(t) => onChangeText(t.slice(0, length))}
          maxLength={length}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={Platform.OS === "android" ? "sms-otp" : "one-time-code"}
          caretHidden
          contextMenuHidden
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, opacity: 0, color: "transparent" }}
        />
      </View>
    </View>
  );
}
