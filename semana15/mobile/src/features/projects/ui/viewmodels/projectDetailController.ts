import { StateError } from "@/src/core/roble/robleClient";
import { Controller } from "@/src/core/state/Controller";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { ICommentRepository } from "@/src/features/comments/domain/repositories/iCommentRepository";
import { IFollowRepository } from "@/src/features/follows/domain/repositories/iFollowRepository";
import { MemberSourceType, ProjectMember } from "@/src/features/members/domain/models/projectMember";
import { IMemberRepository } from "@/src/features/members/domain/repositories/iMemberRepository";
import { AppNotificationType } from "@/src/features/notifications/domain/models/appNotification";
import { INotificationRepository } from "@/src/features/notifications/domain/repositories/iNotificationRepository";
import { ProjectTask, TaskProgress, TaskVisibility } from "@/src/features/tasks/domain/models/projectTask";
import { ITaskRepository } from "@/src/features/tasks/domain/repositories/iTaskRepository";

import { StoredFile } from "@/src/features/attachments/domain/models/storedFile";
import { IAttachmentRepository } from "@/src/features/attachments/domain/repositories/iAttachmentRepository";

import { Project } from "../../domain/models/project";
import { ProjectTeamRole } from "../../domain/models/projectTeamRole";
import { IProjectRepository } from "../../domain/repositories/iProjectRepository";

/** Lo que muestra la pestaña "Resumen" de un proyecto. */
export type ProjectOverview = {
  /** Todas las tareas (las "Solo equipo" sin contenido si no hay acceso): sirven para el avance. */
  allTasks: ProjectTask[];
  /** Las tareas que este lector puede ver. */
  visibleTasks: ProjectTask[];
  members: ProjectMember[];
  /** Creador o integrante del equipo. */
  teamAccess: boolean;
  /** Documentos de contexto: solo para el creador y su equipo. */
  documents: StoredFile[];
};

/** ViewModel de "Ver proyecto". */
export class ProjectDetailController extends Controller {
  readonly projects: IProjectRepository;
  readonly tasks: ITaskRepository;
  readonly members: IMemberRepository;
  readonly comments: ICommentRepository;
  readonly follows: IFollowRepository;
  readonly notifications: INotificationRepository;
  readonly session: AuthenticationController;
  readonly attachments: IAttachmentRepository;

  constructor(d: {
    projects: IProjectRepository;
    tasks: ITaskRepository;
    members: IMemberRepository;
    comments: ICommentRepository;
    follows: IFollowRepository;
    session: AuthenticationController;
    notifications: INotificationRepository;
    attachments: IAttachmentRepository;
  }) {
    super();
    this.attachments = d.attachments;
    this.projects = d.projects;
    this.tasks = d.tasks;
    this.members = d.members;
    this.comments = d.comments;
    this.follows = d.follows;
    this.session = d.session;
    this.notifications = d.notifications;
  }

  get currentUserId() {
    return this.session.loggedUser?.userId ?? null;
  }

  get isGuest() {
    return this.session.isGuest;
  }

  isOwner(project: Project) {
    return this.currentUserId != null && project.createdBy === this.currentUserId;
  }

  projectById(id: string) {
    return this.projects.getById(id, { viewerId: this.currentUserId, publicAccess: this.isGuest });
  }

  /**
   * ¿Puede este lector ver las tareas "Solo equipo"? Solo el creador y los
   * integrantes registrados por el creador.
   */
  async hasTeamAccess(project: Project): Promise<boolean> {
    if (this.isGuest || this.currentUserId == null) return false;
    if (this.isOwner(project)) return true;
    const owner = project.createdBy;
    if (owner == null) return false;
    try {
      const members = await this.members.forProject(project.id, { ownerId: owner });
      return members.some((m) => m.userId === this.currentUserId);
    } catch {
      return false;
    }
  }

  /** Tareas que este lector puede ver (las "Solo equipo" solo si es del equipo). */
  async tasksFor(projectId: string): Promise<ProjectTask[]> {
    const project = await this.projectById(projectId);
    if (project == null) return [];
    const teamAccess = await this.hasTeamAccess(project);
    const all = await this.tasks.forProject(projectId, { publicAccess: this.isGuest, teamAccess });
    return all.filter((t) => !t.isTeamOnly || (teamAccess && !t.hiddenContent));
  }

  async overview(project: Project): Promise<ProjectOverview> {
    const teamAccess = await this.hasTeamAccess(project);
    const [allTasks, members, documents] = await Promise.all([
      this.tasks.forProject(project.id, { publicAccess: this.isGuest, teamAccess }),
      this.membersFor(project.id).catch(() => [] as ProjectMember[]),
      teamAccess ? this.attachments.documentsFor(project.id).catch(() => [] as StoredFile[]) : Promise.resolve([] as StoredFile[]),
    ]);
    return {
      allTasks,
      visibleTasks: allTasks.filter((t) => !t.isTeamOnly || (teamAccess && !t.hiddenContent)),
      members,
      teamAccess,
      documents,
    };
  }

  /** URL firmada temporal para abrir un documento (solo creador y equipo). */
  async documentUrl(project: Project, file: StoredFile): Promise<string> {
    if (!(await this.hasTeamAccess(project))) throw new StateError("Solo el equipo del proyecto puede ver sus documentos.");
    const url = await this.attachments.downloadUrl(file.fileId);
    if (url == null) throw new StateError("Inicia sesión para ver los documentos.");
    return url;
  }

  async setTaskVisibility(project: Project, task: ProjectTask, visibility: TaskVisibility) {
    if (!this.isOwner(project)) throw new StateError("Solo el creador del proyecto puede cambiar la visibilidad.");
    await this.tasks.setVisibility(project.id, task, visibility);
  }

  /** Número de comentarios del proyecto (para el icono). `null` si no se puede saber. */
  async commentCount(projectId: string): Promise<number | null> {
    if (this.isGuest) return null;
    try {
      return (await this.comments.forProject(projectId)).length;
    } catch {
      return null;
    }
  }

  async setTaskProgress(project: Project, task: ProjectTask, progress: TaskProgress) {
    if (!this.isOwner(project)) throw new StateError("Solo el creador del proyecto puede cambiar el estado.");
    await this.tasks.setProgress(task, progress);
    if (progress === TaskProgress.completed) await this.notifyTaskCompleted(project, task);
  }

  private async notifyTaskCompleted(project: Project, task: ProjectTask) {
    const me = this.currentUserId;
    if (me == null) return;
    try {
      const assigned = new Set(
        (await this.members.forProject(project.id, { ownerId: me }))
          .filter(
            (m) =>
              m.sourceType === MemberSourceType.task && (m.sourceId === task.id || m.role === task.title) && m.userId !== me,
          )
          .map((m) => m.userId),
      );
      const myName = this.session.loggedUser?.name ?? "El creador";
      for (const userId of assigned) {
        await this.notifications.send({
          recipientUserId: userId,
          type: AppNotificationType.taskCompleted,
          title: "Tarea completada",
          message: `${myName} marcó como completada la tarea ${task.title}.`,
          projectId: project.id,
          actorUserId: me,
          actorName: myName,
          detail: task.title,
        });
      }
    } catch {
      // igual que en Flutter: el aviso es opcional
    }
  }

  async rolesFor(projectId: string): Promise<ProjectTeamRole[]> {
    const project = await this.projectById(projectId);
    return project == null ? [] : this.projects.rolesOf(project);
  }

  async membersFor(projectId: string): Promise<ProjectMember[]> {
    if (this.isGuest) return [];
    const project = await this.projects.getById(projectId, { viewerId: this.currentUserId });
    const owner = project?.createdBy;
    if (owner == null) return [];
    return this.members.forProject(projectId, { ownerId: owner });
  }

  async isFollowing(projectId: string) {
    const userId = this.currentUserId;
    if (userId == null) return false;
    return this.follows.isFollowing(projectId, userId);
  }

  async toggleFollow(projectId: string) {
    const userId = this.currentUserId;
    if (userId == null) throw new StateError("Debes iniciar sesión para seguir proyectos.");
    return this.follows.toggle(projectId, userId);
  }
}
