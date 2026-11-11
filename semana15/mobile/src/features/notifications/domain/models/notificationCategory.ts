import { AppNotificationType } from "./appNotificationType";

/**
 * Las categorías de "Filtrar notificaciones" (Página 4.1) y de las
 * preferencias de notificaciones del perfil.
 */
export enum NotificationCategory {
  participationRequests = "participationRequests",
  taskApplications = "taskApplications",
  completedTasks = "completedTasks",
  comments = "comments",
  messages = "messages",
  mentions = "mentions",
  platformNews = "platformNews",
  reminders = "reminders",
}

/** Mismo orden que `NotificationCategory.values` en Dart. */
export const NOTIFICATION_CATEGORY_VALUES: NotificationCategory[] = [
  NotificationCategory.participationRequests,
  NotificationCategory.taskApplications,
  NotificationCategory.completedTasks,
  NotificationCategory.comments,
  NotificationCategory.messages,
  NotificationCategory.mentions,
  NotificationCategory.platformNews,
  NotificationCategory.reminders,
];

export const NotificationCategories = {
  ofType(type: string): NotificationCategory {
    switch (type) {
      case AppNotificationType.taskApplication:
      case AppNotificationType.taskApplicationAccepted:
      case AppNotificationType.taskApplicationRejected:
      case AppNotificationType.taskAssigned:
        return NotificationCategory.taskApplications;
      case AppNotificationType.taskReminder:
        return NotificationCategory.reminders;
      case AppNotificationType.projectUpdate:
        return NotificationCategory.platformNews;
      case AppNotificationType.taskCompleted:
        return NotificationCategory.completedTasks;
      case AppNotificationType.newComment:
      case AppNotificationType.commentReply:
        return NotificationCategory.comments;
      case AppNotificationType.newMessage:
        return NotificationCategory.messages;
      default:
        return NotificationCategory.participationRequests;
    }
  },

  key(category: NotificationCategory): string {
    return category;
  },

  fromKey(key: string): NotificationCategory | null {
    return NOTIFICATION_CATEGORY_VALUES.find((v) => v === key) ?? null;
  },
};
