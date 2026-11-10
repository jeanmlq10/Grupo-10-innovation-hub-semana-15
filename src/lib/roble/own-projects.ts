import type { RobleAuthConfig } from "./auth";
import { isOwnedBy } from "./access-policy.ts";

export type OwnRobleProject = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  isDraft: boolean;
  audience: string;
  createdAt: string;
};

export class RobleProjectReadFailure extends Error {
  readonly status: number;
  constructor(status: number) {
    super("No se pudieron leer los proyectos de Roble");
    this.status = status;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown): string { return typeof value === "string" ? value.trim() : ""; }

function categories(value: unknown): string[] {
  if (typeof value === "string") {
    try { return categories(JSON.parse(value)); } catch { return []; }
  }
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map(item => item.trim()).filter(Boolean) : [];
}

export function ownProjectsFromResponse(value: unknown, userId: string): OwnRobleProject[] {
  const data = Array.isArray(value) ? value : record(value)?.data;
  if (!Array.isArray(data)) throw new RobleProjectReadFailure(502);
  if (!userId.trim()) throw new RobleProjectReadFailure(401);
  return data.flatMap(item => {
    const row = record(item);
    if (!row) return [];
    const id = text(row._id), name = text(row.name);
    if (!id || !name) return [];
    if (!isOwnedBy(userId, { _id: id, _owner: text(row._owner) || null })) return [];
    return [{
      id, name, description: text(row.description), categories: categories(row.categories),
      isDraft: row.isDraft !== false && row.isDraft !== "false",
      audience: text(row.audience), createdAt: text(row.createdAt),
    }];
  });
}

export async function readRobleRows(config: RobleAuthConfig, accessToken: string, tableName: string, filters: Record<string, string> = {}): Promise<unknown[]> {
  const url = new URL(`/database/${encodeURIComponent(config.contractId)}/read`, config.baseUrl);
  url.searchParams.set("tableName", tableName);
  for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
  } catch { throw new RobleProjectReadFailure(503); }
  if (response.status === 401) throw new RobleProjectReadFailure(401);
  if (!response.ok) throw new RobleProjectReadFailure(503);
  let body: unknown;
  try { body = await response.json(); } catch { throw new RobleProjectReadFailure(502); }
  const data = Array.isArray(body) ? body : record(body)?.data;
  if (!Array.isArray(data)) throw new RobleProjectReadFailure(502);
  return data;
}

export async function readOwnProjects(config: RobleAuthConfig, accessToken: string, userId: string): Promise<OwnRobleProject[]> {
  if (!userId.trim()) throw new RobleProjectReadFailure(401);
  const rows = await readRobleRows(config, accessToken, "projects", { _owner: userId });
  return ownProjectsFromResponse(rows, userId);
}
