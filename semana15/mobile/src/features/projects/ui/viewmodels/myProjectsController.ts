import { Controller } from "@/src/core/state/Controller";
import { snackbar } from "@/src/core/ui/overlay";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { ParticipationRequest, RequestStatus } from "@/src/features/requests/domain/models/participationRequest";
import { IRequestRepository } from "@/src/features/requests/domain/repositories/iRequestRepository";
import { ITaskRepository } from "@/src/features/tasks/domain/repositories/iTaskRepository";

import { MyProject } from "../../domain/models/myProject";
import { Project } from "../../domain/models/project";
import { IProjectRepository } from "../../domain/repositories/iProjectRepository";

/** ViewModel for "Mis proyectos". */
export class MyProjectsController extends Controller {
  private readonly all = this.obs<MyProject[]>([]);
  private readonly userProjects = new Map<string, Project>();
  readonly isLoading = this.obs(false);
  readonly showingDrafts = this.obs(false);

  constructor(
    readonly projectRepository: IProjectRepository,
    readonly taskRepository: ITaskRepository,
    readonly requestRepository: IRequestRepository,
    readonly session: AuthenticationController,
  ) {
    super();
  }

  isUserProject(id: string) {
    return this.userProjects.has(id);
  }

  userProject(id: string): Project | null {
    return this.userProjects.get(id) ?? null;
  }

  get publishedProjects() {
    return this.all.value.filter((p) => !p.isDraft);
  }

  get draftProjects() {
    return this.all.value.filter((p) => p.isDraft);
  }

  get visibleProjects() {
    return this.showingDrafts.value ? this.draftProjects : this.publishedProjects;
  }

  protected onInit() {
    void this.getMyProjects();
  }

  async getMyProjects() {
    this.isLoading.value = true;
    try {
      const userId = this.session.loggedUser?.userId;
      const mine: Project[] = userId == null ? [] : await this.projectRepository.ownedBy(userId);
      const received: ParticipationRequest[] =
        userId == null
          ? []
          : await this.requestRepository.forProjects(new Map(mine.map((p) => [p.id, p.name])), { ownerId: userId });

      this.userProjects.clear();
      mine.forEach((p) => this.userProjects.set(p.id, p));

      const taskCounts = await Promise.all(
        mine.map((p) =>
          this.taskRepository
            .forProject(p.id, { teamAccess: true })
            .then((list) => list.length)
            .catch(() => 0),
        ),
      );
      const taskCountById = new Map(mine.map((p, i) => [p.id, taskCounts[i]]));

      this.all.value = mine.map((project) => {
        const pendingRequests = received.filter(
          (r) => r.projectId === project.id && r.status === RequestStatus.pending,
        ).length;
        return new MyProject({
          id: project.id,
          name: project.name === "" ? "Borrador sin nombre" : project.name,
          description: project.description,
          status: project.isDraft ? "Borrador" : "Publicado",
          isDraft: project.isDraft,
          membersCount: project.acceptedMembersCount,
          tasksCount: taskCountById.get(project.id) ?? 0,
          requestsCount: pendingRequests,
          imageUrl: project.imageUrl,
          imageFileId: project.imageFileId,
          categories: project.categories,
        });
      });
    } catch (error) {
      console.error(`MyProjectsController: could not load: ${error}`);
      snackbar("Mis proyectos", errorMessage(error, { fallback: "No se pudieron cargar tus proyectos." }), {
        position: "BOTTOM",
      });
    } finally {
      this.isLoading.value = false;
    }
  }

  /**
   * Elimina un proyecto del creador.
   * - Borrador: borrado físico de la fila y de sus tareas (un borrador nunca
   *   recibió solicitudes, comentarios ni integrantes).
   * - Publicado: eliminación lógica (`deletedAt`). Las solicitudes,
   *   comentarios, seguimientos e integrantes NO se borran: son filas de
   *   otras personas y siguen sirviendo de historial; el proyecto deja de
   *   aparecer en Mis proyectos, en Explorar y al abrirlo por id.
   */
  async deleteProject(id: string): Promise<boolean> {
    const me = this.session.loggedUser?.userId;
    const project = this.userProjects.get(id);
    const title = project?.isDraft ? "Eliminar borrador" : "Eliminar proyecto";
    if (me == null || project == null || project.createdBy !== me) {
      snackbar(title, "Solo el creador puede eliminar este proyecto.", { position: "BOTTOM" });
      return false;
    }
    try {
      if (project.isDraft) {
        await this.projectRepository.delete(id);
        try {
          await this.taskRepository.deleteForProject(id);
        } catch (error) {
          console.warn(`MyProjectsController: tareas sin borrar: ${error}`);
        }
      } else {
        await this.projectRepository.softDelete(project);
      }
      this.userProjects.delete(id);
      this.all.value = this.all.value.filter((p) => p.id !== id);
      return true;
    } catch (error) {
      console.warn(`MyProjectsController: could not delete: ${error}`);
      snackbar(title, errorMessage(error, { fallback: "No se pudo eliminar el proyecto." }), { position: "BOTTOM" });
      return false;
    }
  }

  showPublished() {
    this.showingDrafts.value = false;
  }

  showDrafts() {
    this.showingDrafts.value = true;
  }
}
