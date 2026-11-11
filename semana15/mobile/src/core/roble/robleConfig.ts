// Equivalente de core/roble/roble_config.dart (RobleAuthConfig).
// En Flutter los valores llegaban por --dart-define (dart_defines.json / .env).
// Aquí llegan con los MISMOS nombres a través de app.config.ts → `extra.env`,
// que lee el archivo .env (o dart_defines.json como respaldo).
import Constants from "expo-constants";

export type RobleEnv = {
  ROBLE_BASE_URL?: string;
  ROBLE_CONTRACT_ID?: string;
  ROBLE_SSO_REDIRECT?: string;
  ROBLE_NATIVE_CALLBACK_SCHEME?: string;
  INSTITUTIONAL_EMAIL_DOMAIN?: string;
};

export const DEFAULT_ROBLE_BASE_URL = "https://roble-api.test-openlab.uninorte.edu.co";
export const DEFAULT_INSTITUTIONAL_EMAIL_DOMAIN = "uninorte.edu.co";

function readEnv(): RobleEnv {
  const extra = (Constants.expoConfig?.extra ?? {}) as { env?: RobleEnv };
  return extra.env ?? {};
}

export class RobleAuthConfig {
  constructor(
    readonly baseUrl: string,
    readonly contractId: string,
    readonly ssoRedirect: string,
    readonly nativeCallbackScheme: string,
    readonly institutionalEmailDomain: string,
  ) {}

  static fromEnvironment(env: RobleEnv = readEnv()): RobleAuthConfig {
    return new RobleAuthConfig(
      env.ROBLE_BASE_URL || DEFAULT_ROBLE_BASE_URL,
      env.ROBLE_CONTRACT_ID ?? "",
      env.ROBLE_SSO_REDIRECT ?? "",
      env.ROBLE_NATIVE_CALLBACK_SCHEME ?? "",
      env.INSTITUTIONAL_EMAIL_DOMAIN ?? DEFAULT_INSTITUTIONAL_EMAIL_DOMAIN,
    );
  }

  get isConfigured(): boolean {
    return this.contractId.trim().length > 0;
  }

  isInstitutionalEmail(email: string): boolean {
    const domain = this.institutionalEmailDomain.trim().toLowerCase();
    if (!domain) return true;
    return email.trim().toLowerCase().endsWith(`@${domain}`);
  }
}
