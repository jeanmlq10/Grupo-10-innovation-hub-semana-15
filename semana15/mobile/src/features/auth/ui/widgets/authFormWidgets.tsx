// Equivalente de auth/ui/widgets/auth_form_widgets.dart.
import React, { forwardRef, useState } from "react";
import {
  KeyboardTypeOptions,
  Platform,
  ReturnKeyTypeOptions,
  ScrollView,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import type { TextInputInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Nav } from "@/src/core/navigation/Nav";
import { useController } from "@/src/core/state/Controller";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, FilledButton, InkWell, OutlinedButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { SvgString } from "@/src/core/ui/svg";

import { AuthenticationController } from "../viewmodels/authenticationController";
import { Brand, Palette } from "@/src/core/theme/brand";

/** Colores que usaban los widgets de autenticación (AuthColors). */
export const AuthColors = {
  fieldBorder: HomeColors.flowBorder,
  fieldFill: HomeColors.flowFieldFill,
  successGreen: HomeColors.flowGreen,
};

/** Color de error de Material 3 (esquema yellowM3). */
export const M3_ERROR = Palette.errorStrong;

/** Ancho usado para dimensionar las pantallas del flujo (máx. 480). */
export function useFlowWidth(): number {
  const { width } = useWindowDimensions();
  return width > 480 ? 480 : width;
}

/** Equivalente de `Spacer(flex: n)`. */
export function Spacer({ flex = 1 }: { flex?: number }) {
  return <View style={{ flex }} />;
}

/**
 * Cuerpo compartido de las pantallas del flujo: los espacios verticales son
 * `Spacer`s; cuando aparece el teclado, el contenido se desplaza.
 */
export function FlowScreenBody({
  children,
  horizontalFraction = 0.07,
}: {
  children: React.ReactNode;
  horizontalFraction?: number;
}) {
  const width = useFlowWidth();
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: "center" }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={{ flex: 1, width, maxWidth: width, paddingHorizontal: width * horizontalFraction, alignSelf: "center" }}>
          <View style={{ flex: 1, alignItems: "stretch" }}>{children}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** Flecha atrás dentro de un círculo gris claro (Login y "Alta institucional"). */
export function AuthBackButton({ onPressed }: { onPressed?: () => void }) {
  return (
    <InkWell
      circle
      accessibilityLabel="Regresar"
      onPress={onPressed ?? (() => Nav.pop())}
      style={{ width: 40, height: 40, backgroundColor: HomeColors.flowBackCircle, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialIcon name="arrow_back" color={HomeColors.flowNavy} size={22} />
    </InkWell>
  );
}

/** Botón morado sólido ("Iniciar sesión", "Ingresar", "Registrarme", "Verificar"). */
export function AuthPrimaryButton({
  label,
  onPressed,
  loading = false,
  testID,
}: {
  label: string;
  onPressed: (() => void) | null;
  loading?: boolean;
  testID?: string;
}) {
  return (
    <View style={[{ borderRadius: 8 }, boxShadow({ color: withAlpha(HomeColors.flowPurple, 0.18), blur: 10, dy: 4 })]}>
      <FilledButton
        testID={testID}
        onPress={onPressed}
        backgroundColor={HomeColors.flowPurple}
        foregroundColor={Colors.white}
        disabledBackgroundColor={withAlpha(HomeColors.flowPurple, 0.6)}
        disabledForegroundColor={Colors.white}
        borderRadius={8}
        height={50}
        style={{ height: 50, width: "100%" }}
        textStyle={{ fontSize: 15.5, fontWeight: "600" }}
        accessibilityLabel={label}
      >
        {loading ? (
          <CircularProgressIndicator size={20} strokeWidth={2} color={Colors.white} />
        ) : (
          <Text style={{ color: Colors.white, fontSize: 15.5, fontWeight: "600" }}>{label}</Text>
        )}
      </FilledButton>
    </View>
  );
}

/** Botón blanco con borde morado claro ("¿No tienes cuenta? Regístrate"). */
export function AuthSecondaryButton({ label, onPressed }: { label: string; onPressed: (() => void) | null }) {
  return (
    <OutlinedButton
      onPress={onPressed}
      label={label}
      foregroundColor={HomeColors.flowAccent}
      backgroundColor={Colors.white}
      borderColor={HomeColors.flowSoftPurple}
      borderWidth={1.3}
      borderRadius={8}
      height={50}
      style={{ width: "100%", height: 50 }}
      textStyle={{ fontSize: 14.5, fontWeight: "600" }}
    />
  );
}

type AuthTextFieldProps = {
  value: string;
  onChangeText: (v: string) => void;
  hint: string;
  label?: string;
  obscure?: boolean;
  filled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  /** Mensaje de error del validador (lo que mostraba `TextFormField`). */
  error?: string | null;
  onSubmitted?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Campo de texto del flujo. Con [label] el título va sobre una caja blanca
 * (Login); con [filled] es la caja gris de "Alta institucional". Con
 * [obscure] un ojo alterna la visibilidad.
 */
export const AuthTextField = forwardRef<TextInputInstance, AuthTextFieldProps>(function AuthTextField(
  {
    value,
    onChangeText,
    hint,
    label,
    obscure = false,
    filled = false,
    keyboardType,
    returnKeyType,
    autoComplete,
    textContentType,
    error,
    onSubmitted,
    testID,
    style,
  },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);
  const borderColor = error
    ? M3_ERROR
    : focused
      ? HomeColors.flowAccent
      : filled
        ? HomeColors.flowFieldBorder
        : HomeColors.flowBorder;
  const borderWidth = focused ? 1.4 : 1;
  return (
    <View style={style}>
      {label != null ? (
        <Text style={{ fontSize: 14, fontWeight: "700", color: HomeColors.flowNavy, marginBottom: 8 }}>{label}</Text>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderRadius: 8,
          borderColor,
          borderWidth,
          backgroundColor: filled ? HomeColors.flowFieldFill : Colors.white,
          paddingLeft: 16 - (borderWidth - 1),
        }}
      >
        <TextInput
          ref={ref}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={hint}
          placeholderTextColor={filled ? HomeColors.flowFieldHint : HomeColors.flowHint}
          secureTextEntry={obscure && hidden}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          autoCapitalize={keyboardType === "email-address" || obscure ? "none" : "sentences"}
          autoCorrect={!(keyboardType === "email-address" || obscure)}
          autoComplete={autoComplete}
          textContentType={textContentType}
          onSubmitEditing={onSubmitted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 14.5,
            color: HomeColors.flowNavy,
            paddingVertical: 16 - (borderWidth - 1),
            paddingRight: obscure ? 0 : 16,
            ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
          }}
        />
        {obscure ? (
          <InkWell
            circle
            accessibilityLabel={hidden ? "Mostrar contraseña" : "Ocultar contraseña"}
            onPress={() => setHidden((h) => !h)}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcon name={hidden ? "visibility_outlined" : "visibility_off_outlined"} color={Palette.textSecondary} size={22} />
          </InkWell>
        ) : null}
      </View>
      {error ? (
        <Text numberOfLines={3} style={{ color: M3_ERROR, fontSize: 12, marginTop: 4, paddingHorizontal: 16 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

/** Cuenta regresiva en rojo mientras Roble bloquea temporalmente (HTTP 429). */
export function RateLimitNotice({ auth }: { auth: AuthenticationController }) {
  useController(auth);
  if (!auth.isBlocked) return null;
  return (
    <Text style={{ marginTop: 12, textAlign: "center", color: Colors.red, fontSize: 13 }}>
      Demasiados intentos. Podrás volver a intentarlo en {auth.retrySecondsLeft} s.
    </Text>
  );
}

const ENVELOPE = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 48" fill="none">
<rect x="2.5" y="2.5" width="59" height="43" rx="4" stroke="${Brand.violet}" stroke-width="4"/>
<path d="M4.5 5.5L32 27L59.5 5.5" stroke="${Brand.violet}" stroke-width="4" stroke-linejoin="round"/>
<path d="M4.5 43.5L24 22.5M59.5 43.5L40 22.5" stroke="${Brand.violet}" stroke-width="4" stroke-linecap="round"/>
</svg>
`;

/** Círculo lavanda con un sobre morado y un check verde ("Verificación"). */
export function MailBadgeIcon({ size = 120 }: { size?: number }) {
  const envelopeWidth = size * 0.58;
  const envelopeHeight = (envelopeWidth * 48) / 64;
  const check = size * 0.21;
  return (
    <View style={{ width: size, height: size }}>
      <View style={{ position: "absolute", width: size, height: size, borderRadius: size / 2, backgroundColor: HomeColors.flowLavender }} />
      <View style={{ position: "absolute", left: (size - envelopeWidth) / 2, top: (size - envelopeHeight) / 2 }}>
        <SvgString xml={ENVELOPE} width={envelopeWidth} height={envelopeHeight} />
      </View>
      <View
        style={{
          position: "absolute",
          left: size * 0.755 - check / 2,
          top: size * 0.7 - check / 2,
          width: check,
          height: check,
          borderRadius: check / 2,
          backgroundColor: HomeColors.flowGreen,
          borderWidth: 2,
          borderColor: Colors.white,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcon name="check" size={check * 0.62} color={Colors.white} />
      </View>
    </View>
  );
}
