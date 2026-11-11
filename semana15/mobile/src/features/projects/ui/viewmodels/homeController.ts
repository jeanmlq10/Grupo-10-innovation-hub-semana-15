import { Controller } from "@/src/core/state/Controller";
import { snackbar } from "@/src/core/ui/overlay";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { IFollowRepository } from "@/src/features/follows/domain/repositories/iFollowRepository";
import { ITaskRepository } from "@/src/features/tasks/domain/repositories/iTaskRepository";

import { ExploreFilters } from "../../domain/models/exploreFilters";
import { Project } from "../../domain/models/project";
import { IProjectRepository } from "../../domain/repositories/iProjectRepository";

/** ViewModel for the Home ("Explorar proyectos"). */
export class HomeController extends Controller {
  readonly filters = this.obs<ExploreFilters>(ExploreFilters.none);
  private readonly openTaskProjectIds = this.obs<Set<string>>(new Set());
  readonly loadError = this.obs("");
  private inFlight: Promise<void> | null = null;
  private readonly _projects = this.obs<Project[]>([]);
  private readonly followedIds = this.obs<Set<string>>(new Set());
  readonly isLoading = this.obs(false);
  readonly searchQuery = this.obs("");
  readonly showingFollowed = this.obs(false);
  private sessionWorker: (() => void) | null = null;

  constructor(
    readonly projectRepository: IProjectRepository,
    readonly followRepository: IFollowRepository,
    readonly session: AuthenticationController,
    readonly taskRepository: ITaskRepository,
  ) {
    super();
  }

  get isGuest() {
    return this.session.isGuest;
  }

  get projects(): Project[] {
    return this._projects.value;
  }

  get filteredProjects(): Project[] {
    const base = this.showingFollowed.value
      ? this._projects.value.filter((p) => this.followedIds.value.has(p.id))
      : this._projects.value;
    const query = this.searchQuery.value.trim().toLowerCase();
    const searched = query === "" ? base : base.filter((p) => p.name.toLowerCase().includes(query));
    const active = this.filters.value;
    if (active.isEmpty) return searched;
    const now = new Date();
    return searched.filter((p) => active.matches(p, { hasOpenTasks: this.openTaskProjectIds.value.has(p.id), now }));
  }

  protected onInit() {
    this.sessionWorker = this.session.loggedState.listen((logged) => {
      if (logged) void this.getProjects();
    });
    void this.getProjects();
  }

  onClose() {
    this.sessionWorker?.();
  }

  applyFilters(value: ExploreFilters) {
    this.filters.value = value;
  }

  clearFilters() {
    this.filters.value = ExploreFilters.none;
  }

  getProjects(): Promise<void> {
    if (!this.inFlight) {
      this.inFlight = this.loadProjects().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }

  private async loadProjects() {
    this.isLoading.value = true;
    try {
      const userId = this.session.loggedUser?.userId;
      const guest = this.session.isGuest;
      const [projects, followed, openTasks] = await Promise.all([
        this.projectRepository.explorable({ publicAccess: guest }),
        userId == null
          ? Promise.resolve(new Set<string>())
          : this.followRepository.followedProjectIds(userId).catch(() => new Set<string>()),
        this.taskRepository.projectIdsWithOpenTasks({ publicAccess: guest }).catch(() => new Set<string>()),
      ]);
      this._projects.value = projects;
      this.followedIds.value = new Set(followed);
      this.openTaskProjectIds.value = new Set(openTasks);
      this.loadError.value = "";
    } catch (error) {
      console.error(`HomeController: could not load projects: ${error}`);
      const message = errorMessage(error, { fallback: "No se pudieron cargar los proyectos." });
      this.loadError.value = message;
      snackbar("Explorar proyectos", message, { position: "BOTTOM" });
    } finally {
      this.isLoading.value = false;
    }
  }

  updateSearch(value: string) {
    this.searchQuery.value = value;
  }

  showAll() {
    this.showingFollowed.value = false;
  }

  showFollowed() {
    this.showingFollowed.value = true;
  }
}
