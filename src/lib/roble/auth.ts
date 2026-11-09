export type RobleIdentity = { userId: string; email: string; name: string };
export type RobleTokens = { accessToken: string; refreshToken: string | null };
export type RobleAuthConfig = { baseUrl: string; contractId: string };

export class RobleAuthFailure extends Error {
  readonly status: 401 | 429 | 502 | 503;
  constructor(status: 401 | 429 | 502 | 503) { super("Error de autenticación de Roble"); this.status = status; }
}

export function authConfig(): RobleAuthConfig {
  const baseUrl = process.env.ROBLE_BASE_URL, contractId = process.env.ROBLE_CONTRACT_ID;
  if (!baseUrl || !contractId) throw new RobleAuthFailure(503);
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new RobleAuthFailure(503);
    return { baseUrl: url.origin, contractId };
  } catch { throw new RobleAuthFailure(503); }
}

async function request(config: RobleAuthConfig, endpoint: string, options: { method?: "GET" | "POST"; token?: string; body?: unknown } = {}): Promise<{ status: number; data: unknown }> {
  const url = new URL(`/auth/${encodeURIComponent(config.contractId)}/${endpoint}`, config.baseUrl);
  try {
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await response.json().catch(() => null);
    return { status: response.status, data };
  } catch { throw new RobleAuthFailure(503); }
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function nonempty(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function tokensFrom(value: unknown): RobleTokens {
  const data = record(value), accessToken = nonempty(data.accessToken);
  if (!accessToken) throw new RobleAuthFailure(502);
  return { accessToken, refreshToken: nonempty(data.refreshToken) };
}
function identityFrom(value: unknown): RobleIdentity {
  const data = record(value), userId = nonempty(data.userId);
  if (!userId) throw new RobleAuthFailure(502);
  return { userId, email: nonempty(data.email) ?? "", name: nonempty(data.name) ?? "" };
}

export async function loginToRoble(config: RobleAuthConfig, email: string, password: string): Promise<{ tokens: RobleTokens; identity: RobleIdentity }> {
  const login = await request(config, "login", { method: "POST", body: { email, password } });
  if (login.status === 429) throw new RobleAuthFailure(429);
  if (login.status === 400 || login.status === 401 || login.status === 403) throw new RobleAuthFailure(401);
  if (login.status < 200 || login.status >= 300) throw new RobleAuthFailure(503);
  const tokens = tokensFrom(login.data);
  const identity = await readRobleIdentity(config, tokens.accessToken);
  return { tokens, identity };
}

export async function readRobleIdentity(config: RobleAuthConfig, accessToken: string): Promise<RobleIdentity> {
  const response = await request(config, "me", { token: accessToken });
  if (response.status === 401) throw new RobleAuthFailure(401);
  if (response.status === 429) throw new RobleAuthFailure(429);
  if (response.status < 200 || response.status >= 300) throw new RobleAuthFailure(503);
  return identityFrom(response.data);
}

export async function refreshRobleTokens(config: RobleAuthConfig, refreshToken: string): Promise<RobleTokens> {
  const response = await request(config, "refresh-token", { method: "POST", body: { refreshToken } });
  if (response.status === 401 || response.status === 403) throw new RobleAuthFailure(401);
  if (response.status < 200 || response.status >= 300) throw new RobleAuthFailure(503);
  const rotated = tokensFrom(response.data);
  return { accessToken: rotated.accessToken, refreshToken: rotated.refreshToken ?? refreshToken };
}

export async function logoutFromRoble(config: RobleAuthConfig, accessToken: string): Promise<void> {
  await request(config, "logout", { method: "POST", token: accessToken });
}
