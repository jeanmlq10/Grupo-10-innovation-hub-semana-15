// Equivalente de auth/ui/views/signup_page.dart: alta institucional con
// `registerWithVerification`, código por correo y, al verificar, el
// controlador inicia sesión con la contraseña escrita. Una cuenta nueva ve
// "¿Qué quieres hacer?" encima de Home. Nunca guarda la contraseña.
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Text, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { BrandLogo } from "@/src/core/widgets/BrandLogo";
import { TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";

import { PasswordPolicy } from "../../domain/passwordPolicy";
import { FirstAccessStore } from "../firstAccessStore";
import { AuthenticationController } from "../viewmodels/authenticationController";
import {
  AuthBackButton,
  AuthPrimaryButton,
  AuthTextField,
  FlowScreenBody,
  MailBadgeIcon,
  RateLimitNotice,
  Spacer,
  useFlowWidth,
} from "../widgets/authFormWidgets";
import { PasswordRequirementsList } from "../widgets/PasswordRequirementsList";
import { VerificationCodeInput } from "../widgets/verificationCodeInput";

const RESEND_WAIT = 45;

export function SignUpPage() {
  const auth = useFind<AuthenticationController>(TOKENS.AuthenticationController);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [career, setCareer] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<{ name?: string | null; email?: string | null; password?: string | null }>({});
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const width = useFlowWidth();

  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const startResendCountdown = () => {
    if (timer.current) clearInterval(timer.current);
    setResendSecondsLeft(RESEND_WAIT);
    timer.current = setInterval(() => {
      setResendSecondsLeft((s) => {
        if (s - 1 <= 0) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const resendLabel = (() => {
    if (resendSecondsLeft <= 0) return "Reenviar código";
    const minutes = String(Math.trunc(resendSecondsLeft / 60)).padStart(2, "0");
    const seconds = String(resendSecondsLeft % 60).padStart(2, "0");
    return `Reenviar código (${minutes}:${seconds})`;
  })();

  const showError = () => {
    const message = auth.error.value;
    if (message === "") return;
    snackbar("Registro", message, {
      icon: <MaterialIcon name="error_outline" color={Colors.red} />,
      position: "BOTTOM",
    });
  };

  const validate = () => {
    const e = email.trim();
    const next = {
      name: name.trim() === "" ? "Ingresa tu nombre." : null,
      email: e === "" ? "Ingresa tu correo." : !e.includes("@") ? "Correo inválido." : null,
      password: PasswordPolicy.validate(password),
    };
    setErrors(next);
    return !next.name && !next.email && !next.password;
  };

  const register = async () => {
    if (auth.isBusy) return;
    Keyboard.dismiss();
    if (!validate()) return;
    const ok = await auth.register({
      email,
      password,
      name,
      extra: career.trim() === "" ? {} : { career: career.trim() },
    });
    if (!ok) {
      showError();
      return;
    }
    setCode("");
    startResendCountdown();
    snackbar("Registro", "Te enviamos un código de verificación a tu correo institucional.", { position: "BOTTOM" });
  };

  const verify = async () => {
    if (auth.isBusy) return;
    Keyboard.dismiss();
    const trimmed = code.trim();
    if (trimmed === "") {
      snackbar("Verificación", "Ingresa el código que te enviamos a tu correo.", { position: "BOTTOM" });
      return;
    }
    const pendingEmail = auth.pendingVerificationEmail;
    const ok = await auth.verifyEmail(trimmed);
    if (!ok) {
      showError();
      return;
    }
    if (auth.isLogged) {
      Nav.popToTop();
      void Nav.to("WhatToDo");
      return;
    }
    if (pendingEmail != null) await FirstAccessStore.markPending(pendingEmail);
    snackbar("Cuenta verificada", "Ya puedes iniciar sesión con tu correo y contraseña.", { position: "BOTTOM" });
    Nav.pop();
  };

  const resendCode = async () => {
    if (resendSecondsLeft > 0) return;
    const ok = await auth.resendVerificationCode();
    if (!ok) {
      showError();
      return;
    }
    startResendCountdown();
  };

  if (auth.pendingVerificationEmail == null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.white }}>
        <FlowScreenBody>
          <View style={{ height: 14 }} />
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AuthBackButton />
            <View style={{ width: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: "700", color: HomeColors.flowNavy }}>Alta institucional</Text>
          </View>
          <View style={{ height: 20 }} />
          <Spacer flex={4} />
          <View style={{ alignItems: "center" }}>
            {/* Símbolo de Proyéctate (el brote) en lugar del escudo con check. */}
            <BrandLogo variant="symbol" size={58} accessibilityLabel="Proyéctate" />
          </View>
          <View style={{ height: 16 }} />
          <Text style={{ textAlign: "center", color: HomeColors.flowNavy, fontSize: 20.5, fontWeight: "800", letterSpacing: -0.2 }}>
            Crea tu cuenta institucional
          </Text>
          <View style={{ height: 20 }} />
          <AuthTextField
            testID="signup_name"
            value={name}
            onChangeText={setName}
            hint="Nombre completo"
            filled
            returnKeyType="next"
            autoComplete="name"
            textContentType="name"
            error={errors.name}
          />
          <View style={{ height: 12 }} />
          <AuthTextField
            testID="signup_email"
            value={email}
            onChangeText={setEmail}
            hint="Correo institucional"
            filled
            keyboardType="email-address"
            returnKeyType="next"
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
          />
          <View style={{ height: 12 }} />
          <AuthTextField
            testID="signup_career"
            value={career}
            onChangeText={setCareer}
            hint="Carrera o programa (opcional)"
            filled
            returnKeyType="next"
          />
          <View style={{ height: 12 }} />
          <AuthTextField
            testID="signup_password"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
            }}
            hint="Contraseña"
            filled
            obscure
            returnKeyType="done"
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.password}
            onSubmitted={register}
          />
          <PasswordRequirementsList testID="signup_password_req" password={password} />
          <RateLimitNotice auth={auth} />
          <View style={{ height: 20 }} />
          <AuthPrimaryButton
            testID="signup_submit"
            label="Registrarme"
            onPressed={auth.isBusy ? null : register}
            loading={auth.isLoading}
          />
          <View style={{ height: 24 }} />
          <Spacer flex={5} />
        </FlowScreenBody>
      </View>
    );
  }

  const contentWidth = width * (1 - 2 * 0.07);
  const badge = Math.min(136, Math.max(104, width * 0.3));

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <FlowScreenBody>
        <View style={{ height: 24 }} />
        <Spacer flex={9} />
        <View style={{ alignItems: "center" }}>
          <MailBadgeIcon size={badge} />
        </View>
        <View style={{ height: 22 }} />
        <Text style={{ textAlign: "center", fontSize: 22, fontWeight: "800", color: HomeColors.flowNavy, letterSpacing: -0.2 }}>
          Verificación
        </Text>
        <View style={{ height: 14 }} />
        <Text style={{ textAlign: "center", fontSize: 16, color: HomeColors.flowSlate, lineHeight: 16 * 1.4 }}>
          {"Te hemos enviado un código\na tu correo."}
        </Text>
        <View style={{ height: 28 }} />
        <VerificationCodeInput testID="verification_code_field" value={code} onChangeText={setCode} width={contentWidth} />
        <RateLimitNotice auth={auth} />
        <View style={{ height: 20 }} />
        <View style={{ alignItems: "center" }}>
          <TextButton
            label={resendLabel}
            onPress={auth.isBusy || resendSecondsLeft > 0 ? null : resendCode}
            foregroundColor={HomeColors.flowAccent}
            disabledForegroundColor={HomeColors.flowAccent}
            textStyle={{ fontSize: 14.5, fontWeight: "500" }}
          />
        </View>
        <View style={{ height: 18 }} />
        <Spacer flex={4} />
        <AuthPrimaryButton testID="verify_submit" label="Verificar" onPressed={auth.isBusy ? null : verify} loading={auth.isLoading} />
        <View style={{ height: 24 }} />
        <Spacer flex={7} />
      </FlowScreenBody>
    </View>
  );
}
