// Rutas de la app. Equivalente de routes/app_routes.dart (rutas con nombre)
// más una entrada por cada página que en Flutter se abría con `Get.to(...)`.
import type { AppNotification } from "@/src/features/notifications/domain/models/appNotification";
import type { Project } from "@/src/features/projects/domain/models/project";
import type { ProjectTask } from "@/src/features/tasks/domain/models/projectTask";

/** Los nombres de ruta de GetX (AppRoutes). */
export const RouteNames = {
  central: "/",
  home: "/home",
  myProjects: "/mis-proyectos",
  notifications: "/notificaciones",
  profile: "/perfil",
} as const;

export type NamedRoute = (typeof RouteNames)[keyof typeof RouteNames];

/** Parámetros de cada pantalla (lo que recibía su constructor en Flutter). */
export type ScreenParams = {
  // Rutas con nombre (AppPages)
  Central: undefined;
  Home: undefined;
  MyProjects: undefined;
  Notifications: undefined;
  Profile: undefined;
  // auth
  Login: undefined;
  SignUp: undefined;
  WhatToDo: undefined;
  // projects
  ExploreFilters: undefined;
  ProjectDetail: { project: Project };
  ProjectComments: { projectId: string; projectName: string };
  CreateProject: { editProjectId?: string | null } | undefined;
  BasicInfo: undefined;
  TeamNeeded: undefined;
  TaskInfo: undefined;
  EstimatedTime: undefined;
  Audience: undefined;
  ReviewPublish: undefined;
  NewIdea: undefined;
  ProjectPublished: { projectId: string; isPrivate?: boolean };
  // tasks
  AvailableTasks: { project: Project };
  // requests
  ChooseParticipation: { project: Project };
  JoinTeam: { project: Project; task?: ProjectTask | null; initialRoleName?: string | null };
  RequestSent: undefined;
  Requests: undefined;
  // notifications
  NotificationFilters: undefined;
  RequestNotification: { notification: AppNotification };
  RequestResult: { notification: AppNotification };
  ActivityNotification: { notification: AppNotification };
  // profile
  EditProfile: undefined;
  Settings: undefined;
  Logout: undefined;
  Trajectory: undefined;
  ActivityHistory: undefined;
  MyIdeas: undefined;
  NotificationSettings: undefined;
  Privacy: undefined;
  PublicProfile: { userId: string; name: string };
  UserParticipations: { userId: string; name: string };
  // messages
  Messages: undefined;
  Chat: { otherUserId: string; otherName: string };
};

export type ScreenName = keyof ScreenParams;

export const AppRoutes = {
  ...RouteNames,

  /** Pantalla que corresponde a cada ruta con nombre. */
  screenFor(route: NamedRoute): ScreenName {
    switch (route) {
      case RouteNames.central:
        return "Central";
      case RouteNames.home:
        return "Home";
      case RouteNames.myProjects:
        return "MyProjects";
      case RouteNames.notifications:
        return "Notifications";
      case RouteNames.profile:
        return "Profile";
    }
  },
};
