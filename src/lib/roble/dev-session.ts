import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRobleIdentity, refreshRobleTokens, RobleAuthFailure, type RobleAuthConfig, type RobleIdentity, type RobleTokens } from "./auth.ts";

export type DevSession = { tokens: RobleTokens; identity: RobleIdentity; expiresAt: number };
const lifetimeMs = 8 * 60 * 60 * 1000;
const directory = join(tmpdir(), `proyectate-roble-${createHash("sha256").update(process.cwd()).digest("hex").slice(0, 16)}`);
const shared = globalThis as typeof globalThis & { __proyectateSessionLocks?: Map<string, Promise<void>> };
const locks = shared.__proyectateSessionLocks ??= new Map<string, Promise<void>>();
export const devSessionCookie = "proyectate_roble_dev_session";
export const devSessionMaxAge = lifetimeMs / 1000;

function pathFor(id: string | undefined): string | null {
  return id && /^[A-Za-z0-9_-]{43}$/.test(id) ? join(directory, id) : null;
}

function save(id: string, session: DevSession): void {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = pathFor(id);
  if (!path) throw new Error("Invalid session ID");
  const temporary = `${path}.${randomBytes(8).toString("hex")}`;
  try {
    writeFileSync(temporary, JSON.stringify(session), { mode: 0o600, flag: "wx" });
    renameSync(temporary, path);
  } finally {
    try { unlinkSync(temporary); } catch { /* Already renamed. */ }
  }
}

export function createDevSession(tokens: RobleTokens, identity: RobleIdentity): string {
  const id = randomBytes(32).toString("base64url");
  save(id, { tokens, identity, expiresAt: Date.now() + lifetimeMs });
  return id;
}

export function getDevSession(id: string | undefined): DevSession | null {
  const path = pathFor(id);
  if (!path) return null;
  try {
    const session = JSON.parse(readFileSync(path, "utf8")) as DevSession;
    if (!session || session.expiresAt <= Date.now() || !session.tokens?.accessToken || !session.identity?.userId) {
      deleteDevSession(id);
      return null;
    }
    return session;
  } catch { return null; }
}

export function deleteDevSession(id: string | undefined): void {
  const path = pathFor(id);
  if (path) try { unlinkSync(path); } catch { /* Already removed. */ }
}

async function locked<T>(id: string, action: () => Promise<T>): Promise<T> {
  const previous = locks.get(id) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const tail = previous.then(() => gate);
  locks.set(id, tail);
  await previous;
  try { return await action(); }
  finally {
    release();
    if (locks.get(id) === tail) locks.delete(id);
  }
}

export async function refreshDevSession(id: string | undefined, staleAccessToken: string, config: RobleAuthConfig): Promise<DevSession> {
  if (!id || !pathFor(id)) throw new RobleAuthFailure(401);
  return locked(id, async () => {
    const session = getDevSession(id);
    if (!session) throw new RobleAuthFailure(401);
    if (session.tokens.accessToken !== staleAccessToken) return session;
    if (!session.tokens.refreshToken) throw new RobleAuthFailure(401);
    const tokens = await refreshRobleTokens(config, session.tokens.refreshToken);
    const identity = await readRobleIdentity(config, tokens.accessToken);
    if (identity.userId !== session.identity.userId) {
      deleteDevSession(id);
      throw new RobleAuthFailure(401);
    }
    const updated = { ...session, tokens, identity };
    save(id, updated);
    return updated;
  });
}
