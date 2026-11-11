// Equivalente de profile/ui/views/notification_settings_page.dart: "Perfil → Notificaciones".
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { M3 } from "@/src/core/theme/appTheme";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, M3Switch } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { NotificationPreference, NotificationPreferences } from "@/src/features/notifications/domain/models/notificationPreference";

import { ProfileController } from "../viewmodels/profileController";

const ROWS: [NotificationPreference, IconName, string][] = [
  [NotificationPreference.messages, "chat_bubble_outline", "Nuevos mensajes"],
  [NotificationPreference.projectActivity, "history", "Actividad en proyectos"],
  [NotificationPreference.participationRequests, "group_add_outlined", "Solicitudes de participación"],
  [NotificationPreference.comments, "mode_comment_outlined", "Comentarios"],
  [NotificationPreference.reminders, "alarm", "Recordatorios"],
  [NotificationPreference.platformNews, "campaign_outlined", "Novedades de la plataforma"],
];

function Row({ icon, title, value, onChanged }: { icon: IconName; title: string; value: boolean; onChanged: (on: boolean) => void }) {
  return (
    <View style={{ paddingVertical: 4, flexDirection: "row", alignItems: "center" }}>
      <MaterialIcon name={icon} color={HomeColors.primaryPurple} />
      <View style={{ width: 14 }} />
      <Text style={{ flex: 1, fontSize: 14.5, color: M3.onSurface }}>{title}</Text>
      <M3Switch value={value} activeColor={HomeColors.primaryPurple} onChange={onChanged} />
    </View>
  );
}

export function NotificationSettingsPage() {
  const di = useDI();
  const [controller] = useState(() => di.resolve<ProfileController>(TOKENS.ProfileController));
  const p = controller.profile.value;
  const [all, setAll] = useState(p?.notificationsEnabled ?? true);
  const [muted, setMuted] = useState<Set<string>>(() => new Set(p?.mutedNotifications ?? []));

  const save = (enabled: boolean, m: Set<string>) => void controller.saveNotificationPrefs({ enabled, muted: m });

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Notificaciones" titleStyle={{ fontWeight: "bold" }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}>
        <Row
          icon="notifications_none"
          title="Todas las notificaciones"
          value={all}
          onChanged={(on) => {
            setAll(on);
            save(on, muted);
          }}
        />
        {ROWS.map(([pref, icon, title]) => {
          const key = NotificationPreferences.key(pref);
          return (
            <Row
              key={key}
              icon={icon}
              title={title}
              value={all && !muted.has(key)}
              onChanged={(on) => {
                const next = new Set(muted);
                let nextAll = all;
                if (on) {
                  nextAll = true;
                  next.delete(key);
                } else {
                  next.add(key);
                }
                setAll(nextAll);
                setMuted(next);
                save(nextAll, next);
              }}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}
