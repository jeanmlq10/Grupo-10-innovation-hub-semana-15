// Equivalente de messages/ui/widgets/conversation_tile.dart.
import React from "react";
import { Text, View } from "react-native";

import { HomeColors } from "@/src/core/theme/homeColors";
import { InkWell } from "@/src/core/ui/material";
import { timeAgo } from "@/src/core/utils/timeAgo";

import { Conversation } from "../../domain/models/conversation";

export function ConversationTile({ conversation, myUserId, onTap }: { conversation: Conversation; myUserId: string; onTap: () => void }) {
  const last = conversation.lastMessage;
  const preview = last.isFrom(myUserId) ? `Tú: ${last.text}` : last.text;
  return (
    <InkWell onPress={onTap} accessibilityLabel={conversation.otherName} style={{ paddingVertical: 10, flexDirection: "row", alignItems: "center" }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: HomeColors.primaryPurple, fontWeight: "bold", fontSize: 16 }}>
          {conversation.otherName === "" ? "?" : conversation.otherName[0].toUpperCase()}
        </Text>
      </View>
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>{conversation.otherName}</Text>
        <View style={{ height: 2 }} />
        <Text numberOfLines={1} style={{ fontSize: 13, color: HomeColors.textSecondary }}>
          {preview}
        </Text>
      </View>
      <View style={{ width: 8 }} />
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 11, color: HomeColors.textSecondary }}>{timeAgo(last.createdAt)}</Text>
        <View style={{ height: 6 }} />
        {conversation.unreadCount > 0 ? (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: HomeColors.primaryPurple }} />
        ) : null}
      </View>
    </InkWell>
  );
}
