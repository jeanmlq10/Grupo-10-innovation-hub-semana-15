// Port a TypeScript de las excepciones del paquete oficial `roble` (Dart,
// v1.12.0 — github.com/augustosalazar/roble_api_database). Misma jerarquía y
// mismos códigos, para que el resto de la app las trate igual que en Flutter.

export class RobleApiException extends Error {
  readonly code?: unknown;

  constructor(message: string, code?: unknown) {
    super(message);
    this.name = "RobleApiException";
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class RobleApiNetworkException extends RobleApiException {
  constructor(message: string, code?: unknown) {
    super(message, code);
    this.name = "RobleApiNetworkException";
  }
}

export class RobleApiHttpException extends RobleApiException {
  readonly statusCode: number;

  constructor(statusCode: number, message: string, code?: unknown) {
    super(message, code);
    this.name = "RobleApiHttpException";
    this.statusCode = statusCode;
  }
}

export class RobleApiFormatException extends RobleApiException {
  constructor(message: string) {
    super(message);
    this.name = "RobleApiFormatException";
  }
}

export class RobleApiTimeoutException extends RobleApiException {
  constructor(message: string) {
    super(message);
    this.name = "RobleApiTimeoutException";
  }
}

export class RobleApiAuthException extends RobleApiException {
  constructor(message: string) {
    super(message);
    this.name = "RobleApiAuthException";
  }
}

export class RobleApiForbiddenException extends RobleApiHttpException {
  constructor(message: string, code?: unknown) {
    super(403, message, code);
    this.name = "RobleApiForbiddenException";
  }
}

export class RobleApiNotFoundException extends RobleApiHttpException {
  constructor(message: string, code?: unknown) {
    super(404, message, code);
    this.name = "RobleApiNotFoundException";
  }
}

export class RobleApiConflictException extends RobleApiHttpException {
  constructor(message: string) {
    super(409, message);
    this.name = "RobleApiConflictException";
  }
}

export class RobleAnonymousAuthException extends RobleApiHttpException {
  constructor(statusCode: number, message: string, code?: unknown) {
    super(statusCode, message, code);
    this.name = "RobleAnonymousAuthException";
  }
}

export class RobleAnonUpgradeEmailTakenException extends RobleApiHttpException {
  constructor(message: string) {
    super(409, message, "ANON_UPGRADE_EMAIL_TAKEN");
    this.name = "RobleAnonUpgradeEmailTakenException";
  }
}

/** Igual que `robleHttpError` del SDK: elige la subclase por código y estado. */
export function robleHttpError(statusCode: number, message: string, code?: unknown): RobleApiHttpException {
  if (code === "ANON_UPGRADE_EMAIL_TAKEN") return new RobleAnonUpgradeEmailTakenException(message);
  if (code === "ANON_AUTH_DISABLED" || code === "ANON_REQUIRES_ROW_OWNERSHIP") {
    return new RobleAnonymousAuthException(statusCode, message, code);
  }
  switch (statusCode) {
    case 403:
      return new RobleApiForbiddenException(message, code);
    case 404:
      return new RobleApiNotFoundException(message, code);
    default:
      return new RobleApiHttpException(statusCode, message, code);
  }
}
