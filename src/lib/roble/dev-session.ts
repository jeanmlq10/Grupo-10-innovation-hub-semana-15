import { randomBytes } from "node:crypto";
import type { RobleIdentity, RobleTokens } from "./auth";

export type DevSession = { tokens: RobleTokens; identity: RobleIdentity; expiresAt: number };
const lifetimeMs = 8 * 60 * 60 * 1000;
const shared = globalThis as typeof globalThis & { __proyectateDevSessions?: Map<string, DevSession> };
function sessions(): Map<string, DevSession> { return shared.__proyectateDevSessions ??= new Map(); }
export const devSessionCookie = "proyectate_roble_dev_session";
export const devSessionMaxAge = lifetimeMs / 1000;

export function createDevSession(tokens: RobleTokens, identity: RobleIdentity): string {
  const id = randomBytes(32).toString("base64url");
  const now = Date.now();
  for (const [key, session] of sessions()) if (session.expiresAt <= now) sessions().delete(key);
  sessions().set(id, { tokens, identity, expiresAt: now + lifetimeMs });
  return id;
}
export function getDevSession(id: string | undefined): DevSession | null {
  if (!id) return null;
  const session = sessions().get(id);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) { sessions().delete(id); return null; }
  return session;
}
export function deleteDevSession(id: string | undefined): void { if (id) sessions().delete(id); }
