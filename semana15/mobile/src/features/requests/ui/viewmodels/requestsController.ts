import { StateError } from "@/src/core/roble/robleClient";
import { Controller } from "@/src/core/state/Controller";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { MemberSourceType, ProjectMember } from "@/src/features/members/domain/models/projectMember";
import { IMemberRepository } from "@/src/features/members/domain/repositories/iMemberRepository";
import { AppNotificationType } from "@/src/features/notifications/domain/models/appNotification";
import { INotificationRepository } from "@/src/features/notifications/domain/repositories/iNotificationRepository";
import { Project } from "@/src/features/projects/domain/models/project";
import { ProjectTeamRole } from "@/src/features/projects/domain/models/projectTeamRole";
import { IProjectRepository } from "@/src/features/projects/domain/repositories/iProjectRepository";
import { ProjectTask } from "@/src/features/tasks/domain/models/projectTask";
import { ITaskRepository } from "@/src/features/tasks/domain/repositories/iTaskRepository";

import { ParticipationRequest, RequestStatus, RequestType } from "../../domain/models/participationRequest";
import { IRequestRepository } from "../../domain/repositories/iRequestRepository";

/** ViewModel de las solicitudes: enviar (tarea o equipo) y, para el dueno, aceptar o rechazar. */
export class RequestsController extends Controller {
  readonly requests: IRequestRepository;
  readonly projects: IProjectRepository;
  readonly tasks: ITaskRepository;
  readonly members: IMemberRepository;
  readonly notifications: INotificationRepository;
  readonly session: AuthenticationController;

  constructor(d: {
    requests: IRequestRepository;
    projects: IProjectRepository;
    tasks: ITaskRepository;
    members: IMemberRepository;
    notifications: INotificationRepository;
    session: AuthenticationController;
  }) {
    super();
    this.requests = d.requests;
    this.projects = d.projects;
    this.tasks = d.tasks;
    this.members = d.members;
    this.notifications = d.notifications;
    this.session = d.session;
  }

  private get me(): string {
    const id = this.session.loggedUser?.userId;
    if (!id) throw new StateError("Debes iniciar sesión para hacer esto.");
    return id;
  }

  private get myName(): string {
    const user = this.session.loggedUser;
    return user?.name ?? user?.email ?? "Usuario";
  }

  submitTaskRequest({ project, task, message }: { project: Project; task: ProjectTask; message: string }) {
    return this.submit(
      project,
      new ParticipationRequest({
        id: "",
        projectId: project.id,
        role: task.title,
        message,
        type: RequestType.task,
        taskId: task.id,
      }),
    );
  }

  submitTeamRequest({ project, role, message }: { project: Project; role: ProjectTeamRole; message: string }) {
    return this.submit(
      project,
      new ParticipationRequest({
        id: "",
        projectId: project.id,
        role: role.role,
        message,
        type: RequestType.team,
        teamRoleId: role.id,
      }),
    );
  }

  private async submit(project: Project, draft: ParticipationRequest) {
    const me = this.me;
    const fresh = await this.projects.getById(project.id, { viewerId: me });
    if (fresh == null || !fresh.isPublic) throw new StateError("Este proyecto no recibe solicitudes.");
    if (fresh.createdBy === me) throw new StateError("No puedes postularte a tu propio proyecto.");
    if (draft.type === RequestType.team && !fresh.isTeamCallOpenAt()) {
      throw new StateError("La convocatoria para unirse al equipo ya cerró.");
    }
    if (draft.type === RequestType.task) {
      const current = (await this.tasks.forProject(fresh.id)).filter((t) => t.id === draft.taskId);
      if (current.length === 0 || !current[0].canApplyAt()) throw new StateError("La postulación a esta tarea ya cerró.");
    }
    const created = await this.requests.submit(
      new ParticipationRequest({
        id: "",
        projectId: draft.projectId,
        role: draft.role,
        message: draft.message,
        type: draft.type,
        taskId: draft.taskId,
        teamRoleId: draft.teamRoleId,
        applicantName: this.myName,
        applicantUserId: me,
        applicantEmail: this.session.loggedUser?.email ?? null,
      }),
    );
    const owner = fresh.createdBy;
    if (owner != null) {
      const projectName = fresh.name === "" ? "sin nombre" : fresh.name;
      const isTask = draft.type === RequestType.task;
      await this.notify({
        recipient: owner,
        type: isTask ? AppNotificationType.taskApplication : AppNotificationType.newRequest,
        title: isTask ? "Nueva postulación a tarea" : "Solicitud para unirse al equipo",
        message: isTask
          ? `${this.myName} se postuló a la tarea ${draft.role}.`
          : `${this.myName} quiere unirse a tu proyecto ${projectName}.`,
        projectId: fresh.id,
        requestId: created.id,
        actorUserId: me,
        actorName: this.myName,
        detail: draft.role,
      });
    }
  }

  async requestFor(projectId: string, requestId: string): Promise<ParticipationRequest | null> {
    const me = this.me;
    await this.ownedProject(projectId, me);
    const found = (await this.requests.forProject(projectId, { ownerId: me })).filter((r) => r.id === requestId);
    return found.length === 0 ? null : found[0];
  }

  async requestsForMyProjects(): Promise<ParticipationRequest[]> {
    const me = this.session.loggedUser?.userId;
    if (me == null) return [];
    const mine = await this.projects.ownedBy(me);
    return this.requests.forProjects(new Map(mine.map((p) => [p.id, p.name])), { ownerId: me });
  }

  async acceptRequest(request: ParticipationRequest) {
    const me = this.me;
    let project = await this.ownedProject(request.projectId, me);
    if (!(await this.isPending(request, me))) return;

    const current = await this.members.forProject(project.id, { ownerId: me });
    const alreadyMember = current.some((m) => m.userId === request.applicantUserId && m.role === request.role);

    await this.requests.decide(request.id, RequestStatus.accepted);
    if (alreadyMember) return;

    let sourceId: string | null = null;
    if (request.type === RequestType.task && request.taskId != null) {
      const projectTasks = await this.tasks.forProject(project.id);
      for (const task of projectTasks) {
        if (task.id !== request.taskId) continue;
        await this.tasks.addAccepted(task);
        sourceId = task.id;
        break;
      }
    } else {
      const roleName = request.teamRoleId ?? request.role;
      const counts = { ...project.acceptedRoleCounts };
      counts[roleName] = (counts[roleName] ?? 0) + 1;
      project = project.copyWith({ acceptedRoleCounts: counts });
      sourceId = roleName;
    }

    await this.members.add(
      new ProjectMember({
        id: "",
        projectId: project.id,
        userId: request.applicantUserId ?? "",
        name: request.applicantName,
        email: request.applicantEmail,
        role: request.role,
        sourceType: request.type === RequestType.task ? MemberSourceType.task : MemberSourceType.team,
        sourceId,
        requestId: request.id,
      }),
    );

    await this.projects.save(project.copyWith({ acceptedMembersCount: project.acceptedMembersCount + 1 }));

    const applicant = request.applicantUserId;
    if (applicant != null && applicant !== me) {
      const projectName = project.name === "" ? "el proyecto" : project.name;
      const isTask = request.type === RequestType.task;
      await this.notify({
        recipient: applicant,
        type: isTask ? AppNotificationType.taskApplicationAccepted : AppNotificationType.requestAccepted,
        title: isTask ? "Postulación aceptada" : "Solicitud aceptada",
        message: isTask
          ? `Fuiste asignado a la tarea ${request.role}.`
          : `Ya eres parte del proyecto ${projectName} como ${request.role}.`,
        projectId: project.id,
        requestId: request.id,
        actorUserId: me,
        actorName: this.myName,
        detail: request.role,
      });
    }
  }

  async rejectRequest(request: ParticipationRequest) {
    const me = this.me;
    const project = await this.ownedProject(request.projectId, me);
    if (!(await this.isPending(request, me))) return;
    await this.requests.decide(request.id, RequestStatus.rejected);
    const applicant = request.applicantUserId;
    if (applicant != null && applicant !== me) {
      const projectName = project.name === "" ? "el proyecto" : project.name;
      const isTask = request.type === RequestType.task;
      await this.notify({
        recipient: applicant,
        type: isTask ? AppNotificationType.taskApplicationRejected : AppNotificationType.requestRejected,
        title: isTask ? "Postulación rechazada" : "Solicitud rechazada",
        message: isTask
          ? `Tu postulación para la tarea ${request.role} no fue aceptada.`
          : `Tu solicitud para unirte a ${projectName} no fue aceptada.`,
        projectId: project.id,
        requestId: request.id,
        actorUserId: me,
        actorName: this.myName,
        detail: request.role,
      });
    }
  }

  private async ownedProject(projectId: string, me: string): Promise<Project> {
    const project = await this.projects.getById(projectId, { viewerId: me });
    if (project == null || project.createdBy !== me) {
      throw new StateError("Solo el creador del proyecto puede gestionar solicitudes.");
    }
    return project;
  }

  private async isPending(request: ParticipationRequest, me: string) {
    const current = (await this.requests.forProject(request.projectId, { ownerId: me })).filter((r) => r.id === request.id);
    return current.length > 0 && current[0].status === RequestStatus.pending;
  }

  private async notify(a: {
    recipient: string;
    type: string;
    title: string;
    message: string;
    projectId: string;
    requestId?: string | null;
    actorUserId?: string | null;
    actorName?: string | null;
    detail?: string | null;
  }) {
    try {
      await this.notifications.send({
        recipientUserId: a.recipient,
        type: a.type,
        title: a.title,
        message: a.message,
        projectId: a.projectId,
        requestId: a.requestId,
        actorUserId: a.actorUserId,
        actorName: a.actorName,
        detail: a.detail,
      });
    } catch {
      // el aviso es opcional
    }
  }
}
