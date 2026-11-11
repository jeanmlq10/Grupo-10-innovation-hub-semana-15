// Equivalente de home/ui/widgets/home_bottom_navigation.dart:
// barra inferior "Explorar | Mis proyectos | Notificaciones | Perfil".
import React, { useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { requireSession } from "@/src/features/auth/ui/widgets/loginRequiredDialog";
import { Palette } from "@/src/core/theme/brand";
import { NotificationsController } from "@/src/features/notifications/ui/viewmodels/notificationsController";

const TABS: { icon: IconName; label: string; hasBadge?: boolean }[] = [
  { icon: "explore_outlined", label: "Explorar" },
  { icon: "folder_shared_outlined", label: "Mis proyectos" },
  { icon: "notifications_none", label: "Notificaciones", hasBadge: true },
  { icon: "person_outline", label: "Perfil" },
];

export function HomeBottomNavigation({ currentIndex = 0 }: { currentIndex?: number }) {
  const insets = useSafeAreaInsets();
  // El punto de Notificaciones sale del estado real: solo aparece si hay
  // notificaciones sin leer (Corrección 6.1). Antes era un punto fijo.
  const notifications = useFind<NotificationsController>(TOKENS.NotificationsController);
  useEffect(() => {
    void notifications.refreshIfStale();
  }, [notifications]);
  const hasUnread = notifications.hasUnread;

  const onTabTapped = (index: number) => {
    if (index === currentIndex) return;
    if (index !== 0 && !requireSession()) return;
    switch (index) {
      case 0:
        Nav.offNamed(RouteNames.home);
        break;
      case 1:
        Nav.offNamed(RouteNames.myProjects);
        break;
      case 2:
        Nav.offNamed(RouteNames.notifications);
        break;
      case 3:
        Nav.offNamed(RouteNames.profile);
        break;
    }
  };

  return (
    <View
      style={[
        {
          paddingTop: 10,
          paddingBottom: 10 + insets.bottom,
          backgroundColor: Colors.white,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          flexDirection: "row",
          justifyContent: "space-evenly",
        },
        boxShadow({ color: withAlpha(Palette.shadow, 0.08), blur: 16, dy: -2 }),
      ]}
    >
      {TABS.map((tab, index) => {
        const selected = index === currentIndex;
        return (
          <InkWell
            key={tab.label}
            circle
            accessibilityLabel={tab.hasBadge && hasUnread ? `${tab.label}, tienes notificaciones sin leer` : tab.label}
            testID={`tab_${index}`}
            onPress={() => onTabTapped(index)}
            style={{
              padding: 10,
              borderRadius: 999,
              backgroundColor: selected ? HomeColors.navSelectedBackground : "transparent",
            }}
          >
            <View>
              <MaterialIcon name={tab.icon} color={HomeColors.primaryPurple} size={26} />
              {tab.hasBadge && hasUnread ? (
                <View
                  testID="notifications_unread_dot"
                  style={{
                    position: "absolute",
                    top: -1,
                    right: -1,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: Palette.accent,
                    borderWidth: 1.5,
                    borderColor: Palette.primary,
                  }}
                />
              ) : null}
            </View>
          </InkWell>
        );
      })}
    </View>
  );
}
