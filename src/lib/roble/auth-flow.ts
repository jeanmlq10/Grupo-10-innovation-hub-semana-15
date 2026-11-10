import { RobleAuthFailure, type RobleAuthConfig } from "./auth.ts";

export const pendingVerificationEmailKey = "proyectate_pending_verification_email";
export const institutionalEmailDomain = (process.env.INSTITUTIONAL_EMAIL_DOMAIN ?? "uninorte.edu.co").trim().toLowerCase();
export const passwordHint = "Mínimo 8 caracteres, con mayúscula, minúscula, número y un símbolo (! @ # $ _ -).";

export function normalizeEmail(value: string) { return value.trim().toLowerCase(); }
export function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254; }
export function institutionalEmail(value: string) { return validEmail(value) && value.split("@")[1] === institutionalEmailDomain; }
export function validPassword(value: string) {
  return value.length >= 8 && value.length <= 1024 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[!@#$_-]/.test(value);
}

async function post(config: RobleAuthConfig, endpoint: string, body: unknown): Promise<number> {
  const url = new URL(`/auth/${encodeURIComponent(config.contractId)}/${endpoint}`, config.baseUrl);
  try {
    const response = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    return response.status;
  } catch { throw new RobleAuthFailure(503); }
}
function successful(status: number) { return status >= 200 && status < 300; }

export async function beginRegistration(config: RobleAuthConfig, input: { email: string; password: string; name: string; career: string }) {
  const status = await post(config, "signup", {
    email: input.email, password: input.password, name: input.name,
    ...(input.career ? { extra: { career: input.career } } : {}),
  });
  if (successful(status)) return;
  if (status === 429) throw new RobleAuthFailure(429);
  if (status === 409) throw new RobleAuthFailure(409);
  if (status === 400 || status === 422) throw new RobleAuthFailure(400);
  throw new RobleAuthFailure(503);
}

export async function verifyRegistration(config: RobleAuthConfig, email: string, code: string) {
  const status = await post(config, "verify-email", { email, code });
  if (successful(status)) return;
  if (status === 429) throw new RobleAuthFailure(429);
  if ([400, 401, 404, 422].includes(status)) throw new RobleAuthFailure(400);
  throw new RobleAuthFailure(503);
}

export async function resendVerification(config: RobleAuthConfig, email: string) {
  const status = await post(config, "resend-code", { email });
  if (successful(status) || [400, 404].includes(status)) return;
  if (status === 429) throw new RobleAuthFailure(429);
  throw new RobleAuthFailure(503);
}

export async function requestPasswordRecovery(config: RobleAuthConfig, email: string) {
  const status = await post(config, "forgot-password", { email });
  if (successful(status) || [400, 404].includes(status)) return;
  if (status === 429) throw new RobleAuthFailure(429);
  throw new RobleAuthFailure(503);
}

export async function completePasswordRecovery(config: RobleAuthConfig, token: string, newPassword: string) {
  const status = await post(config, "reset-password", { token, newPassword });
  if (successful(status)) return;
  if (status === 429) throw new RobleAuthFailure(429);
  if ([400, 401, 404, 422].includes(status)) throw new RobleAuthFailure(400);
  throw new RobleAuthFailure(503);
}
