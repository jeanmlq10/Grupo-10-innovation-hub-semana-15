// Raíz de composición: equivalente EXACTO de lib/di/app_bindings.dart.
// Es el ÚNICO sitio donde se decide qué implementación concreta se usa.
import { Platform } from "react-native";

import { RobleAttachmentDataSource } from "@/src/features/attachments/data/datasources/robleAttachmentDataSource";
import { AttachmentRepository } from "@/src/features/attachments/data/repositories/attachmentRepository";
import { AuthenticationSourceService } from "@/src/features/auth/data/datasources/remote/authenticationSourceService";
import { AuthRepository } from "@/src/features/auth/data/repositories/authRepository";
import { AuthenticationController } from "@/src/features/auth/ui/viewmodels/authenticationController";
import { RobleCommentDataSource } from "@/src/features/comments/data/datasources/robleCommentDataSource";
import { CommentRepository } from "@/src/features/comments/data/repositories/commentRepository";
import { CommentsController } from "@/src/features/comments/ui/viewmodels/commentsController";
import { RobleFollowDataSource } from "@/src/features/follows/data/datasources/robleFollowDataSource";
import { FollowRepository } from "@/src/features/follows/data/repositories/followRepository";
import { RobleMemberDataSource } from "@/src/features/members/data/datasources/robleMemberDataSource";
import { MemberRepository } from "@/src/features/members/data/repositories/memberRepository";
import { RobleMessageDataSource } from "@/src/features/messages/data/datasources/robleMessageDataSource";
import { MessageRepository } from "@/src/features/messages/data/repositories/messageRepository";
import { MessagesController } from "@/src/features/messages/ui/viewmodels/messagesController";
import { RobleNotificationDataSource } from "@/src/features/notifications/data/datasources/robleNotificationDataSource";
import { NotificationRepository } from "@/src/features/notifications/data/repositories/notificationRepository";
import { NotificationsController } from "@/src/features/notifications/ui/viewmodels/notificationsController";
import { RobleProfileDataSource } from "@/src/features/profile/data/datasources/robleProfileDataSource";
import { ProfileRepository } from "@/src/features/profile/data/repositories/profileRepository";
import { ProfileController } from "@/src/features/profile/ui/viewmodels/profileController";
import { RobleProjectDataSource } from "@/src/features/projects/data/datasources/robleProjectDataSource";
import { ProjectRepository } from "@/src/features/projects/data/repositories/projectRepository";
import { CreateProjectController } from "@/src/features/projects/ui/viewmodels/createProjectController";
import { HomeController } from "@/src/features/projects/ui/viewmodels/homeController";
import { MyProjectsController } from "@/src/features/projects/ui/viewmodels/myProjectsController";
import { ProjectDetailController } from "@/src/features/projects/ui/viewmodels/projectDetailController";
import { RobleRequestDataSource } from "@/src/features/requests/data/datasources/robleRequestDataSource";
import { RequestRepository } from "@/src/features/requests/data/repositories/requestRepository";
import { RequestsController } from "@/src/features/requests/ui/viewmodels/requestsController";
import { RobleTaskDataSource } from "@/src/features/tasks/data/datasources/robleTaskDataSource";
import { TaskRepository } from "@/src/features/tasks/data/repositories/taskRepository";

import { RobleClient } from "../roble/robleClient";
import { ILocalPreferences } from "../storage/iLocalPreferences";
import { LocalPreferencesSecured } from "../storage/localPreferencesSecured";
import { LocalPreferencesShared } from "../storage/localPreferencesShared";
import { Container } from "./container";
import { TOKENS } from "./tokens";

export function createAppContainer({
  preferences,
  roble,
}: { preferences?: ILocalPreferences; roble?: RobleClient } = {}): Container {
  const c = new Container();

  c.register<ILocalPreferences>(
    TOKENS.LocalPreferences,
    preferences ?? (Platform.OS === "web" ? new LocalPreferencesShared() : new LocalPreferencesSecured()),
  );

  const cliente = roble ?? new RobleClient();
  c.register(TOKENS.RobleClient, cliente);

  const authSource = new AuthenticationSourceService({ roble: cliente });
  c.register(TOKENS.AuthenticationSource, authSource);
  const authRepo = new AuthRepository(authSource);
  c.register(TOKENS.AuthRepo, authRepo);

  const projectRepo = new ProjectRepository(new RobleProjectDataSource(cliente));
  const taskRepo = new TaskRepository(new RobleTaskDataSource(cliente));
  const requestRepo = new RequestRepository(new RobleRequestDataSource(cliente));
  const memberRepo = new MemberRepository(new RobleMemberDataSource(cliente));
  const commentRepo = new CommentRepository(new RobleCommentDataSource(cliente));
  const followRepo = new FollowRepository(new RobleFollowDataSource(cliente));
  const notificationRepo = new NotificationRepository(new RobleNotificationDataSource(cliente));
  const profileRepo = new ProfileRepository(new RobleProfileDataSource(cliente));
  const messageRepo = new MessageRepository(new RobleMessageDataSource(cliente));
  const attachmentRepo = new AttachmentRepository(new RobleAttachmentDataSource(cliente));
  c.register(TOKENS.ProjectRepo, projectRepo)
    .register(TOKENS.TaskRepo, taskRepo)
    .register(TOKENS.RequestRepo, requestRepo)
    .register(TOKENS.MemberRepo, memberRepo)
    .register(TOKENS.CommentRepo, commentRepo)
    .register(TOKENS.FollowRepo, followRepo)
    .register(TOKENS.NotificationRepo, notificationRepo)
    .register(TOKENS.ProfileRepo, profileRepo)
    .register(TOKENS.MessageRepo, messageRepo)
    .register(TOKENS.AttachmentRepo, attachmentRepo);

  const session = new AuthenticationController(authRepo);
  c.register(TOKENS.AuthenticationController, session);

  c.register(
    TOKENS.ProjectDetailController,
    new ProjectDetailController({
      projects: projectRepo,
      tasks: taskRepo,
      members: memberRepo,
      comments: commentRepo,
      follows: followRepo,
      session,
      notifications: notificationRepo,
      attachments: attachmentRepo,
    }),
  );
  c.register(
    TOKENS.RequestsController,
    new RequestsController({
      requests: requestRepo,
      projects: projectRepo,
      tasks: taskRepo,
      members: memberRepo,
      notifications: notificationRepo,
      session,
    }),
  );
  c.register(
    TOKENS.CommentsController,
    new CommentsController({ comments: commentRepo, projects: projectRepo, notifications: notificationRepo, session }),
  );
  c.register(
    TOKENS.NotificationsController,
    new NotificationsController({ notifications: notificationRepo, projects: projectRepo, profiles: profileRepo, session }),
  );
  c.register(
    TOKENS.ProfileController,
    new ProfileController({
      profiles: profileRepo,
      projects: projectRepo,
      tasks: taskRepo,
      members: memberRepo,
      comments: commentRepo,
      follows: followRepo,
      requests: requestRepo,
      session,
    }),
  );
  c.register(
    TOKENS.MessagesController,
    new MessagesController({ messages: messageRepo, profiles: profileRepo, notifications: notificationRepo, session }),
  );

  c.registerLazy(TOKENS.HomeController, () => new HomeController(projectRepo, followRepo, session, taskRepo));
  c.registerLazy(TOKENS.MyProjectsController, () => new MyProjectsController(projectRepo, taskRepo, requestRepo, session));
  c.registerLazy(
    TOKENS.CreateProjectController,
    () => new CreateProjectController(projectRepo, taskRepo, session, attachmentRepo),
  );

  return c;
}
