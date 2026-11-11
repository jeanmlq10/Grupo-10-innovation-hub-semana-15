import { StateError } from "@/src/core/roble/robleClient";
import { Controller } from "@/src/core/state/Controller";
import { snackbar } from "@/src/core/ui/overlay";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { ProjectTask, TaskVisibility } from "@/src/features/tasks/domain/models/projectTask";
import { ITaskRepository } from "@/src/features/tasks/domain/repositories/iTaskRepository";

import { Project } from "../../domain/models/project";
import { StoredFile } from "@/src/features/attachments/domain/models/storedFile";
import { IAttachmentRepository, LocalFile } from "@/src/features/attachments/domain/repositories/iAttachmentRepository";

import { AttachmentPolicy, ProjectAttachment } from "../../domain/models/projectAttachment";


import { IProjectRepository } from "../../domain/repositories/iProjectRepository";

/** Un documento de contexto en el asistente: elegido en el dispositivo y/o ya guardado en el bucket. */
export type ContextDocument = {
  key: string;
  name: string;
  extension: string;
  sizeBytes: number | null;
  status: "pending" | "uploading" | "uploaded" | "error";
  local: (ProjectAttachment & { mimeType: string | null }) | null;
  stored: StoredFile | null;
  error?: string;
};

/** ViewModel shared by every step of the "Crear proyecto" wizard. */
export class CreateProjectController extends Controller {
  private static readonly typingDebounceMs = 700;

  static readonly teamRoleOrder = [
    "Desarrollador/a",
    "Diseñador/a",
    "Investigador/a",
    "Comunicador/a",
    "Líder de proyecto",
    "Otro",
  ];

  private static readonly fixedRoles = [
    "Desarrollador/a",
    "Diseñador/a",
    "Investigador/a",
    "Comunicador/a",
    "Líder de proyecto",
  ];

  draftId = "";
  isEditing = false;

  readonly name = this.obs("");
  readonly description = this.obs("");
  /** Mapa ordenado por inserción (como el LinkedHashMap de Dart). */
  readonly teamRoles = this.obs<Map<string, number>>(new Map());
  readonly otherRoleName = this.obs("");
  readonly tasks = this.obs<ProjectTask[]>([]);
  readonly duration = this.obs<string | null>(null);
  readonly audience = this.obs<string | null>(null);
  readonly teamDeadline = this.obs<Date | null>(null);
  readonly isSaving = this.obs(false);
  /** Documentos de contexto: se suben al bucket del proyecto (proyectos/documentos). */
  readonly contextDocuments = this.obs<ContextDocument[]>([]);
  /** Imagen de perfil del proyecto ya subida (id del archivo en el bucket). */
  readonly imageFileId = this.obs<string | null>(null);
  readonly imageUploading = this.obs(false);

  private stored: Project | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveChain: Promise<void> = Promise.resolve();
  private tasksDirty = false;

  constructor(
    readonly projectRepository: IProjectRepository,
    readonly taskRepository: ITaskRepository,
    readonly session: AuthenticationController,
    readonly attachments: IAttachmentRepository,
  ) {
    super();
  }

  private get userId() {
    return this.session.loggedUser?.userId ?? null;
  }

  get canContinue() {
    return this.name.value.trim().length > 0;
  }

  get totalTeamMembers() {
    let sum = 0;
    this.teamRoles.value.forEach((count) => (sum += count));
    return sum;
  }

  onClose() {
    if (this.saveTimer != null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
      this.enqueueSave().catch(() => {});
    }
  }

  private cancelTimer() {
    if (this.saveTimer != null) clearTimeout(this.saveTimer);
    this.saveTimer = null;
  }

  private setRoles(mutate: (m: Map<string, number>) => void) {
    const next = new Map(this.teamRoles.value);
    mutate(next);
    this.teamRoles.value = next;
  }

  private setTasks(mutate: (list: ProjectTask[]) => void) {
    const next = [...this.tasks.value];
    mutate(next);
    this.tasks.value = next;
  }

  startNewDraft() {
    this.cancelTimer();
    this.stored = null;
    this.draftId = "";
    this.isEditing = false;
    this.tasksDirty = false;
    this.name.value = "";
    this.description.value = "";
    this.teamRoles.value = new Map();
    this.otherRoleName.value = "";
    this.tasks.value = [];
    this.duration.value = null;
    this.audience.value = null;
    this.teamDeadline.value = null;
    this.contextDocuments.value = [];
    this.imageFileId.value = null;
  }

  async loadForEdit(id: string): Promise<boolean> {
    this.cancelTimer();
    try {
      const project = await this.projectRepository.getById(id, { viewerId: this.userId });
      if (project == null || project.createdBy !== this.userId) return false;
      const projectTasks = await this.taskRepository.forProject(id, { teamAccess: true });

      this.stored = project;
      this.draftId = project.id;
      this.isEditing = true;
      this.tasksDirty = false;
      this.imageFileId.value = project.imageFileId;
      const stored = await this.attachments.documentsFor(id).catch(() => [] as StoredFile[]);
      this.contextDocuments.value = stored.map((f) => ({
        key: f.id,
        name: f.fileName,
        extension: f.extension,
        sizeBytes: f.sizeBytes,
        status: "uploaded" as const,
        local: null,
        stored: f,
      }));
      this.name.value = project.name;
      this.description.value = project.description;

      const roles = new Map<string, number>();
      this.otherRoleName.value = "";
      for (const [role, count] of Object.entries(project.teamRoles)) {
        if (CreateProjectController.fixedRoles.includes(role)) {
          roles.set(role, count);
        } else {
          roles.set("Otro", (roles.get("Otro") ?? 0) + count);
          if (role !== "Otro") this.otherRoleName.value = role;
        }
      }
      this.teamRoles.value = roles;

      this.tasks.value = [...projectTasks];
      this.duration.value = project.duration;
      this.audience.value = project.audience;
      this.teamDeadline.value = project.teamDeadline;
      return true;
    } catch (error) {
      this.reportError(error);
      return false;
    }
  }

  updateName(value: string) {
    this.name.value = value;
    this.scheduleSave();
  }

  updateDescription(value: string) {
    this.description.value = value;
    this.scheduleSave();
  }

  roleCount(role: string) {
    return this.teamRoles.value.get(role) ?? 0;
  }

  incrementRole(role: string) {
    const next = this.roleCount(role) + 1;
    this.setRoles((m) => m.set(role, next));
    this.scheduleSave();
  }

  decrementRole(role: string) {
    const current = this.roleCount(role);
    if (current <= 0) return;
    this.setRoles((m) => m.set(role, current - 1));
    this.scheduleSave();
  }

  setOtherRoleName(value: string) {
    this.otherRoleName.value = value;
    this.scheduleSave();
  }

  addTask(title: string) {
    const clean = title.trim();
    if (!clean) return;
    this.setTasks((l) => l.push(new ProjectTask({ id: "", projectId: this.draftId, title: clean })));
    this.tasksDirty = true;
    this.scheduleSave();
  }

  removeTask(index: number) {
    if (index < 0 || index >= this.tasks.value.length) return;
    this.setTasks((l) => l.splice(index, 1));
    this.tasksDirty = true;
    this.scheduleSave();
  }

  incrementTask(index: number) {
    if (index < 0 || index >= this.tasks.value.length) return;
    const task = this.tasks.value[index];
    this.setTasks((l) => (l[index] = task.copyWith({ numberNeeded: task.numberNeeded + 1 })));
    this.tasksDirty = true;
    this.scheduleSave();
  }

  decrementTask(index: number) {
    if (index < 0 || index >= this.tasks.value.length) return;
    const task = this.tasks.value[index];
    if (task.numberNeeded <= 1) return;
    this.setTasks((l) => (l[index] = task.copyWith({ numberNeeded: task.numberNeeded - 1 })));
    this.tasksDirty = true;
    this.scheduleSave();
  }

  /** "Público" o "Solo equipo" (Corrección 4.2). */
  setTaskVisibility(index: number, visibility: TaskVisibility) {
    if (index < 0 || index >= this.tasks.value.length) return;
    if (this.tasks.value[index].visibility === visibility) return;
    this.setTasks((l) => (l[index] = l[index].copyWith({ visibility })));
    this.tasksDirty = true;
    this.scheduleSave();
  }

  /**
   * Agrega un documento si cumple la política (formato, tamaño, cantidad) y
   * lo sube al bucket. Si el proyecto todavía no existe en Roble, primero se
   * guarda el borrador. Devuelve el error de validación o `null`.
   */
  addContextDocument(file: { name: string; size?: number | null; mimeType?: string | null; uri: string }): string | null {
    const existing = this.contextDocuments.value
      .filter((d) => d.status !== "error")
      .map((d) => new ProjectAttachment(d.name, d.extension, d.sizeBytes, null, ""));
    const error = AttachmentPolicy.validate(file, existing);
    if (error != null) return error;
    const local = Object.assign(
      new ProjectAttachment(file.name, AttachmentPolicy.extensionOf(file.name), file.size ?? null, file.mimeType ?? null, file.uri),
      { mimeType: file.mimeType ?? null },
    );
    this.contextDocuments.value = [
      ...this.contextDocuments.value,
      {
        key: `${Date.now()}-${file.name}`,
        name: file.name,
        extension: local.extension,
        sizeBytes: local.sizeBytes,
        status: "pending",
        local,
        stored: null,
      },
    ];
    void this.uploadPendingDocuments();
    return null;
  }

  async removeContextDocument(index: number) {
    const doc = this.contextDocuments.value[index];
    if (doc == null || doc.status === "uploading") return;
    if (doc.stored != null) {
      try {
        await this.attachments.removeDocument(doc.stored);
      } catch (error) {
        snackbar("Documentos", errorMessage(error, { fallback: "No se pudo quitar el documento." }), { position: "BOTTOM" });
        return;
      }
    }
    this.contextDocuments.value = this.contextDocuments.value.filter((d) => d.key !== doc.key);
  }

  /** Reintenta un documento que falló. */
  retryContextDocument(index: number) {
    const doc = this.contextDocuments.value[index];
    if (doc == null || doc.status !== "error") return;
    this.patchDocument(doc.key, { status: "pending", error: undefined });
    void this.uploadPendingDocuments();
  }

  private patchDocument(key: string, patch: Partial<ContextDocument>) {
    this.contextDocuments.value = this.contextDocuments.value.map((d) => (d.key === key ? { ...d, ...patch } : d));
  }

  private uploadingDocs = false;

  private async uploadPendingDocuments() {
    if (this.uploadingDocs) return;
    this.uploadingDocs = true;
    try {
      if (this.draftId === "") {
        try {
          await this.flush();
        } catch (error) {
          this.reportError(error);
          return;
        }
        if (this.draftId === "") return;
      }
      for (;;) {
        const next = this.contextDocuments.value.find((d) => d.status === "pending" && d.local != null);
        if (next == null) break;
        this.patchDocument(next.key, { status: "uploading" });
        try {
          const stored = await this.attachments.uploadProjectDocument(this.draftId, {
            name: next.local!.name,
            uri: next.local!.localUri,
            mimeType: next.local!.mimeType,
            size: next.local!.sizeBytes,
          });
          this.patchDocument(next.key, { status: "uploaded", stored, local: null });
        } catch (error) {
          this.patchDocument(next.key, { status: "error", error: errorMessage(error, { fallback: "No se pudo subir." }) });
        }
      }
    } finally {
      this.uploadingDocs = false;
    }
  }

  /** Sube la imagen de perfil del proyecto al bucket y la guarda en el proyecto. */
  async setProjectImage(file: LocalFile): Promise<boolean> {
    if (this.imageUploading.value) return false;
    this.imageUploading.value = true;
    try {
      this.imageFileId.value = await this.attachments.uploadProjectImage(file);
      await this.flush();
      return true;
    } catch (error) {
      snackbar("Imagen del proyecto", errorMessage(error, { fallback: "No se pudo subir la imagen." }), { position: "BOTTOM" });
      return false;
    } finally {
      this.imageUploading.value = false;
    }
  }

  setTeamDeadline(value: Date) {
    this.teamDeadline.value = new Date(value.getFullYear(), value.getMonth(), value.getDate());
    this.scheduleSave();
  }

  updateTaskDescription(index: number, value: string) {
    if (index < 0 || index >= this.tasks.value.length) return;
    if (this.tasks.value[index].description === value) return;
    this.setTasks((l) => (l[index] = l[index].copyWith({ description: value })));
    this.tasksDirty = true;
    this.scheduleSave();
  }

  setTaskDeadline(index: number, value: Date) {
    if (index < 0 || index >= this.tasks.value.length) return;
    this.setTasks(
      (l) => (l[index] = l[index].copyWith({ deadline: new Date(value.getFullYear(), value.getMonth(), value.getDate()) })),
    );
    this.tasksDirty = true;
    this.scheduleSave();
  }

  selectDuration(value: string) {
    this.duration.value = value;
    this.scheduleSave();
  }

  selectAudience(value: string) {
    this.audience.value = value;
    this.flush().catch((e) => this.reportError(e));
  }

  flush(): Promise<void> {
    this.cancelTimer();
    return this.enqueueSave();
  }

  async finish(): Promise<boolean> {
    try {
      await this.flush();
      return this.draftId !== "";
    } catch (error) {
      this.reportError(error);
      return false;
    }
  }

  private scheduleSave() {
    this.cancelTimer();
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.enqueueSave().catch((e) => this.reportError(e));
    }, CreateProjectController.typingDebounceMs);
  }

  private enqueueSave(): Promise<void> {
    const next = this.saveChain.then(() => this.saveNow());
    this.saveChain = next.catch(() => {});
    return next;
  }

  private async saveNow() {
    this.isSaving.value = true;
    try {
      const user = this.session.loggedUser;
      if (user == null) throw new StateError("Debes iniciar sesión para guardar.");
      const base = this.stored ?? new Project({ id: "", name: "", description: "", categories: [] });
      const updated = base.copyWith({
        name: this.name.value,
        description: this.description.value,
        canApply: true,
        teamRoles: this.resolvedTeamRoles,
        duration: this.duration.value,
        audience: this.audience.value,
        isDraft: this.audience.value !== "Toda la comunidad",
        teamDeadline: this.teamDeadline.value,
        createdByName: base.createdByName ?? user.name,
        imageFileId: this.imageFileId.value,
      });

      if (this.draftId === "") {
        this.stored = await this.projectRepository.create(updated.copyWith({ createdBy: user.userId }));
        this.draftId = this.stored.id;
        this.tasksDirty = this.tasks.value.length > 0;
      } else {
        this.stored = await this.projectRepository.save(updated);
      }

      if (this.tasksDirty) {
        this.tasksDirty = false;
        const stored = await this.taskRepository.sync(this.draftId, [...this.tasks.value]);
        if (!this.tasksDirty) this.tasks.value = [...stored];
      }
    } finally {
      this.isSaving.value = false;
    }
  }

  private reportError(error: unknown) {
    console.error(`CreateProjectController: save failed: ${error}`);
    snackbar("No se pudo guardar", errorMessage(error, { fallback: "Revisa tu conexión e inténtalo de nuevo." }), {
      position: "BOTTOM",
    });
  }

  private get resolvedTeamRoles(): Record<string, number> {
    const resolved: Record<string, number> = {};
    this.teamRoles.value.forEach((count, role) => {
      if (count <= 0) return;
      if (role === "Otro") {
        const customName = this.otherRoleName.value.trim();
        resolved[customName === "" ? "Otro" : customName] = count;
      } else {
        resolved[role] = count;
      }
    });
    return resolved;
  }
}
