// Equivalente de profile/ui/widgets/activity_entry_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { timeAgo } from "@/src/core/utils/timeAgo";

import { ActivityEntry, ActivityKind } from "../../domain/models/activityEntry";
import { ProfileLabels } from "./profileLabels";

export function ActivityEntryTile({ entry, self, onTap }: { entry: ActivityEntry; self: boolean; onTap?: (() => void) | null }) {
  const subtitle = entry.detail == null || entry.kind === ActivityKind.comment ? entry.projectName : `${entry.projectName} · ${entry.detail}`;
  return (
    <InkWell onPress={onTap ?? undefined} style={{ paddingVertical: 10, flexDirection: "row", alignItems: "center" }}>
      <MaterialIcon name={ProfileLabels.activityIcon(entry.kind)} color={HomeColors.primaryPurple} size={24} />
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: HomeColors.textPrimary }}>{ProfileLabels.activityTitle(entry.kind, { self })}</Text>
        <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{subtitle}</Text>
      </View>
      {entry.date != null ? <Text style={{ fontSize: 11.5, color: HomeColors.textSecondary }}>{timeAgo(entry.date)}</Text> : null}
    </InkWell>
  );
}
