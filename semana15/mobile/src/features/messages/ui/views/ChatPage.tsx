// Chat privado entre dos personas, dentro de la app (Corrección 9).
// Encabezado centrado con la persona (avatar, nombre, carrera, proyectos
// activos y publicaciones), mensajes agrupados por día con hora y remitente,
// y campo "Mensaje" con botón de enviar. Roble no ofrece tiempo real, así que
// la conversación se actualiza sola cada pocos segundos mientras está abierta,
// sin recargar la pantalla ni mostrar el indicador de carga.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { M3 } from "@/src/core/theme/appTheme";
import { Palette } from "@/src/core/theme/brand";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { PublicProfile } from "@/src/features/profile/domain/models/publicProfile";
import { ProfileController } from "@/src/features/profile/ui/viewmodels/profileController";
import { ProfileAvatar } from "@/src/features/profile/ui/widgets/ProfileAvatar";
import { CompactBackArrow } from "@/src/features/projects/ui/widgets/wizardBits";

import { DirectMessage } from "../../domain/models/directMessage";
import { MessagesController } from "../viewmodels/messagesController";
import { MessageBubble } from "../widgets/MessageBubble";

/** Cada cuánto se buscan mensajes nuevos con el chat abierto. */
const POLL_MS = 5000;

function dayLabel(date: Date, now = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return formatShortDate(date);
}

type Row = { kind: "day"; key: string; label: string } | { kind: "msg"; key: string; message: DirectMessage; showSender: boolean };

/** Mensajes en orden cronológico con separadores de día. */
function buildRows(messages: DirectMessage[]): Row[] {
  const rows: Row[] = [];
  let lastDay = "";
  let lastSender = "";
  for (const m of messages) {
    const day = dayLabel(m.createdAt);
    if (day !== lastDay) {
      rows.push({ kind: "day", key: `day-${m.id}`, label: day });
      lastDay = day;
      lastSender = "";
    }
    rows.push({ kind: "msg", key: m.id, message: m, showSender: m.fromUserId !== lastSender });
    lastSender = m.fromUserId;
  }
  return rows;
}

function ChatHeader({ name, info, onOpenProfile }: { name: string; info: PublicProfile | null; onOpenProfile: () => void }) {
  const p = info?.profile;
  const s = info?.canSeeDetails ? info.summary : null;
  return (
    <InkWell testID="chat_header" accessibilityLabel={`Ver perfil de ${name}`} onPress={onOpenProfile} borderRadius={16} style={{ alignItems: "center", paddingVertical: 6 }}>
      <ProfileAvatar name={p?.name ?? name} iconKey={p?.avatarIcon} size={64} />
      <View style={{ height: 8 }} />
      <Text style={{ fontSize: 17, fontWeight: "bold", color: HomeColors.textPrimary }}>{p?.name || name}</Text>
      {p && p.career !== "" ? <Text style={{ marginTop: 2, fontSize: 13, color: HomeColors.textSecondary }}>{p.career}</Text> : null}
      {s ? (
        <Text style={{ marginTop: 1, fontSize: 13, color: HomeColors.textSecondary }}>
          {`Activo en ${s.activeProjects} ${s.activeProjects === 1 ? "proyecto" : "proyectos"} | ${s.publications} ${s.publications === 1 ? "publicación" : "publicaciones"}`}
        </Text>
      ) : null}
    </InkWell>
  );
}

export function ChatPage({ args }: { args: ScreenParams["Chat"] }) {
  const { otherUserId, otherName } = args;
  const di = useDI();
  const controller = di.resolve<MessagesController>(TOKENS.MessagesController);
  const profiles = di.resolve<ProfileController>(TOKENS.ProfileController);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<DirectMessage[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [sending, setSending] = useState(false);
  const [info, setInfo] = useState<PublicProfile | null>(null);
  const signature = useRef("");

  /** Trae la conversación; solo vuelve a pintar si cambió algo. */
  const refresh = useCallback(
    async ({ quiet }: { quiet: boolean }) => {
      try {
        const list = await controller.thread(otherUserId);
        const next = list.map((m) => `${m.id}:${m.read ? 1 : 0}`).join(",");
        if (next !== signature.current || !quiet) {
          signature.current = next;
          setMessages(list);
        }
        setLoadError(null);
      } catch (error) {
        if (!quiet) {
          setMessages([]);
          setLoadError(error);
        }
      }
    },
    [controller, otherUserId],
  );

  useEffect(() => {
    void refresh({ quiet: false });
    let timer: ReturnType<typeof setInterval> | null = setInterval(() => void refresh({ quiet: true }), POLL_MS);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void refresh({ quiet: true });
        if (timer == null) timer = setInterval(() => void refresh({ quiet: true }), POLL_MS);
      } else if (timer != null) {
        clearInterval(timer);
        timer = null;
      }
    });
    return () => {
      if (timer != null) clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  useEffect(() => {
    let active = true;
    profiles
      .publicProfile(otherUserId, { fallbackName: otherName })
      .then((p) => active && setInfo(p))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profiles, otherUserId, otherName]);

  const send = async () => {
    const clean = text.trim();
    if (clean === "" || sending) return;
    setSending(true);
    try {
      await controller.send({ toUserId: otherUserId, toName: otherName, text: clean });
      setText("");
      await refresh({ quiet: false });
    } catch (error) {
      snackbar("Mensajes", errorMessage(error), { position: "BOTTOM" });
    } finally {
      setSending(false);
    }
  };

  const me = controller.me ?? "";
  const rows = buildRows(messages ?? []);

  const body = () => {
    if (messages == null) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <CircularProgressIndicator />
        </View>
      );
    }
    if (loadError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: M3.onSurface, fontSize: 14, textAlign: "center" }}>{errorMessage(loadError)}</Text>
        </View>
      );
    }
    if (rows.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Text style={{ color: HomeColors.textSecondary, textAlign: "center" }}>
            {`Esta es tu conversación privada con ${otherName}. Escribe el primer mensaje.`}
          </Text>
        </View>
      );
    }
    return (
      <FlatList
        testID="chat_messages"
        inverted
        data={[...rows].reverse()}
        keyExtractor={(r) => r.key}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
        renderItem={({ item }) =>
          item.kind === "day" ? (
            <View style={{ alignItems: "center", marginVertical: 10 }}>
              <Text style={{ fontSize: 11.5, color: HomeColors.textSecondary, backgroundColor: HomeColors.surfaceGrey, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, overflow: "hidden" }}>
                {item.label}
              </Text>
            </View>
          ) : (
            <MessageBubble message={item.message} mine={item.message.isFrom(me)} showSender={item.showSender} />
          )
        }
      />
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ paddingLeft: 20, paddingTop: 12 }}>
            <CompactBackArrow />
          </View>
          <ChatHeader name={otherName} info={info} onOpenProfile={() => void Nav.to("PublicProfile", { userId: otherUserId, name: otherName })} />
          <View style={{ flex: 1 }}>{body()}</View>
          <View style={{ paddingLeft: 16, paddingTop: 6, paddingRight: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, backgroundColor: HomeColors.surfaceGrey, borderRadius: 22 }}>
              <TextInput
                testID="chat_input"
                value={text}
                onChangeText={setText}
                multiline
                placeholder="Mensaje"
                placeholderTextColor={M3.onSurfaceVariant}
                style={{
                  fontSize: 15,
                  color: M3.onSurface,
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  maxHeight: 12 * 2 + 22 * 4,
                  ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
                }}
              />
            </View>
            <View style={{ width: 10 }} />
            <InkWell
              circle
              testID="chat_send"
              accessibilityLabel="Enviar mensaje"
              onPress={sending || text.trim() === "" ? null : () => void send()}
              style={{
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: text.trim() === "" ? Palette.violetSoft : HomeColors.circlePurple,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialIcon name="send_rounded" color={Colors.white} size={21} />
            </InkWell>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
