// Burbuja de un mensaje: texto, remitente (en los mensajes recibidos, al
// empezar cada grupo) y hora de envío.
import React from "react";
import { Text, useWindowDimensions, View } from "react-native";

import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { formatTime } from "@/src/core/utils/dateFormat";

import { DirectMessage } from "../../domain/models/directMessage";

export function MessageBubble({ message, mine, showSender = false }: { message: DirectMessage; mine: boolean; showSender?: boolean }) {
  const { width } = useWindowDimensions();
  return (
    <View style={{ alignItems: mine ? "flex-end" : "flex-start" }} accessibilityLabel={`${mine ? "Tú" : message.fromName}: ${message.text}`}>
      {showSender ? (
        <Text style={{ marginTop: 6, marginHorizontal: 6, fontSize: 11.5, fontWeight: "600", color: HomeColors.textSecondary }}>
          {mine ? "Tú" : message.fromName}
        </Text>
      ) : null}
      <View
        style={{
          maxWidth: width * 0.75,
          marginVertical: 3,
          paddingLeft: 14,
          paddingTop: 10,
          paddingRight: 14,
          paddingBottom: 8,
          backgroundColor: mine ? HomeColors.primaryPurple : HomeColors.surfaceGrey,
          borderRadius: 16,
          borderBottomRightRadius: mine ? 4 : 16,
          borderBottomLeftRadius: mine ? 16 : 4,
          alignItems: "flex-end",
        }}
      >
        <Text style={{ color: mine ? Colors.white : HomeColors.textPrimary, fontSize: 14.5, alignSelf: "flex-start" }}>{message.text}</Text>
        <View style={{ height: 4 }} />
        <Text style={{ fontSize: 10.5, color: mine ? Colors.white70 : HomeColors.textSecondary }}>
          {mine && message.read ? `${formatTime(message.createdAt)} · Leído` : formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
