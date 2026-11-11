// Equivalente de auth/ui/views/login_page.dart. "Ingresar" llama a
// AuthenticationController.login (Roble). Mientras tanto se ve
// "Iniciando sesión..."; al terminar se vuelve a la Central (que ya muestra Home).
import React, { useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";

import { FirstAccessStore } from "../firstAccessStore";
import { AuthenticationController } from "../viewmodels/authenticationController";
import { AuthLoadingView } from "../widgets/authLoadingView";
import {
  AuthBackButton,
  AuthPrimaryButton,
  AuthTextField,
  FlowScreenBody,
  RateLimitNotice,
  Spacer,
} from "../widgets/authFormWidgets";

export function LoginPage() {
  const auth = useFind<AuthenticationController>(TOKENS.AuthenticationController);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [signingIn, setSigningIn] = useState(false);

  const validate = () => {
    const e = email.trim();
    const next = {
      email: e === "" ? "Ingresa tu correo." : !e.includes("@") ? "Correo inválido." : null,
      password: password === "" ? "Ingresa tu contraseña." : null,
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const showError = () => {
    const message = auth.error.value;
    if (message === "") return;
    snackbar("Autenticación", message, {
      icon: <MaterialIcon name="lock_outline" color={Colors.red} />,
      position: "BOTTOM",
    });
  };

  const login = async () => {
    if (auth.isBusy || signingIn) return;
    Keyboard.dismiss();
    if (!validate()) return;

    setSigningIn(true);
    const loggedIn = await auth.login(email, password);
    if (!loggedIn) {
      setSigningIn(false);
      showError();
      return;
    }
    const firstAccess = await FirstAccessStore.consume(auth.loggedEmail);
    Nav.popToTop();
    if (firstAccess) void Nav.to("WhatToDo");
  };

  const forgotPassword = async () => {
    if (auth.isBusy) return;
    const e = email.trim();
    if (e === "" || !e.includes("@")) {
      snackbar(
        "Recuperar contraseña",
        'Escribe tu correo electrónico y vuelve a tocar "¿Olvidaste tu contraseña?".',
        { position: "BOTTOM" },
      );
      return;
    }
    const ok = await auth.forgotPassword(e);
    if (!ok) {
      showError();
      return;
    }
    snackbar(
      "Recuperar contraseña",
      "Si el correo está registrado, te enviamos las instrucciones para restablecer tu contraseña.",
      { position: "BOTTOM" },
    );
  };

  if (signingIn) return <AuthLoadingView />;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <FlowScreenBody>
        <View style={{ height: 14 }} />
        <View style={{ alignItems: "flex-start" }}>
          <AuthBackButton />
        </View>
        <View style={{ height: 14 }} />
        <Text style={{ textAlign: "center", fontSize: 25, fontWeight: "800", color: HomeColors.flowNavy, letterSpacing: -0.3 }}>
          Iniciar sesión
        </Text>
        <View style={{ height: 12 }} />
        <Text style={{ textAlign: "center", fontSize: 17, color: HomeColors.flowSlate, lineHeight: 17 * 1.4 }}>
          {"Ingresa tus datos para\ncontinuar."}
        </Text>
        <View style={{ height: 40 }} />
        <AuthTextField
          testID="login_email"
          value={email}
          onChangeText={setEmail}
          label="Correo electrónico"
          hint="ejemplo@correo.com"
          keyboardType="email-address"
          returnKeyType="next"
          autoComplete="email"
          textContentType="emailAddress"
          error={errors.email}
        />
        <View style={{ height: 20 }} />
        <AuthTextField
          testID="login_password"
          value={password}
          onChangeText={setPassword}
          label="Contraseña"
          hint="••••••••••••"
          obscure
          returnKeyType="done"
          autoComplete="password"
          textContentType="password"
          error={errors.password}
          onSubmitted={login}
        />
        <RateLimitNotice auth={auth} />
        <View style={{ height: 12 }} />
        <View style={{ alignItems: "center" }}>
          <TextButton
            label="¿Olvidaste tu contraseña?"
            onPress={forgotPassword}
            foregroundColor={HomeColors.flowAccent}
            textStyle={{ fontSize: 14.5, fontWeight: "500" }}
          />
        </View>
        <View style={{ height: 24 }} />
        <Spacer />
        <AuthPrimaryButton testID="login_submit" label="Ingresar" onPressed={auth.isBusy ? null : login} loading={auth.isLoading} />
        <View style={{ height: 24 }} />
      </FlowScreenBody>
    </View>
  );
}
