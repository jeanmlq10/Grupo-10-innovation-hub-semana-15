// Equivalente de routes/app_pages.dart + todas las páginas que en Flutter se
// abrían con Get.to(...). Un solo stack nativo, sin cabecera (cada pantalla
// dibuja su propia barra, como en Flutter).
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import { screen } from "../core/navigation/screen";
import { ScreenParams } from "../core/navigation/routes";
import { Central } from "../features/auth/ui/views/Central";
import { LoginPage } from "../features/auth/ui/views/LoginPage";
import { SignUpPage } from "../features/auth/ui/views/SignUpPage";
import { WhatToDoPage } from "../features/auth/ui/views/WhatToDoPage";
import { ProjectCommentsPage } from "../features/comments/ui/views/ProjectCommentsPage";
import { ChatPage } from "../features/messages/ui/views/ChatPage";
import { MessagesPage } from "../features/messages/ui/views/MessagesPage";
import { ActivityNotificationPage } from "../features/notifications/ui/views/ActivityNotificationPage";
import { NotificationFiltersPage } from "../features/notifications/ui/views/NotificationFiltersPage";
import { NotificationsPage } from "../features/notifications/ui/views/NotificationsPage";
import { RequestNotificationPage } from "../features/notifications/ui/views/RequestNotificationPage";
import { RequestResultPage } from "../features/notifications/ui/views/RequestResultPage";
import { ActivityHistoryPage } from "../features/profile/ui/views/ActivityHistoryPage";
import { EditProfilePage } from "../features/profile/ui/views/EditProfilePage";
import { LogoutPage } from "../features/profile/ui/views/LogoutPage";
import { MyIdeasPage } from "../features/profile/ui/views/MyIdeasPage";
import { NotificationSettingsPage } from "../features/profile/ui/views/NotificationSettingsPage";
import { PrivacyPage } from "../features/profile/ui/views/PrivacyPage";
import { ProfilePage } from "../features/profile/ui/views/ProfilePage";
import { PublicProfilePage } from "../features/profile/ui/views/PublicProfilePage";
import { SettingsPage } from "../features/profile/ui/views/SettingsPage";
import { TrajectoryPage } from "../features/profile/ui/views/TrajectoryPage";
import { UserParticipationsPage } from "../features/profile/ui/views/UserParticipationsPage";
import { AudiencePage } from "../features/projects/ui/views/AudiencePage";
import { BasicInfoPage } from "../features/projects/ui/views/BasicInfoPage";
import { CreateProjectPage } from "../features/projects/ui/views/CreateProjectPage";
import { EstimatedTimePage } from "../features/projects/ui/views/EstimatedTimePage";
import { ExploreFiltersPage } from "../features/projects/ui/views/ExploreFiltersPage";
import { HomePage } from "../features/projects/ui/views/HomePage";
import { MyProjectsPage } from "../features/projects/ui/views/MyProjectsPage";
import { NewIdeaPage } from "../features/projects/ui/views/NewIdeaPage";
import { ProjectDetailPage } from "../features/projects/ui/views/ProjectDetailPage";
import { ProjectPublishedPage } from "../features/projects/ui/views/ProjectPublishedPage";
import { ReviewPublishPage } from "../features/projects/ui/views/ReviewPublishPage";
import { TaskInfoPage } from "../features/projects/ui/views/TaskInfoPage";
import { TeamNeededPage } from "../features/projects/ui/views/TeamNeededPage";
import { ChooseParticipationPage } from "../features/requests/ui/views/ChooseParticipationPage";
import { JoinTeamPage } from "../features/requests/ui/views/JoinTeamPage";
import { RequestSentPage } from "../features/requests/ui/views/RequestSentPage";
import { RequestsPage } from "../features/requests/ui/views/RequestsPage";
import { AvailableTasksPage } from "../features/tasks/ui/views/AvailableTasksPage";
import { Palette } from "@/src/core/theme/brand";

type StackParams = { [K in keyof ScreenParams]: { argsId?: string } | undefined };

const Stack = createNativeStackNavigator<StackParams>();

// Cada pantalla recibe `args` (su "constructor" de Flutter). Las que no
// reciben nada simplemente lo ignoran.
const SCREENS: { [K in keyof ScreenParams]: React.ComponentType<{ args: ScreenParams[K] }> } = {
  Central,
  Home: HomePage,
  MyProjects: MyProjectsPage,
  Notifications: NotificationsPage,
  Profile: ProfilePage,
  Login: LoginPage,
  SignUp: SignUpPage,
  WhatToDo: WhatToDoPage,
  ExploreFilters: ExploreFiltersPage,
  ProjectDetail: ProjectDetailPage,
  ProjectComments: ProjectCommentsPage,
  CreateProject: CreateProjectPage,
  BasicInfo: BasicInfoPage,
  TeamNeeded: TeamNeededPage,
  TaskInfo: TaskInfoPage,
  EstimatedTime: EstimatedTimePage,
  Audience: AudiencePage,
  ReviewPublish: ReviewPublishPage,
  NewIdea: NewIdeaPage,
  ProjectPublished: ProjectPublishedPage,
  AvailableTasks: AvailableTasksPage,
  ChooseParticipation: ChooseParticipationPage,
  JoinTeam: JoinTeamPage,
  RequestSent: RequestSentPage,
  Requests: RequestsPage,
  NotificationFilters: NotificationFiltersPage,
  RequestNotification: RequestNotificationPage,
  RequestResult: RequestResultPage,
  ActivityNotification: ActivityNotificationPage,
  EditProfile: EditProfilePage,
  Settings: SettingsPage,
  Logout: LogoutPage,
  Trajectory: TrajectoryPage,
  ActivityHistory: ActivityHistoryPage,
  MyIdeas: MyIdeasPage,
  NotificationSettings: NotificationSettingsPage,
  Privacy: PrivacyPage,
  PublicProfile: PublicProfilePage,
  UserParticipations: UserParticipationsPage,
  Messages: MessagesPage,
  Chat: ChatPage,
};

const WRAPPED = Object.fromEntries(
  Object.entries(SCREENS).map(([name, C]) => [name, screen(C as React.ComponentType<{ args: ScreenParams[keyof ScreenParams] }>)]),
) as Record<keyof ScreenParams, React.ComponentType>;

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Central" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Palette.background } }}>
      {(Object.keys(SCREENS) as (keyof ScreenParams)[]).map((name) => (
        <Stack.Screen key={name} name={name} component={WRAPPED[name]} />
      ))}
    </Stack.Navigator>
  );
}
