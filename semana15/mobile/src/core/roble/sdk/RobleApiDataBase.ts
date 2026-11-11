// Port a TypeScript del cliente `RobleApiDataBase` del paquete oficial `roble`
// (Dart v1.12.0, el que fija el pubspec.lock del proyecto Flutter).
//
// Sólo incluye lo que la app usa, pero cada método habla con el MISMO endpoint,
// con el MISMO método HTTP, las MISMAS cabeceras y el MISMO cuerpo que el SDK
// original (ver lib/src/roble_api_database_impl.dart):
//
//   auth  → {baseUrl}/auth/{contractId}/...
//           POST signup, verify-email, resend-code, login, logout,
//           refresh-token, forgot-password, reset-password · GET me
//           GET auth/providers · POST auth/{provider}/start · POST auth/token
//   datos → {baseUrl}/database/{contractId}/...
//           POST insert-one · GET read · PUT update · DELETE delete
//           GET public-read (sin Authorization)
//
// También conserva: refresco automático del access token ante un 401 (una sola
// vez), persistencia de la sesión en almacenamiento seguro con la clave
// `roble.session.{contractId}`, y el `_owner` fuera de lo que se envía.
import * as Crypto from "expo-crypto";

import {
  RobleApiAuthException,
  RobleApiConflictException,
  RobleApiException,
  RobleApiFormatException,
  RobleApiHttpException,
  RobleApiNetworkException,
  RobleApiTimeoutException,
  robleHttpError,
} from "./robleExceptions";
import { Row, robleJwtPayload, robleOwnerColumn, robleWithoutOwner } from "./robleOwnership";
import { RobleSecureStorage, RobleTokenStorage } from "./robleStorage";

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export class RobleApiConfig {
  private constructor(
    readonly authUrl: string,
    readonly dataUrl: string,
    readonly timeoutMs: number,
  ) {}

  static readonly defaultTimeoutMs = 30_000;

  /** Igual que `RobleApiConfig.fromContract`. */
  static fromContract({
    baseUrl,
    contractId,
    timeoutMs = RobleApiConfig.defaultTimeoutMs,
  }: {
    baseUrl: string;
    contractId: string;
    timeoutMs?: number;
  }): RobleApiConfig {
    if (!baseUrl.startsWith("http")) {
      throw new Error(`baseUrl inválido (${baseUrl}): debe empezar por http:// o https://`);
    }
    const id = contractId.trim();
    if (!id) {
      throw new Error(
        'contractId no puede estar vacío. Es el identificador del proyecto en la consola de Roble, algo como "miproyecto_ab12cd34ef"',
      );
    }
    if (id === "tu_contrato" || id === "mi_contrato" || id.includes(" ")) {
      throw new Error("contractId no parece un contrato real. Cópialo de la consola de Roble");
    }
    const host = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    return new RobleApiConfig(`${host}/auth/${contractId}`, `${host}/database/${contractId}`, timeoutMs);
  }
}

export enum RobleSocialProvider {
  google = "google",
  microsoft = "microsoft",
}

export type RobleProviderInfo = {
  name: string;
  displayName: string;
  autoLinkSupported: boolean;
  clientId: string | null;
};

/** Abre el proveedor y devuelve la URL de retorno (con `?code=`). */
export type RobleSocialOpener = (loginUrl: string, timeoutMs: number) => Promise<string>;

type RequestOptions = {
  body?: unknown;
  queryParams?: Record<string, string>;
  isAuthRequest?: boolean;
  skipAuth?: boolean;
};

const PKCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

export class RobleApiDataBase {
  readonly config: RobleApiConfig;
  readonly storage: RobleTokenStorage;
  readonly ssoRedirect: string | null;
  readonly socialOpener: RobleSocialOpener | null;

  private readonly fetchFn: FetchFn;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private persistTokens = true;
  private pkceVerifier: string | null = null;
  private readonly storageKey: string;

  constructor({
    config,
    fetchFn,
    storage,
    ssoRedirect,
    socialOpener,
  }: {
    config: RobleApiConfig;
    fetchFn?: FetchFn;
    storage?: RobleTokenStorage;
    ssoRedirect?: string | null;
    socialOpener?: RobleSocialOpener | null;
  }) {
    this.config = config;
    this.fetchFn = fetchFn ?? ((input, init) => fetch(input, init));
    this.storage = storage ?? new RobleSecureStorage();
    if (ssoRedirect != null && ssoRedirect.trim() === "") {
      throw new Error('ssoRedirect no puede estar vacío; omítelo para usar "default"');
    }
    this.ssoRedirect = ssoRedirect?.trim() ?? null;
    this.socialOpener = socialOpener ?? null;
    this.storageKey = `roble.session.${config.authUrl.split("/").pop()}`;
  }

  // ============================== SESIÓN ==============================

  get isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  /** Id del usuario de la sesión (el `sub` del token), sin ir al servidor. */
  get currentUserId(): string | null {
    const sub = robleJwtPayload(this.accessToken)?.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  }

  private updateAccessToken(token: string | null) {
    this.accessToken = token;
    void this.persistSession();
  }

  private clearTokens() {
    this.refreshToken = null;
    this.updateAccessToken(null);
  }

  /**
   * Restaura la sesión y comprueba que siga siendo válida (renovando el access
   * token). Los fallos de red/tiempo se propagan; un token revocado limpia la
   * sesión y devuelve `false`.
   */
  async restoreSession({ verify = true }: { verify?: boolean } = {}): Promise<boolean> {
    if (this.refreshToken == null) await this.loadStoredSession();
    if (this.refreshToken == null) return false;
    this.persistTokens = true;
    if (!verify) return true;
    try {
      await this.refreshAccessToken();
      await this.currentUser();
      return true;
    } catch (e) {
      if (e instanceof RobleApiNetworkException || e instanceof RobleApiTimeoutException) throw e;
      this.clearTokens();
      return false;
    }
  }

  private async forgetStoredSession() {
    try {
      await this.storage.removeItem(this.storageKey);
    } catch {
      // nada que borrar
    }
  }

  private async loadStoredSession() {
    try {
      const raw = await this.storage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      const access = data.accessToken as string | undefined;
      const refresh = data.refreshToken as string | undefined;
      if (!access || !refresh) return;
      this.refreshToken = refresh;
      this.updateAccessToken(access);
    } catch {
      // sesión corrupta: se empieza de cero
    }
  }

  private async persistSession() {
    try {
      const access = this.accessToken;
      const refresh = this.refreshToken;
      if (access && refresh) {
        if (!this.persistTokens) return;
        await this.storage.setItem(this.storageKey, JSON.stringify({ accessToken: access, refreshToken: refresh }));
      } else {
        await this.storage.removeItem(this.storageKey);
      }
    } catch {
      // almacenamiento no disponible: la sesión sigue en memoria
    }
  }

  // ============================ HTTP INTERNO ============================

  private buildUri(baseUrl: string, endpoint: string, queryParams?: Record<string, string>) {
    const url = endpoint === "" ? baseUrl : `${baseUrl}/${endpoint}`;
    if (!queryParams) return url;
    const qs = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    return qs ? `${url}?${qs}` : url;
  }

  private buildHeaders(skipAuth: boolean): Record<string, string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (!skipAuth && this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
    return headers;
  }

  private async makeRequest(method: string, endpoint: string, opts: RequestOptions = {}): Promise<unknown> {
    const { body, queryParams, isAuthRequest = false, skipAuth = false } = opts;
    const baseUrl = isAuthRequest ? this.config.authUrl : this.config.dataUrl;
    const uri = this.buildUri(baseUrl, endpoint, queryParams);
    const headers = this.buildHeaders(skipAuth);

    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.config.timeoutMs);

    let response: Response;
    let text: string;
    try {
      response = await this.fetchFn(uri, {
        method: method.toUpperCase(),
        headers,
        body: body !== undefined && method.toUpperCase() !== "GET" ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      text = await response.text();
    } catch (e) {
      if (e instanceof RobleApiException) throw e;
      if (timedOut) throw new RobleApiTimeoutException("Tiempo de espera agotado");
      throw new RobleApiNetworkException("Sin conexión a internet");
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 200 && response.status < 300) {
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }

    // 🔁 401 con sesión: se refresca el token una vez y se reintenta.
    if (response.status === 401 && this.refreshToken != null && !isAuthRequest && !skipAuth) {
      try {
        await this.refreshAccessToken();
      } catch (e) {
        this.clearTokens();
        throw new RobleApiAuthException(`Token expirado y no se pudo refrescar: ${e}`);
      }
      return this.makeRequest(method, endpoint, opts);
    }

    let msg: string;
    let codigo: unknown;
    if (!text) {
      msg = "El servidor respondió sin cuerpo";
    } else {
      try {
        const decoded = JSON.parse(text);
        const detail =
          decoded && typeof decoded === "object" && !Array.isArray(decoded)
            ? (decoded.message ?? decoded.error)
            : undefined;
        msg = detail != null ? (Array.isArray(detail) ? `[${detail.join(", ")}]` : `${detail}`) : text;
        const raw = decoded && typeof decoded === "object" ? decoded.code : undefined;
        codigo = typeof raw === "string" && raw.length > 0 ? raw : undefined;
      } catch {
        msg = text;
      }
    }
    if (isAuthRequest && response.status === 500) {
      msg = `${msg} — revisa que el contractId sea correcto (${this.config.authUrl.split("/").pop()})`;
    }
    throw robleHttpError(response.status, msg, codigo);
  }

  // ============================ AUTENTICACIÓN ============================

  async registerWithVerification(args: {
    email: string;
    password: string;
    name: string;
    extra?: Record<string, unknown>;
  }): Promise<Row> {
    const res = await this.makeRequest("POST", "signup", {
      body: {
        email: args.email,
        password: args.password,
        name: args.name,
        ...(args.extra != null ? { extra: args.extra } : {}),
      },
      isAuthRequest: true,
    });
    return isMap(res) ? res : {};
  }

  async verifyEmail({ email, code }: { email: string; code: string }): Promise<Row> {
    const res = await this.makeRequest("POST", "verify-email", { body: { email, code }, isAuthRequest: true });
    return isMap(res) ? res : {};
  }

  async resendCode({ email }: { email: string }): Promise<Row> {
    const res = await this.makeRequest("POST", "resend-code", { body: { email }, isAuthRequest: true });
    return isMap(res) ? res : {};
  }

  async login({
    email,
    password,
    persistSession = true,
  }: {
    email: string;
    password: string;
    persistSession?: boolean;
  }): Promise<Row> {
    const res = await this.makeRequest("POST", "login", { body: { email, password }, isAuthRequest: true });
    this.persistTokens = persistSession;
    if (!persistSession) await this.forgetStoredSession();
    if (isMap(res)) {
      this.refreshToken = (res.refreshToken as string | undefined) ?? null;
      this.updateAccessToken((res.accessToken as string | undefined) ?? null);
    }
    return this.currentUser();
  }

  async logout(): Promise<void> {
    if (!this.accessToken) throw new RobleApiAuthException("No hay token activo para cerrar sesión.");
    await this.makeRequest("POST", "logout", { isAuthRequest: true });
    this.clearTokens();
  }

  async currentUser(): Promise<Row> {
    const res = await this.makeRequest("GET", "me", { isAuthRequest: true });
    if (isMap(res)) return res;
    throw new RobleApiFormatException("Respuesta inesperada al obtener el usuario.");
  }

  async forgotPassword({ email }: { email: string }): Promise<Row> {
    const res = await this.makeRequest("POST", "forgot-password", { body: { email }, isAuthRequest: true });
    return isMap(res) ? res : {};
  }

  async resetPassword({ token, newPassword }: { token: string; newPassword: string }): Promise<Row> {
    const res = await this.makeRequest("POST", "reset-password", {
      body: { token, newPassword },
      isAuthRequest: true,
    });
    return isMap(res) ? res : {};
  }

  private async refreshAccessToken(): Promise<void> {
    if (this.refreshToken == null) throw new RobleApiAuthException("No hay refresh token disponible.");
    const res = await this.makeRequest("POST", "refresh-token", {
      body: { refreshToken: this.refreshToken },
      isAuthRequest: true,
    });
    if (isMap(res) && "accessToken" in res) {
      const rotated = res.refreshToken as string | undefined;
      if (rotated) this.refreshToken = rotated;
      this.updateAccessToken((res.accessToken as string | undefined) ?? null);
    } else {
      throw new RobleApiAuthException("Respuesta inválida al refrescar el token.");
    }
  }

  // ============================ LOGIN SOCIAL ============================

  async listProviders(): Promise<RobleProviderInfo[]> {
    const res = await this.makeRequest("GET", "auth/providers", { isAuthRequest: true, skipAuth: true });
    if (Array.isArray(res)) {
      return res.filter(isMap).map((json) => ({
        name: (json.name as string) ?? "",
        displayName: (json.displayName as string) ?? "",
        autoLinkSupported: json.autoLinkSupported === true,
        clientId: (json.clientId as string | undefined) ?? null,
      }));
    }
    throw new RobleApiFormatException("Respuesta inesperada al listar los proveedores.");
  }

  private async generatePkce(): Promise<{ verifier: string; challenge: string }> {
    const bytes = Crypto.getRandomBytes(64);
    let verifier = "";
    for (let i = 0; i < 64; i++) verifier += PKCE_ALPHABET[bytes[i] % PKCE_ALPHABET.length];
    const b64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, {
      encoding: Crypto.CryptoEncoding.BASE64,
    });
    const challenge = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return { verifier, challenge };
  }

  async startSocialLogin(provider: string, { extra }: { extra?: Row } = {}): Promise<string> {
    const pkce = await this.generatePkce();
    const res = await this.makeRequest("POST", `auth/${provider}/start`, {
      isAuthRequest: true,
      skipAuth: true,
      body: {
        codeChallenge: pkce.challenge,
        ...(this.ssoRedirect != null ? { redirect: this.ssoRedirect } : {}),
        ...(extra && Object.keys(extra).length > 0 ? { extra } : {}),
      },
    });
    if (!isMap(res) || typeof res.url !== "string") {
      throw new RobleApiFormatException("El servidor no devolvió la URL de inicio del proveedor.");
    }
    this.pkceVerifier = pkce.verifier;
    return res.url;
  }

  async exchangeSocialCode(code: string, { persistSession = true } = {}): Promise<Row> {
    const verifier = this.pkceVerifier;
    this.pkceVerifier = null;
    let res: unknown;
    try {
      res = await this.makeRequest("POST", "auth/token", {
        isAuthRequest: true,
        skipAuth: true,
        body: { code, ...(verifier != null ? { codeVerifier: verifier } : {}) },
      });
    } catch (e) {
      if (e instanceof RobleApiHttpException && e.statusCode === 409 && !(e instanceof RobleApiConflictException)) {
        throw new RobleApiConflictException(e.message);
      }
      throw e;
    }
    this.persistTokens = persistSession;
    if (!persistSession) await this.forgetStoredSession();
    if (isMap(res)) {
      this.refreshToken = (res.refreshToken as string | undefined) ?? null;
      this.updateAccessToken((res.accessToken as string | undefined) ?? null);
    }
    if (!this.isLoggedIn) throw new RobleApiFormatException("La respuesta no incluyó un access token.");
    return this.currentUser();
  }

  async signInWithProvider(
    provider: RobleSocialProvider,
    { timeoutMs = 5 * 60_000, opener }: { timeoutMs?: number; opener?: RobleSocialOpener } = {},
  ): Promise<Row> {
    const abrir = opener ?? this.socialOpener;
    if (!abrir) {
      throw new RobleApiAuthException("No hay un socialOpener configurado para abrir el proveedor en esta plataforma.");
    }
    const url = await this.startSocialLogin(provider);
    const callback = await abrir(url, timeoutMs);
    const params = parseQuery(callback);
    const code = params.code;
    if (!code) {
      const error = params.error;
      throw new RobleApiAuthException(
        error != null
          ? `El proveedor rechazó el inicio de sesión: ${error}`
          : "La URL de retorno no trae ningún código de autorización.",
      );
    }
    return this.exchangeSocialCode(code);
  }

  // ================================ DATOS ================================

  /** `POST /insert-one` — devuelve la fila creada con su `_id`. */
  async create(tableName: string, data: Row): Promise<Row> {
    const res = await this.makeRequest("POST", "insert-one", {
      body: { tableName, record: robleWithoutOwner(data) },
    });
    if (isMap(res)) return res;
    throw new RobleApiFormatException("No se pudo insertar el registro");
  }

  /** `GET /read?tableName=…&col=valor` (filtros de igualdad). */
  async read(tableName: string, { filters }: { filters?: Record<string, unknown> } = {}): Promise<Row[]> {
    const queryParams: Record<string, string> = { tableName };
    if (filters) for (const [k, v] of Object.entries(filters)) queryParams[k] = String(v);
    const res = await this.makeRequest("GET", "read", { queryParams });
    if (Array.isArray(res)) return res as Row[];
    if (isMap(res) && Array.isArray(res.data)) return res.data as Row[];
    return [];
  }

  /** `PUT /update` con `{tableName, idColumn: "_id", idValue, updates}`. */
  async update(tableName: string, id: unknown, data: Row): Promise<Row> {
    const updates = { ...data };
    delete updates._id;
    delete updates.id;
    delete updates[robleOwnerColumn];
    const res = await this.makeRequest("PUT", "update", {
      body: { tableName, idColumn: "_id", idValue: id, updates },
    });
    return isMap(res) ? res : {};
  }

  /** `DELETE /delete` con `{tableName, idColumn: "_id", idValue}`. */
  async delete(tableName: string, id: unknown): Promise<Row> {
    const res = await this.makeRequest("DELETE", "delete", {
      body: { tableName, idColumn: "_id", idValue: id },
    });
    return isMap(res) ? res : {};
  }

  /** `GET /public-read` sin `Authorization` (tablas públicas). */
  async publicRead(tableName: string, { filters }: { filters?: Record<string, unknown> } = {}): Promise<Row[]> {
    const queryParams: Record<string, string> = { tableName };
    if (filters) for (const [k, v] of Object.entries(filters)) queryParams[k] = String(v);
    const res = await this.makeRequest("GET", "public-read", { queryParams, skipAuth: true });
    if (Array.isArray(res)) return res as Row[];
    if (isMap(res) && Array.isArray(res.data)) return res.data as Row[];
    return [];
  }

  // ============================== ARCHIVOS ==============================
  // Port de `RobleFileStorage` del paquete oficial `roble-client` (v3.11):
  // los bytes van directo entre la app y el bucket del proyecto (Cloudflare
  // R2) con URLs firmadas; Roble solo firma y guarda la metadata. Las
  // credenciales del bucket nunca llegan a la app.

  /** `POST storage/objects` → URL firmada · `PUT` al bucket · `POST …/complete`. */
  async uploadFile({
    fileName,
    mimeType,
    data,
    folder,
  }: {
    fileName: string;
    mimeType?: string | null;
    data: Blob;
    folder?: string | null;
  }): Promise<{ fileId: string }> {
    const res = await this.makeRequest("POST", "storage/objects", {
      body: {
        fileName,
        ...(mimeType ? { mimeType } : {}),
        sizeBytes: data.size,
        ...(folder ? { folder } : {}),
      },
    });
    if (!isMap(res) || typeof res.uploadUrl !== "string" || res.fileId == null) {
      throw new RobleApiFormatException("Respuesta inesperada al pedir la URL de subida.");
    }
    const fileId = String(res.fileId);
    let put: Response;
    try {
      put = await fetch(res.uploadUrl, {
        method: "PUT",
        headers: mimeType ? { "Content-Type": mimeType } : undefined,
        body: data,
      });
    } catch {
      throw new RobleApiNetworkException("No se pudo subir el archivo al bucket (sin conexión).");
    }
    if (!put.ok) throw new RobleApiException(`No se pudo subir el archivo al bucket: HTTP ${put.status}`);
    await this.makeRequest("POST", `storage/objects/${encodeURIComponent(fileId)}/complete`);
    return { fileId };
  }

  /** `GET storage/objects[?folder=]` — archivos ya confirmados. */
  async listFiles(folder?: string | null): Promise<Row[]> {
    const res = await this.makeRequest("GET", "storage/objects", { queryParams: folder ? { folder } : undefined });
    return Array.isArray(res) ? (res as Row[]) : [];
  }

  /** `GET storage/objects/{id}` — URL firmada de descarga (vence en minutos). */
  async getFileDownloadUrl(fileId: string): Promise<{ downloadUrl: string; fileName: string }> {
    const res = await this.makeRequest("GET", `storage/objects/${encodeURIComponent(fileId)}`);
    if (!isMap(res) || typeof res.downloadUrl !== "string") {
      throw new RobleApiFormatException("Respuesta inesperada al pedir la URL de descarga.");
    }
    return { downloadUrl: res.downloadUrl, fileName: String(res.fileName ?? "") };
  }

  /** `DELETE storage/objects/{id}` — solo quien lo subió. */
  async removeFile(fileId: string): Promise<void> {
    await this.makeRequest("DELETE", `storage/objects/${encodeURIComponent(fileId)}`);
  }

  async getById(tableName: string, id: unknown): Promise<Row | null> {
    const results = await this.read(tableName, { filters: { _id: id } });
    return results.length > 0 ? results[0] : null;
  }
}

function isMap(value: unknown): value is Row {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function parseQuery(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const q = url.indexOf("?");
  if (q < 0) return out;
  const hash = url.indexOf("#", q);
  const query = url.substring(q + 1, hash < 0 ? undefined : hash);
  for (const part of query.split("&")) {
    if (!part) continue;
    const [k, v = ""] = part.split("=");
    out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, " "));
  }
  return out;
}
