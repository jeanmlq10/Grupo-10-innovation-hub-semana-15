import { NOTIFICATION_CATEGORY_VALUES, NotificationCategory } from "./notificationCategory";

/** Los interruptores de "Perfil → Notificaciones". */
export enum NotificationPreference {
  messages = "messages",
  projectActivity = "projectActivity",
  participationRequests = "participationRequests",
  comments = "comments",
  reminders = "reminders",
  platformNews = "platformNews",
}

export const NOTIFICATION_PREFERENCE_VALUES: NotificationPreference[] = [
  NotificationPreference.messages,
  NotificationPreference.projectActivity,
  NotificationPreference.participationRequests,
  NotificationPreference.comments,
  NotificationPreference.reminders,
  NotificationPreference.platformNews,
];

export const NotificationPreferences = {
  categories(p: NotificationPreference): Set<NotificationCategory> {
    switch (p) {
      case NotificationPreference.messages:
        return new Set([NotificationCategory.messages]);
      case NotificationPreference.projectActivity:
        return new Set([NotificationCategory.completedTasks, NotificationCategory.mentions]);
      case NotificationPreference.participationRequests:
        return new Set([NotificationCategory.participationRequests, NotificationCategory.taskApplications]);
      case NotificationPreference.comments:
        return new Set([NotificationCategory.comments]);
      case NotificationPreference.reminders:
        return new Set([NotificationCategory.reminders]);
      case NotificationPreference.platformNews:
        return new Set([NotificationCategory.platformNews]);
    }
  },

  key(p: NotificationPreference): string {
    return p;
  },

  fromKey(key: string): NotificationPreference | null {
    return NOTIFICATION_PREFERENCE_VALUES.find((v) => v === key) ?? null;
  },

  mutedCategories({ allEnabled, mutedKeys }: { allEnabled: boolean; mutedKeys: Set<string> }): Set<NotificationCategory> {
    if (!allEnabled) return new Set(NOTIFICATION_CATEGORY_VALUES);
    const out = new Set<NotificationCategory>();
    for (const key of mutedKeys) {
      const pref = NotificationPreferences.fromKey(key);
      if (pref) NotificationPreferences.categories(pref).forEach((c) => out.add(c));
    }
    return out;
  },
};
