// Equivalente de projects/ui/widgets/explore_filter_labels.dart.
import {
  CreationDateFilter,
  ExploreFilters,
  MemberAvailabilityFilter,
  ProjectRoleFilter,
  TaskAvailabilityFilter,
} from "../../domain/models/exploreFilters";

export const ExploreFilterLabels = {
  creationDate: {
    [CreationDateFilter.all]: "Todos",
    [CreationDateFilter.last7Days]: "Últimos 7 días",
    [CreationDateFilter.last30Days]: "Últimos 30 días",
    [CreationDateFilter.older]: "Más antiguos",
  } as Record<CreationDateFilter, string>,

  taskAvailability: {
    [TaskAvailabilityFilter.all]: "Todas",
    [TaskAvailabilityFilter.withOpenTasks]: "Con tareas disponibles",
    [TaskAvailabilityFilter.withoutOpenTasks]: "Sin tareas disponibles",
  } as Record<TaskAvailabilityFilter, string>,

  memberAvailability: {
    [MemberAvailabilityFilter.all]: "Todos",
    [MemberAvailabilityFilter.withOpenSpots]: "Con miembros disponibles",
    [MemberAvailabilityFilter.withoutOpenSpots]: "Sin miembros disponibles",
  } as Record<MemberAvailabilityFilter, string>,

  roles: {
    [ProjectRoleFilter.designer]: "Diseñador",
    [ProjectRoleFilter.developer]: "Desarrollador",
    [ProjectRoleFilter.leader]: "Líder",
    [ProjectRoleFilter.communicator]: "Comunicador",
    [ProjectRoleFilter.other]: "Otros",
  } as Record<ProjectRoleFilter, string>,

  activeChips(filters: ExploreFilters): string[] {
    const out: string[] = [];
    for (const role of ROLE_ORDER) if (filters.roles.has(role)) out.push(ExploreFilterLabels.roles[role]);
    if (filters.creationDate !== CreationDateFilter.all) out.push(ExploreFilterLabels.creationDate[filters.creationDate]);
    if (filters.taskAvailability !== TaskAvailabilityFilter.all) {
      out.push(ExploreFilterLabels.taskAvailability[filters.taskAvailability]);
    }
    if (filters.memberAvailability !== MemberAvailabilityFilter.all) {
      out.push(ExploreFilterLabels.memberAvailability[filters.memberAvailability]);
    }
    return out;
  },
};

/** Orden de `ProjectRoleFilter.values` en Dart. */
export const ROLE_ORDER = [
  ProjectRoleFilter.designer,
  ProjectRoleFilter.developer,
  ProjectRoleFilter.leader,
  ProjectRoleFilter.communicator,
  ProjectRoleFilter.other,
];
export const CREATION_DATE_ORDER = [
  CreationDateFilter.all,
  CreationDateFilter.last7Days,
  CreationDateFilter.last30Days,
  CreationDateFilter.older,
];
export const TASK_AVAILABILITY_ORDER = [
  TaskAvailabilityFilter.all,
  TaskAvailabilityFilter.withOpenTasks,
  TaskAvailabilityFilter.withoutOpenTasks,
];
export const MEMBER_AVAILABILITY_ORDER = [
  MemberAvailabilityFilter.all,
  MemberAvailabilityFilter.withOpenSpots,
  MemberAvailabilityFilter.withoutOpenSpots,
];
