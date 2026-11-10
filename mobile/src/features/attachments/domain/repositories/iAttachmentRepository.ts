import { StoredFile } from "../models/storedFile";

/** Un archivo elegido en el dispositivo, listo para subir. */
export type LocalFile = { name: string; uri: string; mimeType?: string | null; size?: number | null };

/** Archivos de proyectos: bucket R2 (vía Roble) + tabla `project_attachments`. */
export interface IAttachmentRepository {
  /** Sube la imagen de perfil del proyecto y devuelve su `fileId` (se guarda en `projects.imageFileId`). */
  uploadProjectImage(file: LocalFile): Promise<string>;
  /** Sube un documento de contexto y lo asocia al proyecto. */
  uploadProjectDocument(projectId: string, file: LocalFile): Promise<StoredFile>;
  documentsFor(projectId: string): Promise<StoredFile[]>;
  /** Borra el documento (solo quien lo subió puede hacerlo en Roble). */
  removeDocument(file: StoredFile): Promise<void>;
  /** URL firmada temporal para ver o descargar el archivo. `null` sin sesión. */
  downloadUrl(fileId: string): Promise<string | null>;
}
