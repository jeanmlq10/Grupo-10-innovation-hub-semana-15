/** Carpetas del bucket `movil-archivos` (Cloudflare R2), conectado en Roble. */
export const StorageFolders = {
  userAvatars: "usuarios/avatares",
  projectImages: "proyectos/imagenes",
  projectDocuments: "proyectos/documentos",
  commentAttachments: "comentarios/adjuntos",
} as const;

export type AttachmentKind = "document" | "image";

/**
 * Un archivo guardado en el bucket y registrado en `project_attachments`.
 * NO trae URL: las URLs de descarga son firmadas y caducan en minutos; se
 * piden con `IAttachmentRepository.downloadUrl(fileId)` al momento de usarlas.
 */
export class StoredFile {
  constructor(
    /** `_id` de la fila en `project_attachments`. */
    readonly id: string,
    readonly projectId: string,
    /** Id del objeto en el almacenamiento de Roble. */
    readonly fileId: string,
    readonly fileName: string,
    readonly extension: string,
    readonly mimeType: string | null,
    readonly sizeBytes: number | null,
    readonly folder: string,
    readonly kind: AttachmentKind,
    readonly uploadedBy: string | null,
    readonly createdAt: Date | null,
  ) {}

  get sizeLabel(): string {
    if (this.sizeBytes == null) return "";
    if (this.sizeBytes < 1024) return `${this.sizeBytes} B`;
    if (this.sizeBytes < 1024 * 1024) return `${(this.sizeBytes / 1024).toFixed(0)} KB`;
    return `${(this.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
