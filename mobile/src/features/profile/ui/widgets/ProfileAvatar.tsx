// Equivalente de profile/ui/widgets/profile_avatar.dart: el icono elegido o la inicial.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { AvatarIcons } from "./avatarIcons";

export function ProfileAvatar({ name, iconKey, size = 64 }: { name: string; iconKey?: string | null; size?: number }) {
  const icon = AvatarIcons.of(iconKey);
  const initial = name.trim() === "" ? "?" : name.trim()[0].toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: HomeColors.navSelectedBackground,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {icon != null ? (
        <MaterialIcon name={icon} size={size * 0.55} color={HomeColors.primaryPurple} />
      ) : (
        <Text style={{ fontSize: size * 0.42, fontWeight: "bold", color: HomeColors.primaryPurple }}>{initial}</Text>
      )}
    </View>
  );
}
