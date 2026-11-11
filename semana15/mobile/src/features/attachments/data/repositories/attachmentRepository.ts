import { robleGuard } from "@/src/core/roble/robleGuard";
import { RobleRows } from "@/src/core/roble/robleRows";
import { RobleSchema } from "@/src/core/roble/robleSchema";
import { RobleApiNotFoundException } from "@/src/core/roble/sdk/robleExceptions";
import { Row } from "@/src/core/roble/sdk/robleOwnership";
import { AttachmentPolicy } from "@/src/features/projects/domain/models/projectAttachment";

import { AttachmentFailure } from "../../domain/attachmentFailure";
import { StorageFolders, StoredFile } from "../../domain/models/storedFile";
import { IAttachmentRepository, LocalFile } from "../../domain/repositories/iAttachmentRepository";
import { IAttachmentDataSource } from "../datasources/iAttachmentDataSource";

/** Las URLs firmadas de Roble duran unos minutos: se reutilizan 4 min como máximo. */
const URL_TTL_MS = 4 * 60 * 1000;

export const ImagePolicy = {
  allowedExtensions: ["jpg", "jpeg", "png", "webp", "heic"] as const,
  maxBytes: 5 * 1024 * 1024,
  validate(file: LocalFile): string | null {
    const ext = AttachmentPolicy.extensionOf(file.name);
    const mimeOk = (file.mimeType ?? "").startsWith("image/");
    if (!(ImagePolicy.allowedExtensions as readonly string[]).includes(ext) && !mimeOk) {
      return "La imagen debe ser JPG, PNG, WEBP o HEIC.";
    }
    if (file.size != null && file.size > ImagePolicy.maxBytes) return "La imagen pesa más de 5 MB.";
    return null;
  },
};

/**
 * Archivos de proyectos. Sube al bucket con URL firmada (las credenciales
 * de R2 viven solo en Roble), registra la metadata y entrega URLs firmadas
 * temporales para mostrar o descargar.
 */
export class AttachmentRepository implements IAttachmentRepository {
  private readonly urlCache = new Map<string, { url: string; at: number }>();

  constructor(private readonly source: IAttachmentDataSource) {}

  private guard<T>(action: () => Promise<T>) {
    return robleGuard(action, (m) => new AttachmentFailure(m), { notFound: "Ese archivo ya no existe." });
  }

  async uploadProjectImage(file: LocalFile): Promise<string> {
    const error = ImagePolicy.validate(file);
    if (error) throw new AttachmentFailure(error);
    const data = await this.source.readLocal(file.uri);
    const { fileId } = await this.guard(() =>
      this.source.upload({
        fileName: file.name,
        mimeType: file.mimeType ?? data.type ?? null,
        data,
        folder: StorageFolders.projectImages,
      }),
    );
    return fileId;
  }

  async uploadProjectDocument(projectId: string, file: LocalFile): Promise<StoredFile> {
    if (!projectId) throw new AttachmentFailure("Guarda el proyecto antes de adjuntar documentos.");
    const error = AttachmentPolicy.validate({ name: file.name, size: file.size ?? null }, []);
    if (error) throw new AttachmentFailure(error);
    const data = await this.source.readLocal(file.uri);
    const mimeType = file.mimeType ?? (data.type || null);
    const { fileId } = await this.guard(() =>
      this.source.upload({ fileName: file.name, mimeType, data, folder: StorageFolders.projectDocuments }),
    );
    try {
      const row = await this.source.create({
        projectId,
        fileId,
        fileName: file.name,
        extension: AttachmentPolicy.extensionOf(file.name),
        mimeType,
        sizeBytes: file.size ?? data.size,
        folder: StorageFolders.projectDocuments,
        kind: "document",
        createdAt: RobleRows.nowIso(),
      });
      return this.toFile(row);
    } catch (e) {
      // Sin la fila, el archivo quedaría huérfano en el bucket: se borra.
      await this.source.removeObject(fileId).catch(() => {});
      if (RobleSchema.isMissingTable(e)) {
        throw new AttachmentFailure("Falta la tabla project_attachments en Roble (ver ROBLE_CAMBIOS.md).");
      }
      return this.guard(() => Promise.reject(e));
    }
  }

  async documentsFor(projectId: string): Promise<StoredFile[]> {
    if (!this.source.hasSession) return [];
    const rows = await this.guard(() => this.source.readForProject(projectId));
    return rows
      .map((r) => this.toFile(r))
      .filter((f) => f.kind === "document")
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async removeDocument(file: StoredFile): Promise<void> {
    await this.guard(async () => {
      try {
        await this.source.removeObject(file.fileId);
      } catch (e) {
        if (!(e instanceof RobleApiNotFoundException)) throw e;
      }
      await this.source.delete(file.id);
    });
    this.urlCache.delete(file.fileId);
  }

  async downloadUrl(fileId: string): Promise<string | null> {
    if (!fileId || !this.source.hasSession) return null;
    const cached = this.urlCache.get(fileId);
    if (cached && Date.now() - cached.at < URL_TTL_MS) return cached.url;
    const { downloadUrl } = await this.guard(() => this.source.downloadUrl(fileId));
    this.urlCache.set(fileId, { url: downloadUrl, at: Date.now() });
    return downloadUrl;
  }

  private toFile(row: Row): StoredFile {
    const kind = RobleRows.str(row.kind) === "image" ? "image" : "document";
    return new StoredFile(
      RobleRows.str(row._id),
      RobleRows.str(row.projectId),
      RobleRows.str(row.fileId),
      RobleRows.str(row.fileName, "archivo"),
      RobleRows.str(row.extension),
      RobleRows.strOrNull(row.mimeType),
      row.sizeBytes == null ? null : RobleRows.integer(row.sizeBytes),
      RobleRows.str(row.folder),
      kind,
      RobleRows.author(row, "uploadedBy"),
      RobleRows.date(row.createdAt),
    );
  }
}
