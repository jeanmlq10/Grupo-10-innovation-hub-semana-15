import { Platform } from "react-native";

import { RobleClient } from "@/src/core/roble/robleClient";
import { RobleAuthConfig } from "@/src/core/roble/robleConfig";
import { RobleApiDataBase, RobleProviderInfo, RobleSocialProvider } from "@/src/core/roble/sdk/RobleApiDataBase";
import { RobleApiHttpException } from "@/src/core/roble/sdk/robleExceptions";

import {
  AuthConfigurationException,
  AuthProviderUnavailableException,
  AuthRateLimitedException,
  NonInstitutionalEmailException,
} from "../../../domain/authExceptions";
import { AuthenticationUser } from "../../../domain/models/authenticationUser";
import { RegisterArgs } from "../../../domain/repositories/iAuthRepository";
import { RetryPolicy } from "../../retryPolicy";
import { IAuthenticationSource } from "./iAuthenticationSource";

/** Thin adapter over the Roble client ([RobleApiDataBase]). */
export class AuthenticationSourceService implements IAuthenticationSource {
  private readonly roble: RobleClient;
  private providers: RobleProviderInfo[] | null = null;

  constructor({
    roble,
    client,
    config,
    retryPolicy = new RetryPolicy(),
  }: {
    roble?: RobleClient;
    client?: RobleApiDataBase;
    config?: RobleAuthConfig;
    retryPolicy?: RetryPolicy;
  } = {}) {
    this.roble = roble ?? new RobleClient({ config, database: client });
    this.retryPolicy = retryPolicy;
  }

  readonly retryPolicy: RetryPolicy;

  get config(): RobleAuthConfig {
    return this.roble.config;
  }

  private get client(): RobleApiDataBase {
    if (!this.roble.isConfigured) {
      throw new AuthConfigurationException(
        "Falta configurar ROBLE_CONTRACT_ID. No se puede iniciar sesion contra Roble sin el identificador del proyecto.",
      );
    }
    return this.roble.db;
  }

  private static normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private async run<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      if (error instanceof RobleApiHttpException && error.statusCode === 429) {
        throw new AuthRateLimitedException(this.roble.retryAfterClient.takeRetryAfter());
      }
      throw error;
    }
  }

  login(email: string, password: string) {
    return this.run(async () => {
      const profile = await this.client.login({ email: AuthenticationSourceService.normalizeEmail(email), password });
      return AuthenticationUser.fromProfile(profile);
    });
  }

  registerWithVerification({ email, password, name, extra = {} }: RegisterArgs) {
    return this.run(async () => {
      const normalized = AuthenticationSourceService.normalizeEmail(email);
      if (!this.config.isInstitutionalEmail(normalized)) {
        throw new NonInstitutionalEmailException(this.config.institutionalEmailDomain);
      }
      await this.client.registerWithVerification({ email: normalized, password, name: name.trim(), extra });
    });
  }

  verifyEmail(email: string, code: string) {
    return this.run(async () => {
      await this.client.verifyEmail({ email: AuthenticationSourceService.normalizeEmail(email), code: code.trim() });
    });
  }

  resendCode(email: string) {
    return this.run(async () => {
      await this.client.resendCode({ email: AuthenticationSourceService.normalizeEmail(email) });
    });
  }

  isMicrosoftEnabled() {
    return this.run(async () => {
      const providers = (this.providers ??= await this.client.listProviders());
      return providers.some((p) => p.name === RobleSocialProvider.microsoft);
    });
  }

  signInWithMicrosoft() {
    return this.run(async () => {
      const client = this.client;
      const providers = this.providers;
      if (providers != null && !providers.some((p) => p.name === RobleSocialProvider.microsoft)) {
        throw new AuthProviderUnavailableException("Microsoft");
      }
      if (Platform.OS !== "web" && this.config.nativeCallbackScheme.trim() === "") {
        throw new AuthConfigurationException(
          "Falta configurar ROBLE_NATIVE_CALLBACK_SCHEME para iniciar sesion con Microsoft en Android/iOS.",
        );
      }
      const profile = await client.signInWithProvider(RobleSocialProvider.microsoft, {
        // En web el SDK de Dart abre una ventana emergente; aquí, la pestaña del navegador.
        opener:
          Platform.OS === "web"
            ? async (url) => {
                const WebBrowser = await import("expo-web-browser");
                const r = await WebBrowser.openAuthSessionAsync(url, window.location.origin);
                if (r.type !== "success") throw new Error("Inicio de sesión cancelado.");
                return r.url;
              }
            : undefined,
      });
      return AuthenticationUser.fromProfile(profile);
    });
  }

  get isLoggedIn(): boolean {
    return this.client.isLoggedIn;
  }

  restoreSession() {
    return this.run(() => this.retryPolicy.run(() => this.client.restoreSession()));
  }

  currentUser() {
    return this.run(async () => {
      if (!this.client.isLoggedIn) return null;
      const profile = await this.retryPolicy.run(() => this.client.currentUser());
      return AuthenticationUser.fromProfile(profile);
    });
  }

  logOut() {
    return this.run(() => this.client.logout());
  }

  forgotPassword(email: string) {
    return this.run(async () => {
      await this.client.forgotPassword({ email: AuthenticationSourceService.normalizeEmail(email) });
    });
  }

  resetPassword(token: string, newPassword: string) {
    return this.run(async () => {
      await this.client.resetPassword({ token: token.trim(), newPassword });
    });
  }
}
