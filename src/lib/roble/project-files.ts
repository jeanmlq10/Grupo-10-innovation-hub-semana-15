import type { RobleAuthConfig } from "./auth.ts";
import { readRobleRows, RobleProjectReadFailure } from "./own-projects.ts";

type Row = Record<string, unknown>;
export type ProjectFile = { id: string; name: string; sizeBytes: number | null; downloadUrl: string };
export type ProjectFiles = { imageUrl: string | null; documents: ProjectFile[]; documentsVisible: boolean; documentsAvailable: boolean };
const row = (value: unknown): Row | null => value && typeof value === "object" && !Array.isArray(value) ? value as Row : null;
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

function safeDownloadUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) ? url.toString() : null; }
  catch { return null; }
}

async function signedUrl(config: RobleAuthConfig, token: string, fileId: string): Promise<string | null> {
  if (!fileId || fileId.length > 200) return null;
  const url = new URL(`/database/${encodeURIComponent(config.contractId)}/storage/objects/${encodeURIComponent(fileId)}`, config.baseUrl);
  try {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    return safeDownloadUrl(row(data)?.downloadUrl);
  } catch { return null; }
}

export async function readProjectFiles(config: RobleAuthConfig, token: string, userId: string, projectId: string): Promise<ProjectFiles | null> {
  if (!userId || !projectId || projectId.length > 100) return null;
  const projects = await readRobleRows(config, token, "projects", { _id: projectId });
  const project = projects.map(row).find(item => item && text(item._id) === projectId && !text(item.deletedAt));
  if (!project) return null;
  const owner = text(project._owner);
  const mine = owner === userId;
  const publicProject = (project.isDraft === false || project.isDraft === "false") && text(project.audience) === "Toda la comunidad";
  if (!mine && !publicProject) return null;

  const imageUrl = await signedUrl(config, token, text(project.imageFileId));
  let documentsVisible = mine;
  if (!documentsVisible) {
    const members = await readRobleRows(config, token, "project_members", { projectId });
    documentsVisible = members.some(value => { const member = row(value); return member && text(member.projectId) === projectId && text(member.userId) === userId && text(member._owner) === owner; });
  }
  if (!documentsVisible) return { imageUrl, documents: [], documentsVisible: false, documentsAvailable: true };

  let attachments: unknown[];
  try { attachments = await readRobleRows(config, token, "project_attachments", { projectId }); }
  catch (cause) {
    if (cause instanceof RobleProjectReadFailure && cause.status !== 401) return { imageUrl, documents: [], documentsVisible: true, documentsAvailable: false };
    throw cause;
  }
  const documents = await Promise.all(attachments.flatMap(value => {
    const file = row(value);
    const id = text(file?._id), fileId = text(file?.fileId), name = text(file?.fileName);
    if (!file || text(file.projectId) !== projectId || text(file.kind) !== "document" || !id || !fileId || !name) return [];
    return [{ id, fileId, name, sizeBytes: typeof file.sizeBytes === "number" && Number.isFinite(file.sizeBytes) ? file.sizeBytes : null }];
  }).map(async file => ({ id: file.id, name: file.name, sizeBytes: file.sizeBytes, downloadUrl: await signedUrl(config, token, file.fileId) })));
  return { imageUrl, documents: documents.flatMap(file => file.downloadUrl ? [{ ...file, downloadUrl: file.downloadUrl }] : []), documentsVisible: true, documentsAvailable: true };
}
