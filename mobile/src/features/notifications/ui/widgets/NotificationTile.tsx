// Equivalente de notifications/ui/widgets/notification_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { timeAgo } from "@/src/core/utils/timeAgo";

import { AppNotification } from "../../domain/models/appNotification";
import { NotificationLabels } from "./notificationLabels";
import { Palette } from "@/src/core/theme/brand";

export function NotificationTile({ notification, onTap }: { notification: AppNotification; onTap: () => void }) {
  const negative = NotificationLabels.isNegative(notification.type);
  return (
    <InkWell
      onPress={onTap}
      borderRadius={14}
      testID={`notification_${notification.id}`}
      accessibilityLabel={`${notification.read ? "" : "Sin leer: "}${notification.title}`}
      style={{
        paddingLeft: 14,
        paddingTop: 14,
        paddingRight: 12,
        paddingBottom: 14,
        backgroundColor: notification.read ? Colors.white : Palette.violetFaint,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "flex-start",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: negative ? Palette.errorTint : HomeColors.navSelectedBackground,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcon name={NotificationLabels.typeIcon(notification.type)} color={negative ? Palette.error : HomeColors.primaryPurple} size={21} />
      </View>
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold", fontSize: 14, color: HomeColors.textPrimary }}>{notification.title}</Text>
        <View style={{ height: 3 }} />
        <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary, lineHeight: 12.5 * 1.3 }}>{notification.message}</Text>
        <View style={{ height: 6 }} />
        <Text style={{ fontSize: 11.5, color: HomeColors.textSecondary }}>{timeAgo(notification.createdAt)}</Text>
      </View>
      {!notification.read ? (
        <View
          testID={`notification_unread_${notification.id}`}
          style={{
            width: 9,
            height: 9,
            marginLeft: 8,
            marginTop: 4,
            borderRadius: 5,
            backgroundColor: Palette.secondary,
          }}
        />
      ) : null}
    </InkWell>
  );
}
