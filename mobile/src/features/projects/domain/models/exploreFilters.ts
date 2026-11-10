import { Project } from "./project";

/** "Fecha de creación" del panel de filtros de Explorar. */
export enum CreationDateFilter {
  all = "all",
  last7Days = "last7Days",
  last30Days = "last30Days",
  older = "older",
}

/** "Disponibilidad de tareas": si el proyecto tiene tareas con cupo. */
export enum TaskAvailabilityFilter {
  all = "all",
  withOpenTasks = "withOpenTasks",
  withoutOpenTasks = "withoutOpenTasks",
}

/** "Disponibilidad de miembros": si alguna convocatoria de rol sigue abierta. */
export enum MemberAvailabilityFilter {
  all = "all",
  withOpenSpots = "withOpenSpots",
  withoutOpenSpots = "withoutOpenSpots",
}

/** "Rol del proyecto". "Otros" agrupa los roles que no son los cuatro fijos. */
export enum ProjectRoleFilter {
  designer = "designer",
  developer = "developer",
  leader = "leader",
  communicator = "communicator",
  other = "other",
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Los filtros de "Explorar proyectos" (requerimiento 1.2). */
export class ExploreFilters {
  readonly creationDate: CreationDateFilter;
  readonly taskAvailability: TaskAvailabilityFilter;
  readonly memberAvailability: MemberAvailabilityFilter;
  readonly roles: ReadonlySet<ProjectRoleFilter>;

  constructor(
    p: {
      creationDate?: CreationDateFilter;
      taskAvailability?: TaskAvailabilityFilter;
      memberAvailability?: MemberAvailabilityFilter;
      roles?: ReadonlySet<ProjectRoleFilter>;
    } = {},
  ) {
    this.creationDate = p.creationDate ?? CreationDateFilter.all;
    this.taskAvailability = p.taskAvailability ?? TaskAvailabilityFilter.all;
    this.memberAvailability = p.memberAvailability ?? MemberAvailabilityFilter.all;
    this.roles = p.roles ?? new Set();
  }

  static readonly none = new ExploreFilters();

  static readonly roleNames: ReadonlyMap<ProjectRoleFilter, string> = new Map([
    [ProjectRoleFilter.designer, "Diseñador/a"],
    [ProjectRoleFilter.developer, "Desarrollador/a"],
    [ProjectRoleFilter.leader, "Líder de proyecto"],
    [ProjectRoleFilter.communicator, "Comunicador/a"],
  ]);

  get isEmpty(): boolean {
    return (
      this.creationDate === CreationDateFilter.all &&
      this.taskAvailability === TaskAvailabilityFilter.all &&
      this.memberAvailability === MemberAvailabilityFilter.all &&
      this.roles.size === 0
    );
  }

  get activeCount(): number {
    return (
      (this.creationDate !== CreationDateFilter.all ? 1 : 0) +
      (this.taskAvailability !== TaskAvailabilityFilter.all ? 1 : 0) +
      (this.memberAvailability !== MemberAvailabilityFilter.all ? 1 : 0) +
      (this.roles.size > 0 ? 1 : 0)
    );
  }

  copyWith(c: {
    creationDate?: CreationDateFilter;
    taskAvailability?: TaskAvailabilityFilter;
    memberAvailability?: MemberAvailabilityFilter;
    roles?: ReadonlySet<ProjectRoleFilter>;
  }): ExploreFilters {
    return new ExploreFilters({
      creationDate: c.creationDate ?? this.creationDate,
      taskAvailability: c.taskAvailability ?? this.taskAvailability,
      memberAvailability: c.memberAvailability ?? this.memberAvailability,
      roles: c.roles ?? this.roles,
    });
  }

  toggleRole(role: ProjectRoleFilter): ExploreFilters {
    const next = new Set(this.roles);
    if (!next.delete(role)) next.add(role);
    return this.copyWith({ roles: next });
  }

  matches(project: Project, { hasOpenTasks, now }: { hasOpenTasks: boolean; now?: Date }): boolean {
    const at = now ?? new Date();
    return (
      this.matchesDate(project.createdAt, at) &&
      this.matchesTasks(hasOpenTasks) &&
      this.matchesMembersAndRoles(project, at)
    );
  }

  private matchesDate(createdAt: Date | null, now: Date): boolean {
    switch (this.creationDate) {
      case CreationDateFilter.all:
        return true;
      case CreationDateFilter.last7Days:
        return createdAt != null && !(createdAt.getTime() < now.getTime() - 7 * DAY_MS);
      case CreationDateFilter.last30Days:
        return createdAt != null && !(createdAt.getTime() < now.getTime() - 30 * DAY_MS);
      case CreationDateFilter.older:
        return createdAt == null || createdAt.getTime() < now.getTime() - 30 * DAY_MS;
    }
  }

  private matchesTasks(hasOpenTasks: boolean): boolean {
    switch (this.taskAvailability) {
      case TaskAvailabilityFilter.all:
        return true;
      case TaskAvailabilityFilter.withOpenTasks:
        return hasOpenTasks;
      case TaskAvailabilityFilter.withoutOpenTasks:
        return !hasOpenTasks;
    }
  }

  private matchesMembersAndRoles(project: Project, now: Date): boolean {
    const callOpen = project.isTeamCallOpenAt(now);
    const entries = Object.entries(project.teamRoles);
    const requested = new Set(entries.filter(([, v]) => v > 0).map(([k]) => k));
    const open = new Set(
      entries.filter(([k, v]) => callOpen && v - (project.acceptedRoleCounts[k] ?? 0) > 0).map(([k]) => k),
    );

    const relevantRequested =
      this.roles.size === 0 ? requested : new Set([...requested].filter((r) => this.isSelectedRole(r)));
    const relevantOpen = this.roles.size === 0 ? open : new Set([...open].filter((r) => this.isSelectedRole(r)));

    if (this.roles.size > 0 && relevantRequested.size === 0) return false;

    switch (this.memberAvailability) {
      case MemberAvailabilityFilter.all:
        return true;
      case MemberAvailabilityFilter.withOpenSpots:
        return relevantOpen.size > 0;
      case MemberAvailabilityFilter.withoutOpenSpots:
        return relevantOpen.size === 0;
    }
  }

  private isSelectedRole(roleName: string): boolean {
    for (const role of this.roles) {
      if (role === ProjectRoleFilter.other) {
        if (![...ExploreFilters.roleNames.values()].includes(roleName)) return true;
      } else if (ExploreFilters.roleNames.get(role) === roleName) {
        return true;
      }
    }
    return false;
  }
}
