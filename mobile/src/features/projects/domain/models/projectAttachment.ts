/**
 * Documento de contexto de un proyecto (Corrección 7).
 *
 * HOY: solo existe la selección LOCAL del archivo (nombre, extensión,
 * tamaño). No se sube a ningún lado y no queda guardado en el proyecto.
 * PENDIENTE: subirlo a Roble Storage y guardar su referencia en la tabla
 * `project_attachments` (ver ROBLE_CAMBIOS.md y PENDIENTES.md).
 */
export class ProjectAttachment {
  constructor(
    readonly name: string,
    readonly extension: string,
    readonly sizeBytes: number | null,
    readonly mimeType: string | null,
    /** Ruta local del archivo en el dispositivo (temporal). */
    readonly localUri: string,
  ) {}

  get sizeLabel(): string {
    if (this.sizeBytes == null) return "";
    if (this.sizeBytes < 1024) return `${this.sizeBytes} B`;
    if (this.sizeBytes < 1024 * 1024) return `${(this.sizeBytes / 1024).toFixed(0)} KB`;
    return `${(this.sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export const AttachmentPolicy = {
  /** PDF, Word/OpenDocument, texto y presentaciones (propuestas, investigación...). */
  allowedExtensions: ["pdf", "doc", "docx", "odt", "rtf", "txt", "ppt", "pptx"] as const,
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.oasis.opendocument.text",
    "application/rtf",
    "text/rtf",
    "text/plain",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  maxBytes: 10 * 1024 * 1024,
  maxFiles: 3,

  extensionOf(name: string): string {
    const dot = name.lastIndexOf(".");
    return dot < 0 || dot === name.length - 1 ? "" : name.substring(dot + 1).toLowerCase();
  },

  /** `null` si el archivo se puede adjuntar; si no, el mensaje para la persona. */
  validate(file: { name: string; size?: number | null }, alreadySelected: ProjectAttachment[]): string | null {
    const ext = AttachmentPolicy.extensionOf(file.name);
    if (!(AttachmentPolicy.allowedExtensions as readonly string[]).includes(ext)) {
      return `"${file.name}" no es un formato permitido. Usa PDF, Word (DOC, DOCX, ODT, RTF), TXT o PowerPoint (PPT, PPTX).`;
    }
    if (file.size != null && file.size > AttachmentPolicy.maxBytes) {
      return `"${file.name}" pesa más de 10 MB.`;
    }
    if (file.size === 0) return `"${file.name}" está vacío.`;
    if (alreadySelected.some((a) => a.name === file.name && a.sizeBytes === (file.size ?? null))) {
      return `"${file.name}" ya está adjunto.`;
    }
    if (alreadySelected.length >= AttachmentPolicy.maxFiles) {
      return `Puedes adjuntar hasta ${AttachmentPolicy.maxFiles} documentos.`;
    }
    return null;
  },
};
