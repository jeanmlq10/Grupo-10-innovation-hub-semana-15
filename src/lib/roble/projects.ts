export type PublishedProject = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  createdByName: string | null;
  acceptedMembersCount: number;
};

type ExploreResult =
  | { status: "pending" }
  | { status: "error" }
  | { status: "loaded"; projects: PublishedProject[] };

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function categories(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function rowsFromResponse(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "data" in value && Array.isArray(value.data)) return value.data;
  throw new Error("Respuesta de Roble inesperada");
}

export function publishedProjectsFromResponse(value: unknown): PublishedProject[] {
  return rowsFromResponse(value).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const isPublished = row.isDraft === false || row.isDraft === "false";
    if (!isPublished || text(row.audience) !== "Toda la comunidad" || text(row.deletedAt)) return [];
    const id = text(row._id);
    const name = text(row.name);
    if (!id || !name) return [];
    const count = Number(row.acceptedMembersCount);
    return [{
      id,
      name,
      description: text(row.description),
      categories: categories(row.categories),
      createdByName: text(row.createdByName) || null,
      acceptedMembersCount: Number.isFinite(count) && count >= 0 ? count : 0,
    }];
  });
}

export async function getPublishedProjects(): Promise<ExploreResult> {
  // Roble currently exposes drafts through public-read. Keep live data disabled
  // until the server-side read permissions are corrected and verified.
  if (process.env.ROBLE_PUBLIC_READ_ENABLED !== "true") return { status: "pending" };

  const baseUrl = process.env.ROBLE_BASE_URL;
  const contractId = process.env.ROBLE_CONTRACT_ID;
  if (!baseUrl || !contractId) return { status: "error" };

  try {
    const url = new URL(`${baseUrl.replace(/\/$/, "")}/database/${encodeURIComponent(contractId)}/public-read`);
    url.searchParams.set("tableName", "projects");
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Roble respondió ${response.status}`);
    const body: unknown = await response.json();
    return { status: "loaded", projects: publishedProjectsFromResponse(body) };
  } catch (error) {
    console.error("No se pudieron consultar proyectos públicos en Roble", error);
    return { status: "error" };
  }
}
