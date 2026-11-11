import { AppFailure } from "@/src/core/errors/appFailure";

/** Falta configuración obligatoria (contract id, SSO...) antes de llamar a Roble. */
export class AuthConfigurationException extends AppFailure {}

/** El registro usó un correo fuera del dominio institucional. */
export class NonInstitutionalEmailException extends AppFailure {
  constructor(readonly domain: string) {
    super("El correo debe pertenecer al dominio institucional.");
  }

  toString() {
    return `El correo debe pertenecer al dominio ${this.domain}.`;
  }
}

/** Roble respondió 429. [retryAfterMs] es el `Retry-After` si se pudo leer. */
export class AuthRateLimitedException extends AppFailure {
  constructor(readonly retryAfterMs: number | null = null) {
    super("Demasiadas solicitudes. Intenta de nuevo en un momento.");
  }

  toString() {
    return "Demasiadas solicitudes. Intenta de nuevo en un momento.";
  }
}

/** El proveedor social pedido no está habilitado en el proyecto de Roble. */
export class AuthProviderUnavailableException extends AppFailure {
  constructor(readonly provider: string) {
    super("Proveedor no habilitado en Roble.");
  }

  toString() {
    return `${this.provider} aun no esta habilitado en Roble. Pide al administrador del proyecto que lo configure.`;
  }
}
