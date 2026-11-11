import { RobleClient } from "@/src/core/roble/robleClient";
import { Row } from "@/src/core/roble/sdk/robleOwnership";

import { IAttachmentDataSource } from "./iAttachmentDataSource";

/** Habla con Roble (almacenamiento + tabla `project_attachments`). No decide nada. */
export class RobleAttachmentDataSource implements IAttachmentDataSource {
  private static readonly table = RobleClient.attachments;

  constructor(private readonly client: RobleClient) {}

  get hasSession(): boolean {
    return this.client.currentUserId != null;
  }
  upload(args: { fileName: string; mimeType?: string | null; data: Blob; folder: string }) {
    return this.client.db.uploadFile(args);
  }
  downloadUrl(fileId: string) {
    return this.client.db.getFileDownloadUrl(fileId);
  }
  removeObject(fileId: string) {
    return this.client.db.removeFile(fileId);
  }
  readForProject(projectId: string) {
    return this.client.db.read(RobleAttachmentDataSource.table, { filters: { projectId } });
  }
  create(row: Row) {
    return this.client.db.create(RobleAttachmentDataSource.table, row);
  }
  async delete(id: string) {
    await this.client.db.delete(RobleAttachmentDataSource.table, id);
  }
  async readLocal(uri: string): Promise<Blob> {
    const res = await fetch(uri);
    return res.blob();
  }
}
