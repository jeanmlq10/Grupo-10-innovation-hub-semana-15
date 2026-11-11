import { Row } from "@/src/core/roble/sdk/robleOwnership";

/** Almacenamiento de Roble (bucket del proyecto) y filas de `project_attachments`. */
export interface IAttachmentDataSource {
  get hasSession(): boolean;
  upload(args: { fileName: string; mimeType?: string | null; data: Blob; folder: string }): Promise<{ fileId: string }>;
  downloadUrl(fileId: string): Promise<{ downloadUrl: string; fileName: string }>;
  removeObject(fileId: string): Promise<void>;
  readForProject(projectId: string): Promise<Row[]>;
  create(row: Row): Promise<Row>;
  delete(id: string): Promise<void>;
  /** Lee los bytes de un archivo local (uri de expo-image-picker / document-picker). */
  readLocal(uri: string): Promise<Blob>;
}
