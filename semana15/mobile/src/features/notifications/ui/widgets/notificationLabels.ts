// Equivalente de notifications/ui/widgets/notification_labels.dart.
import { IconName } from "@/src/core/ui/MaterialIcon";

import { AppNotificationType } from "../../domain/models/appNotificationType";
import { NotificationCategory } from "../../domain/models/notificationCategory";

export const NotificationLabels = {
  category(category: NotificationCategory): string {
    switch (category) {
      case NotificationCategory.participationRequests:
        return "Solicitudes de participación";
      case NotificationCategory.taskApplications:
        return "Postulaciones a tareas";
      case NotificationCategory.completedTasks:
        return "Tareas completadas";
      case NotificationCategory.comments:
        return "Comentarios y respuestas";
      case NotificationCategory.messages:
        return "Nuevos mensajes";
      case NotificationCategory.mentions:
        return "Menciones";
      case NotificationCategory.platformNews:
        return "Novedades de la plataforma";
      case NotificationCategory.reminders:
        return "Recordatorios";
    }
  },

  shortCategory(category: NotificationCategory): string {
    switch (category) {
      case NotificationCategory.participationRequests:
        return "Solicitudes";
      case NotificationCategory.taskApplications:
        return "Postulaciones";
      case NotificationCategory.completedTasks:
        return "Completadas";
      case NotificationCategory.comments:
        return "Comentarios";
      case NotificationCategory.messages:
        return "Mensajes";
      case NotificationCategory.mentions:
        return "Menciones";
      case NotificationCategory.platformNews:
        return "Novedades";
      case NotificationCategory.reminders:
        return "Recordatorios";
    }
  },

  categoryIcon(category: NotificationCategory): IconName {
    switch (category) {
      case NotificationCategory.participationRequests:
        return "person_outline";
      case NotificationCategory.taskApplications:
        return "check_box_outlined";
      case NotificationCategory.completedTasks:
        return "task_alt";
      case NotificationCategory.comments:
        return "chat_bubble_outline";
      case NotificationCategory.messages:
        return "mail_outline";
      case NotificationCategory.mentions:
        return "alternate_email";
      case NotificationCategory.platformNews:
        return "info_outline";
      case NotificationCategory.reminders:
        return "alarm";
    }
  },

  typeIcon(type: string): IconName {
    switch (type) {
      case AppNotificationType.requestAccepted:
      case AppNotificationType.taskApplicationAccepted:
        return "check_box_outlined";
      case AppNotificationType.requestRejected:
      case AppNotificationType.taskApplicationRejected:
        return "highlight_off";
      case AppNotificationType.newComment:
        return "chat_bubble_outline";
      case AppNotificationType.commentReply:
        return "reply";
      case AppNotificationType.taskAssigned:
        return "assignment_ind_outlined";
      case AppNotificationType.taskReminder:
        return "alarm";
      case AppNotificationType.projectUpdate:
        return "campaign_outlined";
      case AppNotificationType.taskCompleted:
        return "task_alt";
      case AppNotificationType.newMessage:
        return "mail_outline";
      case AppNotificationType.taskApplication:
        return "assignment_ind_outlined";
      default:
        return "person_add_alt_1_outlined";
    }
  },

  isNegative(type: string): boolean {
    return type === AppNotificationType.requestRejected || type === AppNotificationType.taskApplicationRejected;
  },
};
