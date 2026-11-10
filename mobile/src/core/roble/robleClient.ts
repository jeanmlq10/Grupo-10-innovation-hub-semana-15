// Equivalente de core/roble/roble_client.dart: el cliente de Roble, UNO solo
// para toda la app (lo crea appContainer.ts).
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

import { RetryAfterClient } from "./retryAfterClient";
import { RobleAuthConfig } from "./robleConfig";
import { RobleApiConfig, RobleApiDataBase, RobleSocialOpener } from "./sdk/RobleApiDataBase";

/**
 * Equivalente de `robleNativeOpener(callbackScheme)` del SDK (que en Flutter
 * usa flutter_web_auth_2): abre el proveedor en la pestaña del navegador del
 * sistema y espera el retorno al esquema propio de la app.
 */
export function robleNativeOpener(callbackScheme: string): RobleSocialOpener {
  return async (loginUrl, timeoutMs) => {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado en el inicio de sesión.")), timeoutMs),
    );
    const result = await Promise.race([WebBrowser.openAuthSessionAsync(loginUrl, `${callbackScheme}://`), timeout]);
    if (result.type !== "success") throw new Error("Inicio de sesión cancelado.");
    return result.url;
  };
}

export class RobleClient {
  readonly config: RobleAuthConfig;
  readonly retryAfterClient = new RetryAfterClient();
  private database: RobleApiDataBase | null;

  constructor({ config, database }: { config?: RobleAuthConfig; database?: RobleApiDataBase } = {}) {
    this.config = config ?? RobleAuthConfig.fromEnvironment();
    this.database = database ?? null;
  }

  get isConfigured(): boolean {
    return this.database != null || this.config.isConfigured;
  }

  get db(): RobleApiDataBase {
    if (this.database) return this.database;
    if (!this.config.isConfigured) {
      throw new StateError("Falta configurar ROBLE_CONTRACT_ID (.env / dart_defines.json).");
    }
    const callbackScheme = this.config.nativeCallbackScheme.trim();
    this.database = new RobleApiDataBase({
      config: RobleApiConfig.fromContract({ baseUrl: this.config.baseUrl, contractId: this.config.contractId }),
      fetchFn: this.retryAfterClient.send,
      ssoRedirect: this.config.ssoRedirect.trim() === "" ? null : this.config.ssoRedirect,
      socialOpener: Platform.OS === "web" || callbackScheme === "" ? null : robleNativeOpener(callbackScheme),
    });
    return this.database;
  }

  get currentUserId(): string | null {
    return this.isConfigured ? this.db.currentUserId : null;
  }

  static readonly projects = "projects";
  static readonly tasks = "project_tasks";
  /** Título y descripción de las tareas "Solo equipo" (tabla NO pública). */
  static readonly taskPrivate = "project_task_private";
  static readonly requests = "project_requests";
  static readonly decisions = "request_decisions";
  static readonly members = "project_members";
  static readonly comments = "project_comments";
  static readonly follows = "project_follows";
  static readonly notifications = "app_notifications";
  static readonly profiles = "user_profiles";
  static readonly messages = "direct_messages";
  /** Metadata de los archivos de proyectos guardados en el bucket (R2). */
  static readonly attachments = "project_attachments";
}

/** Equivalente del `StateError` de Dart (lo traducen robleGuard y errorMessage). */
export class StateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StateError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
