// Comentarios de UN proyecto (Corrección 4.4): pantalla propia que se abre
// desde el icono de comentarios de la vista del proyecto. Cada comentario
// muestra autor, fecha y hora, y sus respuestas en hilo.
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, RefreshControl, Text, TextInput, View } from "react-native";
import type { TextInputInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useDI } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { Palette } from "@/src/core/theme/brand";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { formatDateTime } from "@/src/core/utils/dateFormat";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { CompactBackArrow } from "@/src/features/projects/ui/widgets/wizardBits";

import { CommentThread, ProjectComment } from "../../domain/models/projectComment";
import { CommentsController } from "../viewmodels/commentsController";

function Author({ comment, small }: { comment: ProjectComment; small?: boolean }) {
  const size = small ? 30 : 36;
  const open = () => {
    if (comment.authorUserId) void Nav.to("PublicProfile", { userId: comment.authorUserId, name: comment.authorName });
  };
  return (
    <InkWell
      onPress={comment.authorUserId ? open : undefined}
      accessibilityLabel={`Perfil de ${comment.authorName}`}
      borderRadius={size / 2}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontWeight: "700", color: HomeColors.primaryPurple, fontSize: small ? 13 : 15 }}>
        {comment.authorName.trim() === "" ? "?" : comment.authorName.trim()[0].toUpperCase()}
      </Text>
    </InkWell>
  );
}

function CommentBody({ comment, small, onReply }: { comment: ProjectComment; small?: boolean; onReply?: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      <Author comment={comment} small={small} />
      <View style={{ width: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", fontSize: small ? 13 : 14, color: HomeColors.textPrimary }}>{comment.authorName}</Text>
        <Text style={{ fontSize: 11.5, color: HomeColors.textSecondary }}>{formatDateTime(comment.createdAt)}</Text>
        <View style={{ height: 4 }} />
        <Text style={{ fontSize: small ? 13.5 : 14, color: HomeColors.textPrimary, lineHeight: (small ? 13.5 : 14) * 1.4 }}>{comment.text}</Text>
        {onReply ? (
          <InkWell
            testID={`reply_${comment.id}`}
            onPress={onReply}
            borderRadius={8}
            style={{ alignSelf: "flex-start", marginTop: 6, paddingVertical: 4, paddingRight: 8, flexDirection: "row", alignItems: "center" }}
          >
            <MaterialIcon name="reply" size={16} color={HomeColors.primaryPurple} />
            <View style={{ width: 4 }} />
            <Text style={{ fontSize: 12.5, fontWeight: "600", color: HomeColors.primaryPurple }}>Responder</Text>
          </InkWell>
        ) : null}
      </View>
    </View>
  );
}

function ThreadCard({
  thread,
  expanded,
  onToggle,
  onReply,
}: {
  thread: CommentThread;
  expanded: boolean;
  onToggle: () => void;
  onReply: (c: ProjectComment) => void;
}) {
  const count = thread.replies.length;
  return (
    <View
      testID={`thread_${thread.root.id}`}
      style={{ padding: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14, backgroundColor: Colors.white }}
    >
      <CommentBody comment={thread.root} onReply={() => onReply(thread.root)} />
      {count > 0 ? (
        <InkWell
          testID={`toggle_replies_${thread.root.id}`}
          onPress={onToggle}
          borderRadius={8}
          style={{ marginTop: 8, marginLeft: 46, paddingVertical: 4, flexDirection: "row", alignItems: "center", alignSelf: "flex-start" }}
        >
          <View style={{ width: 18, height: 1, backgroundColor: HomeColors.borderGrey }} />
          <View style={{ width: 8 }} />
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: HomeColors.textSecondary }}>
            {expanded ? "Ocultar respuestas" : count === 1 ? "Ver 1 respuesta" : `Ver ${count} respuestas`}
          </Text>
        </InkWell>
      ) : null}
      {expanded
        ? thread.replies.map((reply) => (
            <View key={reply.id} style={{ marginTop: 12, marginLeft: 46, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: HomeColors.navSelectedBackground }}>
              <CommentBody comment={reply} small onReply={() => onReply(thread.root)} />
            </View>
          ))
        : null}
    </View>
  );
}

export function ProjectCommentsPage({ args }: { args: ScreenParams["ProjectComments"] }) {
  const { projectId, projectName } = args;
  const controller = useDI().resolve<CommentsController>(TOKENS.CommentsController);
  const [threads, setThreads] = useState<CommentThread[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ProjectComment | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);

  const load = useCallback(async () => {
    try {
      setThreads(await controller.threadsFor(projectId));
      setLoadError(null);
    } catch (error) {
      setThreads([]);
      setLoadError(errorMessage(error));
    }
  }, [controller, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const startReply = (comment: ProjectComment) => {
    setReplyTo(comment);
    setExpanded((prev) => new Set(prev).add(comment.id));
    inputRef.current?.focus();
  };

  const send = async () => {
    const clean = text.trim();
    if (clean === "" || sending) return;
    setSending(true);
    try {
      await controller.addComment({ projectId, text: clean, parent: replyTo });
      if (replyTo) setExpanded((prev) => new Set(prev).add(replyTo.id));
      setText("");
      setReplyTo(null);
      await load();
    } catch (error) {
      snackbar("Comentarios", errorMessage(error), { position: "BOTTOM" });
    } finally {
      setSending(false);
    }
  };

  const list = threads ?? [];
  const total = list.reduce((sum, t) => sum + 1 + t.replies.length, 0);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right", "bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={{ paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center" }}>
            <CompactBackArrow />
            <View style={{ width: 14 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: HomeColors.textPrimary }}>{`Comentarios${threads ? ` (${total})` : ""}`}</Text>
              <Text numberOfLines={1} style={{ fontSize: 13, color: HomeColors.textSecondary }}>
                {projectName === "" ? "Proyecto" : projectName}
              </Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: HomeColors.borderGrey }} />
          <View style={{ flex: 1 }}>
            {threads == null ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <CircularProgressIndicator />
              </View>
            ) : list.length === 0 ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
                <MaterialIcon name="forum_outlined" size={40} color={HomeColors.placeholderGrey} />
                <View style={{ height: 10 }} />
                <Text style={{ textAlign: "center", color: HomeColors.textSecondary }}>
                  {loadError ?? "Todavía no hay comentarios en este proyecto. ¡Sé el primero!"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={list}
                keyExtractor={(t) => t.root.id}
                contentContainerStyle={{ padding: 16 }}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    colors={[HomeColors.primaryPurple]}
                    onRefresh={async () => {
                      setRefreshing(true);
                      await load();
                      setRefreshing(false);
                    }}
                  />
                }
                renderItem={({ item }) => (
                  <ThreadCard
                    thread={item}
                    expanded={expanded.has(item.root.id)}
                    onToggle={() =>
                      setExpanded((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.root.id)) next.delete(item.root.id);
                        else next.add(item.root.id);
                        return next;
                      })
                    }
                    onReply={startReply}
                  />
                )}
              />
            )}
          </View>
          {loadError == null || list.length > 0 ? (
            <View style={{ borderTopWidth: 1, borderTopColor: HomeColors.borderGrey, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
              {replyTo ? (
                <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 6 }}>
                  <MaterialIcon name="reply" size={16} color={HomeColors.textSecondary} />
                  <View style={{ width: 6 }} />
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 12.5, color: HomeColors.textSecondary }}>
                    {`Respondiendo a ${replyTo.authorName}`}
                  </Text>
                  <InkWell circle testID="cancel_reply" accessibilityLabel="Cancelar respuesta" onPress={() => setReplyTo(null)} style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcon name="close" size={16} color={HomeColors.textSecondary} />
                  </InkWell>
                </View>
              ) : null}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ flex: 1, backgroundColor: HomeColors.surfaceGrey, borderRadius: 22 }}>
                  <TextInput
                    ref={inputRef}
                    testID="comment_input"
                    value={text}
                    onChangeText={setText}
                    multiline
                    placeholder={replyTo ? "Escribe tu respuesta..." : "Escribe un comentario..."}
                    placeholderTextColor={HomeColors.textSecondary}
                    style={{
                      fontSize: 14.5,
                      color: HomeColors.textPrimary,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      maxHeight: 12 * 2 + 20 * 4,
                      ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
                    }}
                  />
                </View>
                <View style={{ width: 10 }} />
                <InkWell
                  circle
                  testID="comment_send"
                  accessibilityLabel={replyTo ? "Enviar respuesta" : "Enviar comentario"}
                  onPress={sending || text.trim() === "" ? null : () => void send()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: text.trim() === "" ? Palette.violetSoft : HomeColors.primaryPurple,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcon name="send_rounded" color={Colors.white} size={20} />
                </InkWell>
              </View>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
