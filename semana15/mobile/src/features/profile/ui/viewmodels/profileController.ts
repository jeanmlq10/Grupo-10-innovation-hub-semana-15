import { Controller } from "@/src/core/state/Controller";
import { snackbar } from "@/src/core/ui/overlay";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { ProjectComment } from "@/src/features/comments/domain/models/projectComment";
import { ICommentRepository } from "@/src/features/comments/domain/repositories/iCommentRepository";
import { ProjectFollow } from "@/src/features/follows/domain/models/projectFollow";
import { IFollowRepository } from "@/src/features/follows/domain/repositories/iFollowRepository";
import { MemberSourceType, ProjectMember } from "@/src/features/members/domain/models/projectMember";
import { IMemberRepository } from "@/src/features/members/domain/repositories/iMemberRepository";
import { Project } from "@/src/features/projects/domain/models/project";
import { IProjectRepository } from "@/src/features/projects/domain/repositories/iProjectRepository";
import { IRequestRepository } from "@/src/features/requests/domain/repositories/iRequestRepository";
import { ProjectTask, TaskProgress } from "@/src/features/tasks/domain/models/projectTask";
import { ITaskRepository } from "@/src/features/tasks/domain/repositories/iTaskRepository";

import { ActivityEntry, ActivityKind } from "../../domain/models/activityEntry";
import { PublicProfile } from "../../domain/models/publicProfile";
import { TrajectorySummary } from "../../domain/models/trajectorySummary";
import { ActivityVisibility, ContactPermission, ProfileVisibility, UserProfile } from "../../domain/models/userProfile";
import { IProfileRepository } from "../../domain/repositories/iProfileRepository";

/** Lo que se junta de Roble para calcular la trayectoria y el historial de una persona. */
type UserData = {
  owned: Project[];
  memberships: ProjectMember[];
  projectsById: Map<string, Project>;
  tasksByProject: Map<string, ProjectTask[]>;
};

const Y2000 = new Date(2000, 0, 1).getTime();

/** ViewModel de "Mi perfil" (Página 5) y del perfil público de otra persona. */
export class ProfileController extends Controller {
  readonly profiles: IProfileRepository;
  readonly projects: IProjectRepository;
  readonly tasks: ITaskRepository;
  readonly members: IMemberRepository;
  readonly comments: ICommentRepository;
  readonly follows: IFollowRepository;
  readonly requests: IRequestRepository;
  readonly session: AuthenticationController;

  readonly profile = this.obs<UserProfile | null>(null);
  readonly summary = this.obs<TrajectorySummary>(TrajectorySummary.empty);
  readonly activity = this.obs<ActivityEntry[]>([]);
  readonly myProjects = this.obs<Project[]>([]);
  readonly isLoading = this.obs(false);
  readonly isSaving = this.obs(false);
  readonly loadError = this.obs("");

  constructor(d: {
    profiles: IProfileRepository;
    projects: IProjectRepository;
    tasks: ITaskRepository;
    members: IMemberRepository;
    comments: ICommentRepository;
    follows: IFollowRepository;
    requests: IRequestRepository;
    session: AuthenticationController;
  }) {
    super();
    this.profiles = d.profiles;
    this.projects = d.projects;
    this.tasks = d.tasks;
    this.members = d.members;
    this.comments = d.comments;
    this.follows = d.follows;
    this.requests = d.requests;
    this.session = d.session;
  }

  private get me() {
    return this.session.loggedUser?.userId ?? null;
  }

  get roleLabel(): string {
    const s = this.summary.value;
    if (s.projectsCreated > 0) return "Creador/a de proyectos";
    if (s.participations > 0) return "Colaborador/a";
    const career = this.profile.value?.career ?? "";
    return career !== "" ? career : "Nuevo en Movil";
  }

  async loadMine() {
    const user = this.session.loggedUser;
    if (user == null) return;
    this.isLoading.value = true;
    this.loadError.value = "";
    let stored: UserProfile | null = null;
    try {
      stored = await this.profiles.byUserId(user.userId);
    } catch (error) {
      console.warn(`ProfileController: user_profiles no disponible: ${error}`);
    }
    this.profile.value = (
      stored ?? UserProfile.fromSession({ userId: user.userId, name: user.name, email: user.email, career: user.career ?? "" })
    ).copyWith({ email: user.email, name: (stored?.name ?? "") === "" ? user.name : stored!.name });

    try {
      const data = await this.collect(user.userId, user.userId);
      this.myProjects.value = [...data.owned];
      this.summary.value = await this.summarize(user.userId, data);
      this.activity.value = await this.buildActivity(user.userId, data);
    } catch (error) {
      console.error(`ProfileController: could not load: ${error}`);
      this.loadError.value = errorMessage(error, { fallback: "No se pudo cargar tu perfil." });
    } finally {
      this.isLoading.value = false;
    }
  }

  saveBasics({
    name,
    username,
    bio,
    career,
    avatarIcon,
  }: {
    name: string;
    username: string;
    bio: string;
    career: string;
    avatarIcon?: string | null;
  }): Promise<boolean> {
    const current = this.profile.value;
    if (current == null) return Promise.resolve(false);
    if (name.trim() === "") {
      snackbar("Editar perfil", "El nombre no puede quedar vacío.");
      return Promise.resolve(false);
    }
    return this.save(
      current.copyWith({ name: name.trim(), username: username.trim(), bio: bio.trim(), career: career.trim(), avatarIcon }),
    );
  }

  savePrivacy({
    visibility,
    contact,
    activityVisibility,
  }: {
    visibility?: ProfileVisibility | null;
    contact?: ContactPermission | null;
    activityVisibility?: ActivityVisibility | null;
  }): Promise<boolean> {
    const current = this.profile.value;
    if (current == null) return Promise.resolve(false);
    return this.save(current.copyWith({ visibility, contact, activityVisibility }));
  }

  saveNotificationPrefs({ enabled, muted }: { enabled: boolean; muted: Set<string> }): Promise<boolean> {
    const current = this.profile.value;
    if (current == null) return Promise.resolve(false);
    return this.save(current.copyWith({ notificationsEnabled: enabled, mutedNotifications: muted }));
  }

  private async save(next: UserProfile): Promise<boolean> {
    if (this.isSaving.value) return false;
    this.isSaving.value = true;
    try {
      this.profile.value = (await this.profiles.save(next)).copyWith({ email: next.email });
      return true;
    } catch (error) {
      snackbar("Perfil", errorMessage(error, { fallback: "No se pudo guardar." }), { position: "BOTTOM" });
      return false;
    } finally {
      this.isSaving.value = false;
    }
  }

  async requestPasswordChange(): Promise<boolean> {
    const email = this.session.loggedUser?.email ?? "";
    if (email === "") return false;
    return this.session.forgotPassword(email);
  }

  exportMyData(): string {
    const p = this.profile.value;
    const s = this.summary.value;
    return JSON.stringify(
      {
        perfil: {
          nombre: p?.name ?? null,
          correo: p?.email ?? null,
          usuario: p?.username ?? null,
          biografia: p?.bio ?? null,
          carrera: p?.career ?? null,
          visibilidad: p?.visibility ?? null,
          contacto: p?.contact ?? null,
          actividad: p?.activityVisibility ?? null,
        },
        trayectoria: {
          proyectosCreados: s.projectsCreated,
          proyectosCompletados: s.projectsCompleted,
          tareasAsignadas: s.tasksAssigned,
          tareasCompletadas: s.tasksCompleted,
          participaciones: s.participations,
          comentarios: s.comments,
          solicitudesEnviadas: s.requestsSent,
        },
        historial: this.activity.value.map((entry) => ({
          tipo: entry.kind,
          proyecto: entry.projectName,
          fecha: entry.date?.toISOString() ?? null,
        })),
      },
      null,
      2,
    );
  }

  async deleteProfileData(): Promise<boolean> {
    const current = this.profile.value;
    try {
      if (current != null) await this.profiles.delete(current);
      await this.session.logOut();
      this.profile.value = null;
      return true;
    } catch (error) {
      snackbar("Eliminar cuenta", errorMessage(error), { position: "BOTTOM" });
      return false;
    }
  }

  logOut() {
    return this.session.logOut();
  }

  async publicProfile(userId: string, { fallbackName }: { fallbackName?: string | null } = {}): Promise<PublicProfile> {
    const stored = await this.profiles.byUserId(userId).catch(() => null);
    const base = stored ?? new UserProfile({ userId, name: fallbackName ?? "Usuario" });
    const isMe = userId === this.me;
    const canSee = isMe || (base.isPublic && base.showsActivity);
    if (!canSee) return new PublicProfile({ profile: base, summary: null, activity: [], canSeeDetails: false });
    const data = await this.collect(userId, this.me);
    return new PublicProfile({
      profile: base,
      summary: await this.summarize(userId, data),
      activity: await this.buildActivity(userId, data),
      canSeeDetails: true,
    });
  }

  async participationsOf(userId: string): Promise<Project[]> {
    const data = await this.collect(userId, this.me);
    const ids = new Set(data.memberships.map((m) => m.projectId));
    const out: Project[] = [];
    for (const id of ids) {
      const p = data.projectsById.get(id);
      if (p) out.push(p);
    }
    return out;
  }

  private async collect(userId: string, viewerId: string | null): Promise<UserData> {
    const isMe = userId === viewerId;
    const [ownedRaw, rawMemberships] = await Promise.all([
      this.projects.ownedBy(userId).catch(() => [] as Project[]),
      this.members.forUser(userId).catch(() => [] as ProjectMember[]),
    ]);
    const owned = ownedRaw.filter((p) => isMe || p.isPublic);

    const projectsById = new Map(owned.map((p) => [p.id, p]));
    const otherIds = new Set(rawMemberships.map((m) => m.projectId).filter((id) => !projectsById.has(id)));
    const others = await Promise.all(
      [...otherIds].map((id) => this.projects.getById(id, { viewerId }).catch(() => null)),
    );
    for (const project of others) if (project != null) projectsById.set(project.id, project);

    const memberships = rawMemberships.filter((m) => {
      const project = projectsById.get(m.projectId);
      if (project == null || project.createdBy === userId) return false;
      return m.recordedBy == null || m.recordedBy === project.createdBy;
    });

    const involved = new Set([...owned.map((p) => p.id), ...memberships.map((m) => m.projectId)]);
    const ids = [...involved];
    const taskLists = await Promise.all(ids.map((id) => this.tasks.forProject(id).catch(() => [] as ProjectTask[])));
    const tasksByProject = new Map(ids.map((id, i) => [id, taskLists[i]]));

    return { owned, memberships, projectsById, tasksByProject };
  }

  private async summarize(userId: string, data: UserData): Promise<TrajectorySummary> {
    const [commentCount, requestCount] = await Promise.all([
      this.comments
        .byAuthor(userId)
        .then((l) => l.length)
        .catch(() => 0),
      this.requests
        .sentBy(userId)
        .then((l) => l.length)
        .catch(() => 0),
    ]);

    const assignedIds = new Set(
      data.memberships
        .filter((m) => m.sourceType === MemberSourceType.task)
        .map((m) => m.sourceId)
        .filter((id): id is string => typeof id === "string"),
    );
    const allTasks = [...data.tasksByProject.values()].flat();
    const completedAssigned = allTasks.filter((t) => assignedIds.has(t.id) && t.progress === TaskProgress.completed).length;

    const involved = new Set([...data.owned.map((p) => p.id), ...data.memberships.map((m) => m.projectId)]);
    const projectsCompleted = [...involved].filter((id) => {
      const list = data.tasksByProject.get(id) ?? [];
      return list.length > 0 && list.every((t) => t.progress === TaskProgress.completed);
    }).length;

    const participations = new Set(data.memberships.map((m) => m.projectId));
    const published = data.owned.filter((p) => !p.isDraft);
    const activeIds = new Set([...published.map((p) => p.id), ...data.memberships.map((m) => m.projectId)]);
    const activeProjects = [...activeIds].filter((id) => {
      const list = data.tasksByProject.get(id) ?? [];
      return list.length === 0 || list.some((t) => t.progress !== TaskProgress.completed);
    }).length;

    return new TrajectorySummary({
      projectsCreated: data.owned.filter((p) => !p.isDraft).length,
      projectsCompleted,
      tasksAssigned: assignedIds.size,
      tasksCompleted: completedAssigned,
      participations: participations.size,
      comments: commentCount,
      requestsSent: requestCount,
      requestsAccepted: data.memberships.length,
      activeProjects,
      publications: published.length,
    });
  }

  private async buildActivity(userId: string, data: UserData): Promise<ActivityEntry[]> {
    const myComments = await this.comments.byAuthor(userId).catch(() => [] as ProjectComment[]);
    const myFollows = await this.follows.followsOf(userId).catch(() => [] as ProjectFollow[]);

    const missing = new Set(
      [...myComments.map((c) => c.projectId), ...myFollows.map((f) => f.projectId)].filter(
        (id) => !data.projectsById.has(id),
      ),
    );
    const fetched = await Promise.all(
      [...missing].map((id) => this.projects.getById(id, { viewerId: this.me }).catch(() => null)),
    );
    const names = new Map<string, string>();
    for (const p of data.projectsById.values()) names.set(p.id, p.name);
    for (const p of fetched) if (p != null) names.set(p.id, p.name);
    const nameOf = (id: string) => {
      const name = names.get(id) ?? "";
      return name === "" ? "Proyecto" : name;
    };

    const entries: ActivityEntry[] = [
      ...data.owned
        .filter((p) => !p.isDraft)
        .map(
          (project) =>
            new ActivityEntry({
              kind: ActivityKind.publication,
              projectId: project.id,
              projectName: nameOf(project.id),
              date: project.createdAt,
            }),
        ),
      ...data.memberships.map(
        (m) =>
          new ActivityEntry({
            kind: m.sourceType === MemberSourceType.task ? ActivityKind.taskAssignment : ActivityKind.participation,
            projectId: m.projectId,
            projectName: nameOf(m.projectId),
            date: m.joinedAt,
            detail: m.role,
          }),
      ),
      ...myComments
        .filter((c) => names.has(c.projectId))
        .map(
          (c) =>
            new ActivityEntry({
              kind: ActivityKind.comment,
              projectId: c.projectId,
              projectName: nameOf(c.projectId),
              date: c.createdAt,
              detail: c.text,
            }),
        ),
      ...myFollows
        .filter((f) => names.has(f.projectId))
        .map(
          (f) =>
            new ActivityEntry({
              kind: ActivityKind.follow,
              projectId: f.projectId,
              projectName: nameOf(f.projectId),
              date: f.createdAt,
            }),
        ),
    ];
    entries.sort((a, b) => (b.date?.getTime() ?? Y2000) - (a.date?.getTime() ?? Y2000));
    return entries;
  }
}
