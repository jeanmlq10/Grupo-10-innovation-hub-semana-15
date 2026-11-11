// Equivalente de messages/ui/views/messages_page.dart: "Mensajes".
import React, { useEffect, useState } from "react";
import { FlatList, Platform, RefreshControl, Text, TextInput, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { M3 } from "@/src/core/theme/appTheme";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, CircularProgressIndicator, Divider } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { MessagesController } from "../viewmodels/messagesController";
import { ConversationTile } from "../widgets/ConversationTile";

export function MessagesPage() {
  const controller = useFind<MessagesController>(TOKENS.MessagesController);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    controller.search.value = "";
    void controller.loadConversations();
  }, [controller]);

  const body = () => {
    if (controller.isLoading.value) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    const list = controller.conversations;
    if (list.length === 0) {
      const error = controller.loadError.value;
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ textAlign: "center", color: HomeColors.textSecondary }}>
            {error !== "" ? error : "Todavía no tienes conversaciones.\nEscríbele a alguien desde su perfil."}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        data={list}
        keyExtractor={(c) => c.otherUserId}
        ItemSeparatorComponent={() => <Divider height={1} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            colors={[HomeColors.primaryPurple]}
            onRefresh={async () => {
              setRefreshing(true);
              await controller.loadConversations();
              setRefreshing(false);
            }}
          />
        }
        renderItem={({ item }) => (
          <ConversationTile
            conversation={item}
            myUserId={controller.me ?? ""}
            onTap={async () => {
              await Nav.to("Chat", { otherUserId: item.otherUserId, otherName: item.otherName });
              void controller.loadConversations();
            }}
          />
        )}
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Mensajes" titleStyle={{ fontWeight: "bold" }} />
      <View style={{ flex: 1, paddingLeft: 20, paddingTop: 4, paddingRight: 20 }}>
        <View style={{ backgroundColor: HomeColors.flowSearchFill, borderRadius: 10, flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 48, alignItems: "center" }}>
            <MaterialIcon name="search_rounded" color={M3.onSurfaceVariant} />
          </View>
          <TextInput
            onChangeText={(v) => (controller.search.value = v)}
            placeholder="Buscar conversaciones..."
            placeholderTextColor={M3.onSurfaceVariant}
            style={{
              flex: 1,
              fontSize: 16,
              color: M3.onSurface,
              paddingVertical: 14,
              paddingRight: 12,
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
        </View>
        <View style={{ height: 8 }} />
        <View style={{ flex: 1 }}>{body()}</View>
      </View>
    </View>
  );
}
