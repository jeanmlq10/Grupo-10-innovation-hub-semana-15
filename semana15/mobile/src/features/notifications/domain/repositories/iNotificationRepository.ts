import { AppNotification } from "../models/appNotification";

export type SendNotificationArgs = {
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  projectId: string;
  requestId?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  detail?: string | null;
};

/** Notificaciones persistentes (tabla `app_notifications`). */
export interface INotificationRepository {
  forUser(userId: string): Promise<AppNotification[]>;
  send(args: SendNotificationArgs): Promise<void>;
  markRead(id: string): Promise<void>;
}
