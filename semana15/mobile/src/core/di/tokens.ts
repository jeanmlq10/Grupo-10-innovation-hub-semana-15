// Un token por dependencia registrada en el contenedor (ver appContainer.ts).
export const TOKENS = {
  LocalPreferences: Symbol("ILocalPreferences"),
  RobleClient: Symbol("RobleClient"),

  AuthenticationSource: Symbol("IAuthenticationSource"),
  AuthRepo: Symbol("IAuthRepository"),
  ProjectRepo: Symbol("IProjectRepository"),
  TaskRepo: Symbol("ITaskRepository"),
  RequestRepo: Symbol("IRequestRepository"),
  MemberRepo: Symbol("IMemberRepository"),
  CommentRepo: Symbol("ICommentRepository"),
  FollowRepo: Symbol("IFollowRepository"),
  NotificationRepo: Symbol("INotificationRepository"),
  ProfileRepo: Symbol("IProfileRepository"),
  MessageRepo: Symbol("IMessageRepository"),
  AttachmentRepo: Symbol("IAttachmentRepository"),

  AuthenticationController: Symbol("AuthenticationController"),
  ProjectDetailController: Symbol("ProjectDetailController"),
  RequestsController: Symbol("RequestsController"),
  CommentsController: Symbol("CommentsController"),
  NotificationsController: Symbol("NotificationsController"),
  ProfileController: Symbol("ProfileController"),
  MessagesController: Symbol("MessagesController"),

  HomeController: Symbol("HomeController"),
  MyProjectsController: Symbol("MyProjectsController"),
  CreateProjectController: Symbol("CreateProjectController"),
} as const;
