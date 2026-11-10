// "Ver proyecto" (Corrección 4): vista general del proyecto.
// Pestañas: Resumen (información general, creador, avance, equipo) · Tareas ·
// Equipo. La antigua pestaña "Actividad" se quitó y los comentarios se abren
// desde el icono superior (pantalla ProjectComments, con respuestas).
import React, { useCallback, useEffect, useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { Animated, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { ScreenParams } from "@/src/core/navigation/routes";
import { boxShadow } from "@/src/core/theme/shadow";
import { Colors, HomeColors, withAlpha } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, FilledButton, IconButton, InkWell, LinearProgressIndicator } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { PopupItem, PopupMenuButton } from "@/src/core/ui/popupMenu";
import { TabBar, TabBarView } from "@/src/core/ui/tabs";
import { DashedBorder } from "@/src/core/widgets/DashedBorder";
import { formatShortDate } from "@/src/core/utils/dateFormat";
import { errorMessage } from "@/src/core/utils/errorMessage";
import { requireSession } from "@/src/features/auth/ui/widgets/loginRequiredDialog";
import { showProjectComments } from "@/src/features/comments/ui/widgets/ProjectCommentsSheet";
import { ProjectMember } from "@/src/features/members/domain/models/projectMember";
import { ProjectTask, TaskDisplayStatus, TaskProgress, TaskVisibility } from "@/src/features/tasks/domain/models/projectTask";

import { Project } from "../../domain/models/project";
import { ProjectDetailController, ProjectOverview } from "../viewmodels/projectDetailController";
import { Palette } from "@/src/core/theme/brand";
import { BrandGradientBox } from "@/src/core/widgets/BrandGradientBox";
import { ProjectAvatar } from "../widgets/ProjectAvatar";

function membersLabel(project: Project): string | null {
  const needed = Object.values(project.teamRoles).reduce((s, c) => s + c, 0);
  if (needed > 0) return `${needed} miembros`;
  if (project.acceptedMembersCount > 0) return `${project.acceptedMembersCount} miembros`;
  return null;
}

/** Carga los datos de una pestaña cada vez que se abre (_RobleTabState). */
function useTabFuture<T>(load: () => Promise<T>) {
  const [state, setState] = useState<{ done: boolean; data?: T; error?: unknown }>({ done: false });
  const loadRef = useRef(load);
  loadRef.current = load;
  const run = useCallback(() => {
    let active = true;
    setState({ done: false });
    loadRef
      .current()
      .then((data) => active && setState({ done: true, data }))
      .catch((error) => active && setState({ done: true, error }));
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => run(), [run]);
  return { state, reload: run };
}

function EmptyTab({ message }: { message: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: HomeColors.textSecondary, textAlign: "center" }}>{message}</Text>
    </View>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <CircularProgressIndicator />
    </View>
  );
}

function TagChip({ label, icon }: { label: string; icon?: IconName }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: HomeColors.surfaceGrey, borderRadius: 16, flexDirection: "row", alignItems: "center" }}>
      {icon ? (
        <>
          <MaterialIcon name={icon} size={14} color={HomeColors.textSecondary} />
          <View style={{ width: 5 }} />
        </>
      ) : null}
      <Text style={{ fontSize: 12, fontWeight: "500", color: HomeColors.textPrimary }}>{label}</Text>
    </View>
  );
}

function MiniTag({ label, icon }: { label: string; icon?: IconName }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: HomeColors.surfaceGrey, borderRadius: 14, flexDirection: "row", alignItems: "center" }}>
      {icon ? (
        <>
          <MaterialIcon name={icon} size={12} color={HomeColors.textSecondary} />
          <View style={{ width: 4 }} />
        </>
      ) : null}
      <Text style={{ fontSize: 11, color: HomeColors.textSecondary }}>{label}</Text>
    </View>
  );
}

function TopBar({
  isFollowing,
  showMore,
  commentCount,
  onBack,
  onComments,
  onFollow,
  onMore,
}: {
  isFollowing: boolean;
  showMore: boolean;
  commentCount: number | null;
  onBack: () => void;
  onComments: () => void;
  onFollow: () => void;
  onMore: () => void;
}) {
  return (
    <View style={{ paddingLeft: 20, paddingTop: 10, paddingRight: 10, flexDirection: "row", alignItems: "center" }}>
      <InkWell circle accessibilityLabel="Atrás" onPress={onBack} style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcon name="arrow_back" color={HomeColors.textPrimary} />
      </InkWell>
      <View style={{ flex: 1 }} />
      <View>
        <InkWell
          circle
          testID="comments_button"
          accessibilityLabel="Comentarios del proyecto"
          onPress={onComments}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}
        >
          <MaterialIcon name="chat_bubble_outline" color={HomeColors.primaryPurple} size={21} />
        </InkWell>
        {commentCount != null && commentCount > 0 ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 18,
              height: 18,
              paddingHorizontal: 4,
              borderRadius: 9,
              backgroundColor: Palette.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: Colors.white, fontSize: 10.5, fontWeight: "700" }}>{commentCount > 99 ? "99+" : commentCount}</Text>
          </View>
        ) : null}
      </View>
      <View style={{ width: 10 }} />
      <InkWell
        circle
        testID="follow_button"
        accessibilityLabel={isFollowing ? "Dejar de seguir" : "Seguir proyecto"}
        onPress={onFollow}
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}
      >
        <MaterialIcon name={isFollowing ? "notifications" : "notifications_none"} color={HomeColors.primaryPurple} size={22} />
      </InkWell>
      {showMore ? (
        <IconButton icon="more_vert" tooltip="Más opciones" color={HomeColors.textPrimary} onPress={onMore} style={{ marginLeft: 0, paddingLeft: 8 }} />
      ) : null}
    </View>
  );
}

function statusOf(project: Project): { label: string; icon: IconName } {
  if (project.isDraft) return { label: project.audience === "Solo yo" ? "Privado" : "Borrador", icon: "lock_outline" };
  if (project.isTeamCallOpenAt() && project.canApply) return { label: "Convocatoria abierta", icon: "campaign_outlined" };
  return { label: "Publicado", icon: "public" };
}

function LargeProjectHeader({ project }: { project: Project }) {
  const category = project.categories.length > 0 ? project.categories[0] : null;
  const label = membersLabel(project);
  const status = statusOf(project);
  return (
    <View style={{ paddingLeft: 20, paddingTop: 4, paddingRight: 20 }}>
      <BrandGradientBox style={{ height: 108, borderRadius: 14, alignItems: "center", justifyContent: "center" }}>
        <ProjectAvatar imageUrl={project.imageUrl} imageFileId={project.imageFileId} categories={project.categories} size={72} radius={18} testID="project_image" />
      </BrandGradientBox>
      <View style={{ height: 12 }} />
      <Text style={{ fontSize: 20, fontWeight: "700", color: HomeColors.textPrimary }}>{project.name === "" ? "(Sin nombre)" : project.name}</Text>
      {category != null || label != null ? (
        <>
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {category != null ? <TagChip label={category} /> : null}
            <TagChip icon={status.icon} label={status.label} />
            {label != null ? <TagChip icon="groups_outlined" label={label} /> : null}
          </View>
        </>
      ) : (
        <>
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <TagChip icon={status.icon} label={status.label} />
          </View>
        </>
      )}
    </View>
  );
}

function CompactProjectHeader({ project }: { project: Project }) {
  const category = project.categories.length > 0 ? project.categories[0] : null;
  const label = membersLabel(project);
  return (
    <View style={{ paddingLeft: 20, paddingTop: 6, paddingRight: 20, flexDirection: "row", alignItems: "center" }}>
      <ProjectAvatar imageUrl={project.imageUrl} imageFileId={project.imageFileId} categories={project.categories} size={52} radius={14} />
      <View style={{ width: 12 }} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontSize: 18, fontWeight: "700", color: HomeColors.textPrimary }}>
          {project.name === "" ? "(Sin nombre)" : project.name}
        </Text>
        <View style={{ height: 7 }} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 6, rowGap: 4 }}>
          {category != null ? <MiniTag label={category} /> : null}
          {label != null ? <MiniTag icon="groups_outlined" label={label} /> : null}
        </View>
      </View>
    </View>
  );
}

/** AnimatedSwitcher de 160 ms entre la cabecera grande y la compacta. */
function FadeSwitch({ switchKey, children }: { switchKey: string; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
  }, [opacity, switchKey]);
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={{ fontSize: 14.5, fontWeight: "700", color: HomeColors.textPrimary, marginBottom: 10 }}>{children}</Text>;
}

function Card({ children, testID }: { children: React.ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={{ padding: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14, backgroundColor: Colors.white }}>
      {children}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 6 }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
        <MaterialIcon name={icon} size={17} color={HomeColors.primaryPurple} />
      </View>
      <View style={{ width: 12 }} />
      <Text style={{ flex: 1, fontSize: 13, color: HomeColors.textSecondary }}>{label}</Text>
      <Text style={{ flexShrink: 1, maxWidth: "55%", textAlign: "right", fontSize: 13.5, fontWeight: "600", color: HomeColors.textPrimary }}>{value}</Text>
    </View>
  );
}

function ProgressRow({ label, done, total, testID }: { label: string; done: number; total: number; testID?: string }) {
  const value = total <= 0 ? 0 : Math.min(1, done / total);
  return (
    <View testID={testID} style={{ paddingVertical: 6 }}>
      <View style={{ flexDirection: "row", marginBottom: 6 }}>
        <Text style={{ flex: 1, fontSize: 13, color: HomeColors.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{total <= 0 ? "Sin datos" : `${done} de ${total}`}</Text>
      </View>
      <View style={{ borderRadius: 6, overflow: "hidden" }}>
        <LinearProgressIndicator value={value} minHeight={8} backgroundColor={HomeColors.navSelectedBackground} color={HomeColors.primaryPurple} />
      </View>
    </View>
  );
}

function OverviewTab({
  project,
  controller,
  onSeeTeam,
}: {
  project: Project;
  controller: ProjectDetailController;
  onSeeTeam: () => void;
}) {
  const { state } = useTabFuture<ProjectOverview>(() => controller.overview(project));
  const membersNeeded = Object.values(project.teamRoles).reduce((s, c) => s + c, 0);
  const status = statusOf(project);
  const overview = state.data;
  const tasks = overview?.allTasks ?? [];
  const completed = tasks.filter((t) => t.progress === TaskProgress.completed).length;
  const inProgress = tasks.filter((t) => t.progress === TaskProgress.inProgress).length;
  const members = overview?.members ?? [];
  const creatorName = project.createdByName ?? "Creador/a";

  return (
    <ScrollView testID="overview_tab" contentContainerStyle={{ paddingLeft: 20, paddingTop: 18, paddingRight: 20, paddingBottom: 16, gap: 16 }}>
      <View>
        <SectionTitle>Descripción</SectionTitle>
        <Text style={{ fontSize: 14.5, color: HomeColors.textPrimary, lineHeight: 14.5 * 1.45 }}>
          {project.description === "" ? "Este proyecto todavía no tiene descripción." : project.description}
        </Text>
      </View>

      {project.objectives.length > 0 ? (
        <View testID="objectives_section">
          <SectionTitle>Objetivos</SectionTitle>
          <View style={{ gap: 8 }}>
            {project.objectives.map((o, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ marginTop: 1, width: 22, height: 22, borderRadius: 11, backgroundColor: Palette.limeTint, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 11.5, fontWeight: "700", color: Palette.primary }}>{i + 1}</Text>
                </View>
                <View style={{ width: 10 }} />
                <Text style={{ flex: 1, fontSize: 14, color: HomeColors.textPrimary, lineHeight: 14 * 1.4 }}>{o}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View>
        <SectionTitle>Información general</SectionTitle>
        <Card>
          <InfoRow icon="label_outline" label="Categoría" value={project.categories.length > 0 ? project.categories.join(", ") : "Sin categoría"} />
          <InfoRow icon={status.icon} label="Estado" value={status.label} />
          {project.stage ? <InfoRow icon="rocket_launch_rounded" label="Etapa" value={project.stage} /> : null}
          {project.duration ? <InfoRow icon="schedule_outlined" label="Tiempo estimado" value={project.duration} /> : null}
          {project.createdAt ? <InfoRow icon="calendar_today_outlined" label="Creado el" value={formatShortDate(project.createdAt)} /> : null}
          {project.teamDeadline ? (
            <InfoRow icon="event_busy_outlined" label="Postulaciones al equipo" value={`Hasta ${formatShortDate(project.teamDeadline)}`} />
          ) : null}
        </Card>
      </View>

      <View>
        <SectionTitle>Creador</SectionTitle>
        <InkWell
          testID="creator_card"
          onPress={
            project.createdBy
              ? () => {
                  if (!requireSession()) return;
                  void Nav.to("PublicProfile", { userId: project.createdBy!, name: creatorName });
                }
              : undefined
          }
          borderRadius={14}
          style={{ padding: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14, flexDirection: "row", alignItems: "center" }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontWeight: "700", color: HomeColors.primaryPurple, fontSize: 16 }}>{creatorName.trim() === "" ? "?" : creatorName.trim()[0].toUpperCase()}</Text>
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "700", fontSize: 14, color: HomeColors.textPrimary }}>{creatorName}</Text>
            <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>
              {controller.isOwner(project) ? "Tú creaste este proyecto" : "Creador/a del proyecto · Ver perfil"}
            </Text>
          </View>
          {project.createdBy && !controller.isOwner(project) ? <MaterialIcon name="chevron_right" color={HomeColors.textSecondary} /> : null}
        </InkWell>
      </View>

      <View>
        <SectionTitle>Avance</SectionTitle>
        <Card testID="progress_card">
          {!state.done ? (
            <View style={{ paddingVertical: 12, alignItems: "center" }}>
              <CircularProgressIndicator />
            </View>
          ) : (
            <>
              <ProgressRow testID="progress_tasks" label="Tareas completadas" done={completed} total={tasks.length} />
              {tasks.length > 0 ? (
                <Text style={{ fontSize: 12, color: HomeColors.textSecondary, marginTop: 2 }}>
                  {`${completed} completadas · ${inProgress} en progreso · ${tasks.length - completed - inProgress} disponibles`}
                </Text>
              ) : null}
              <View style={{ height: 8 }} />
              <ProgressRow
                testID="progress_team"
                label="Equipo conformado"
                done={project.acceptedMembersCount}
                total={Math.max(membersNeeded, project.acceptedMembersCount)}
              />
            </>
          )}
        </Card>
      </View>

      {overview?.teamAccess ? (
        <View testID="documents_section">
          <SectionTitle>Documentos del proyecto</SectionTitle>
          <Card>
            {(overview?.documents ?? []).length === 0 ? (
              <Text style={{ color: HomeColors.textSecondary, fontSize: 13.5 }}>Este proyecto todavía no tiene documentos de contexto.</Text>
            ) : (
              <View style={{ gap: 6 }}>
                {overview!.documents.map((d) => (
                  <InkWell
                    key={d.id}
                    testID={`document_${d.id}`}
                    borderRadius={10}
                    onPress={async () => {
                      try {
                        await WebBrowser.openBrowserAsync(await controller.documentUrl(project, d));
                      } catch (error) {
                        snackbar("Documentos", errorMessage(error), { position: "BOTTOM" });
                      }
                    }}
                    style={{ paddingVertical: 6, flexDirection: "row", alignItems: "center" }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
                      <MaterialIcon name={d.extension === "pdf" ? "picture_as_pdf_outlined" : "insert_drive_file_outlined"} size={18} color={HomeColors.primaryPurple} />
                    </View>
                    <View style={{ width: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "600", color: HomeColors.textPrimary }}>{d.fileName}</Text>
                      <Text style={{ fontSize: 12, color: HomeColors.textSecondary }}>{[d.extension.toUpperCase(), d.sizeLabel].filter((x) => x !== "").join(" · ")}</Text>
                    </View>
                    <MaterialIcon name="download_outlined" size={20} color={HomeColors.textSecondary} />
                  </InkWell>
                ))}
              </View>
            )}
            <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}>
              <MaterialIcon name="lock_outlined" size={14} color={HomeColors.textSecondary} />
              <View style={{ width: 4 }} />
              <Text style={{ fontSize: 11.5, color: HomeColors.textSecondary }}>Visible solo para el creador y el equipo</Text>
            </View>
          </Card>
        </View>
      ) : null}

      <View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <SectionTitle>Integrantes del equipo</SectionTitle>
          </View>
          <InkWell testID="see_team" onPress={onSeeTeam} borderRadius={8} style={{ paddingVertical: 4, paddingHorizontal: 6, marginTop: -10 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: HomeColors.primaryPurple }}>Ver equipo</Text>
          </InkWell>
        </View>
        <Card>
          {controller.isGuest ? (
            <Text style={{ color: HomeColors.textSecondary, fontSize: 13.5 }}>Inicia sesión para ver quiénes forman el equipo.</Text>
          ) : !state.done ? (
            <CircularProgressIndicator />
          ) : members.length === 0 ? (
            <Text style={{ color: HomeColors.textSecondary, fontSize: 13.5 }}>Todavía no hay integrantes.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {members.slice(0, 4).map((m) => (
                <View key={m.id} style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
                    <MaterialIcon name="person" color={HomeColors.primaryPurple} size={17} />
                  </View>
                  <View style={{ width: 10 }} />
                  <Text style={{ flex: 1, fontSize: 13.5, fontWeight: "600", color: HomeColors.textPrimary }}>{m.name}</Text>
                  <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{m.role}</Text>
                </View>
              ))}
              {members.length > 4 ? (
                <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{`y ${members.length - 4} más`}</Text>
              ) : null}
            </View>
          )}
        </Card>
      </View>
    </ScrollView>
  );
}

function TaskStatusBadge({ status }: { status: TaskDisplayStatus }) {
  const [label, background, foreground] = (() => {
    switch (status) {
      case TaskDisplayStatus.available:
        return ["Disponible", Palette.successBackground, Palette.successForeground];
      case TaskDisplayStatus.inProgress:
        return ["En progreso", Palette.progressBackground, Palette.progressForeground];
      case TaskDisplayStatus.completed:
        return ["Completada", HomeColors.navSelectedBackground, HomeColors.primaryPurple];
      case TaskDisplayStatus.closed:
        return ["Cerrada", HomeColors.surfaceGrey, HomeColors.textSecondary];
    }
  })();
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 3, backgroundColor: background, borderRadius: 20 }}>
      <Text style={{ fontSize: 11.5, fontWeight: "600", color: foreground }}>{label}</Text>
    </View>
  );
}

function DeadlineLine({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <MaterialIcon name="calendar_month_outlined" size={15} color={HomeColors.primaryPurple} />
      <View style={{ width: 6 }} />
      <Text style={{ flex: 1, fontSize: 12.5, color: HomeColors.textSecondary }}>{text}</Text>
    </View>
  );
}

function CardActionButton({ label, onPressed }: { label: string; onPressed: () => void }) {
  return (
    <FilledButton
      label={label}
      onPress={onPressed}
      backgroundColor={HomeColors.primaryPurple}
      foregroundColor={Colors.white}
      borderRadius={10}
      style={{ paddingVertical: 10 }}
      textStyle={{ fontSize: 13.5, fontWeight: "600" }}
    />
  );
}

function TaskCard({
  task,
  now,
  canApply,
  isOwner,
  onApply,
  onProgress,
  onVisibility,
}: {
  task: ProjectTask;
  now: Date;
  canApply: boolean;
  isOwner: boolean;
  onApply: () => void;
  onProgress: (p: TaskProgress) => void;
  onVisibility: (v: TaskVisibility) => void;
}) {
  const missing = task.numberNeeded - task.numberAccepted;
  const menu: PopupItem<string>[] = [
    { value: TaskProgress.available, label: "Marcar como disponible" },
    { value: TaskProgress.inProgress, label: "Marcar en progreso" },
    { value: TaskProgress.completed, label: "Marcar como completada" },
    task.isTeamOnly
      ? { value: `visibility:${TaskVisibility.public}`, label: "Hacer pública" }
      : { value: `visibility:${TaskVisibility.team}`, label: "Visible solo para el equipo" },
  ];
  return (
    <View style={{ marginBottom: 12, paddingLeft: 14, paddingTop: 12, paddingRight: 10, paddingBottom: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
        <View style={{ width: 38, height: 38, backgroundColor: HomeColors.navSelectedBackground, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcon name="description_outlined" color={HomeColors.primaryPurple} size={20} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 14, color: HomeColors.textPrimary }}>{task.title}</Text>
          {task.description.trim() !== "" ? (
            <Text style={{ marginTop: 2, fontSize: 12.5, color: HomeColors.textSecondary }}>{task.description}</Text>
          ) : null}
          {missing > 0 ? <Text style={{ marginTop: 2, fontSize: 12, color: HomeColors.textSecondary }}>{`Se necesitan ${missing}`}</Text> : null}
          {task.isTeamOnly ? (
            <View style={{ marginTop: 6, alignSelf: "flex-start" }}>
              <MiniTag icon="lock_outline" label="Solo equipo" />
            </View>
          ) : null}
        </View>
        <View style={{ width: 6 }} />
        <TaskStatusBadge status={task.displayStatusAt(now)} />
        {isOwner ? (
          <View style={{ marginTop: -12, marginRight: -10 }}>
            <PopupMenuButton<string>
              testID={`task_menu_${task.id}`}
              tooltip="Opciones de la tarea"
              iconSize={20}
              color={HomeColors.textSecondary}
              onSelected={(value) => {
                if (value.startsWith("visibility:")) onVisibility(value.substring("visibility:".length) as TaskVisibility);
                else onProgress(value as TaskProgress);
              }}
              items={menu}
            />
          </View>
        ) : null}
      </View>
      {task.deadline != null ? (
        <View style={{ marginTop: 10 }}>
          <DeadlineLine text={`Postulaciones hasta: ${formatShortDate(task.deadline)}`} />
        </View>
      ) : null}
      {canApply ? (
        <View style={{ marginTop: 10 }}>
          <CardActionButton label="Postularme a una tarea" onPressed={onApply} />
        </View>
      ) : null}
    </View>
  );
}

function TasksTab({ project, controller }: { project: Project; controller: ProjectDetailController }) {
  const { state, reload } = useTabFuture(() => controller.overview(project));
  if (!state.done) return <Loading />;
  if (state.error) return <EmptyTab message={errorMessage(state.error)} />;
  const tasks = state.data?.visibleTasks ?? [];
  const hiddenCount = (state.data?.allTasks.length ?? 0) - tasks.length;
  const isOwner = controller.isOwner(project);
  const canApply = project.canApply && project.isPublic && !isOwner;
  const now = new Date();

  const changeProgress = async (task: ProjectTask, progress: TaskProgress) => {
    try {
      await controller.setTaskProgress(project, task, progress);
      reload();
    } catch (error) {
      snackbar("Estado de la tarea", errorMessage(error), { position: "BOTTOM" });
    }
  };

  const changeVisibility = async (task: ProjectTask, visibility: TaskVisibility) => {
    try {
      await controller.setTaskVisibility(project, task, visibility);
      snackbar(
        "Visibilidad de la tarea",
        visibility === TaskVisibility.team ? "Ahora solo la ve el equipo del proyecto." : "Ahora la ve cualquier persona que consulte el proyecto.",
        { position: "BOTTOM" },
      );
      reload();
    } catch (error) {
      snackbar("Visibilidad de la tarea", errorMessage(error), { position: "BOTTOM" });
    }
  };

  const hiddenNote =
    hiddenCount > 0 ? (
      <View style={{ marginBottom: 12, padding: 12, borderRadius: 12, backgroundColor: HomeColors.surfaceGrey, flexDirection: "row", alignItems: "center" }}>
        <MaterialIcon name="lock_outline" size={18} color={HomeColors.textSecondary} />
        <View style={{ width: 8 }} />
        <Text style={{ flex: 1, fontSize: 12.5, color: HomeColors.textSecondary }}>
          {hiddenCount === 1
            ? "Hay 1 tarea interna que solo ve el equipo del proyecto."
            : `Hay ${hiddenCount} tareas internas que solo ve el equipo del proyecto.`}
        </Text>
      </View>
    ) : null;

  if (tasks.length === 0) {
    return hiddenNote ? (
      <View style={{ paddingLeft: 20, paddingTop: 18, paddingRight: 20 }}>{hiddenNote}</View>
    ) : (
      <EmptyTab message="Este proyecto no especificó tareas todavía." />
    );
  }
  return (
    <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingTop: 18, paddingRight: 20, paddingBottom: 12 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: HomeColors.textPrimary }}>Tareas del proyecto</Text>
      <View style={{ height: 10 }} />
      {hiddenNote}
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          now={now}
          canApply={canApply && task.canApplyAt(now)}
          isOwner={isOwner}
          onApply={() => {
            if (!requireSession()) return;
            void Nav.to("JoinTeam", { project, task });
          }}
          onProgress={(p) => void changeProgress(task, p)}
          onVisibility={(v) => void changeVisibility(task, v)}
        />
      ))}
    </ScrollView>
  );
}

function RoleCallCard({
  role,
  missing,
  deadline,
  callOpen,
  canJoin,
  onJoin,
}: {
  role: string;
  missing: number;
  deadline: Date | null;
  callOpen: boolean;
  canJoin: boolean;
  onJoin: () => void;
}) {
  const deadlineText = !callOpen
    ? "Convocatoria cerrada"
    : deadline != null
      ? `Convocatoria abierta hasta: ${formatShortDate(deadline)}`
      : "Convocatoria abierta";
  return (
    <View style={{ marginBottom: 12, paddingLeft: 14, paddingTop: 12, paddingRight: 14, paddingBottom: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 38, height: 38, backgroundColor: HomeColors.navSelectedBackground, borderRadius: 10, alignItems: "center", justifyContent: "center" }}>
          <MaterialIcon name="person_outline" color={HomeColors.primaryPurple} size={20} />
        </View>
        <View style={{ width: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 14, color: HomeColors.textPrimary }}>{role}</Text>
          <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{missing === 1 ? "1 miembro" : `${missing} miembros`}</Text>
        </View>
      </View>
      <View style={{ height: 10 }} />
      <DeadlineLine text={deadlineText} />
      {canJoin ? (
        <View style={{ marginTop: 10 }}>
          <CardActionButton label="Unirme al equipo" onPressed={onJoin} />
        </View>
      ) : null}
    </View>
  );
}

function MembersTab({ project, controller }: { project: Project; controller: ProjectDetailController }) {
  const { state } = useTabFuture<ProjectMember[]>(() => controller.membersFor(project.id));
  if (!state.done) return <Loading />;
  if (state.error) return <EmptyTab message={errorMessage(state.error)} />;
  const members = state.data ?? [];
  const canJoin = project.canApply && project.isPublic && !controller.isOwner(project) && project.isTeamCallOpenAt();
  const openRoles = Object.entries(project.teamRoles)
    .filter(([role, needed]) => needed - (project.acceptedRoleCounts[role] ?? 0) > 0)
    .map(([role, needed]) => [role, needed - (project.acceptedRoleCounts[role] ?? 0)] as const);

  return (
    <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingTop: 18, paddingRight: 20, paddingBottom: 12 }}>
      {openRoles.length > 0 ? (
        <>
          <Text style={{ fontSize: 14, fontWeight: "700", color: HomeColors.textPrimary }}>Buscamos</Text>
          <View style={{ height: 10 }} />
          {openRoles.map(([role, missing]) => (
            <RoleCallCard
              key={role}
              role={role}
              missing={missing}
              deadline={project.teamDeadline}
              callOpen={project.isTeamCallOpenAt()}
              canJoin={canJoin}
              onJoin={() => {
                if (!requireSession()) return;
                void Nav.to("JoinTeam", { project, initialRoleName: role });
              }}
            />
          ))}
          <View style={{ height: 8 }} />
        </>
      ) : null}
      <Text style={{ fontSize: 14, fontWeight: "700", color: HomeColors.textPrimary }}>Equipo</Text>
      <View style={{ height: 10 }} />
      {members.length === 0 ? (
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <Text style={{ textAlign: "center", color: HomeColors.textSecondary }}>
            {controller.isGuest ? "Inicia sesión para ver quiénes forman el equipo." : "Todavía no hay miembros."}
          </Text>
        </View>
      ) : null}
      {members.map((member) => (
        <View
          key={member.id}
          style={{ marginBottom: 10, padding: 14, borderWidth: 1, borderColor: HomeColors.borderGrey, borderRadius: 14, flexDirection: "row", alignItems: "center" }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
            <MaterialIcon name="person" color={HomeColors.primaryPurple} size={18} />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600", fontSize: 14, color: HomeColors.textPrimary }}>{member.name}</Text>
            <Text style={{ fontSize: 12.5, color: HomeColors.textSecondary }}>{member.role}</Text>
          </View>
        </View>
      ))}
      {canJoin ? (
        <DashedBorder color={HomeColors.primaryPurple} radius={14}>
          <InkWell
            onPress={() => {
              if (!requireSession()) return;
              void Nav.to("JoinTeam", { project });
            }}
            borderRadius={14}
            style={{
              backgroundColor: HomeColors.navSelectedBackground,
              borderRadius: 14,
              paddingVertical: 14,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcon name="add" color={HomeColors.primaryPurple} size={20} />
            <View style={{ width: 8 }} />
            <Text style={{ fontWeight: "600", fontSize: 14, color: HomeColors.primaryPurple }}>Unirse al equipo</Text>
          </InkWell>
        </DashedBorder>
      ) : null}
    </ScrollView>
  );
}

export function ProjectDetailPage({ args }: { args: ScreenParams["ProjectDetail"] }) {
  const controller = useFind<ProjectDetailController>(TOKENS.ProjectDetailController);
  const [project, setProject] = useState<Project>(args.project);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [tab, setTab] = useState(0);
  const followBusy = useRef(false);

  const refreshCommentCount = useCallback(() => {
    void controller.commentCount(project.id).then(setCommentCount);
  }, [controller, project.id]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [fresh, following] = await Promise.all([controller.projectById(project.id), controller.isFollowing(project.id)]);
        if (!active) return;
        if (fresh != null) setProject(fresh);
        setIsFollowing(following);
      } catch {
        // igual que en Flutter: se ignora
      }
    })();
    refreshCommentCount();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFollow = async () => {
    if (!requireSession()) return;
    if (followBusy.current) return;
    followBusy.current = true;
    try {
      const following = await controller.toggleFollow(project.id);
      setIsFollowing(following);
      snackbar(
        following ? "Ahora sigues este proyecto" : "Dejaste de seguir",
        following ? `Recibirás novedades de "${project.name}".` : 'Ya no verás este proyecto en "Seguidos".',
        {
          position: "TOP",
          backgroundColor: Colors.white,
          borderColor: HomeColors.borderGrey,
          borderWidth: 1,
          icon: <MaterialIcon name={following ? "check_circle" : "notifications_off_outlined"} color={HomeColors.primaryPurple} />,
        },
      );
    } catch (error) {
      snackbar("Seguir proyecto", errorMessage(error), { position: "BOTTOM" });
    } finally {
      followBusy.current = false;
    }
  };

  const isDescription = tab === 0;
  const isOwner = controller.isOwner(project);
  const canParticipate = project.canApply && project.isPublic && !isOwner;

  const openComments = async () => {
    if (!requireSession()) return;
    await showProjectComments(project.id, project.name);
    refreshCommentCount();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1 }}>
        <TopBar
          isFollowing={isFollowing}
          showMore={canParticipate}
          commentCount={commentCount}
          onComments={() => void openComments()}
          onBack={() => Nav.back()}
          onFollow={() => void toggleFollow()}
          onMore={() => {
            if (!requireSession()) return;
            void Nav.to("ChooseParticipation", { project });
          }}
        />
        <FadeSwitch switchKey={isDescription ? "large" : "compact"}>
          {isDescription ? <LargeProjectHeader project={project} /> : <CompactProjectHeader project={project} />}
        </FadeSwitch>
        <View style={{ height: 10 }} />
        <TabBar
          labels={["Resumen", "Tareas", "Equipo"]}
          index={tab}
          onChange={setTab}
          labelColor={HomeColors.primaryPurple}
          unselectedLabelColor={HomeColors.textSecondary}
          indicatorColor={HomeColors.primaryPurple}
          labelPaddingHorizontal={2}
          labelStyle={{ fontWeight: "600", fontSize: 13 }}
          unselectedLabelStyle={{ fontWeight: "500", fontSize: 13 }}
        />
        <TabBarView
          index={tab}
          onChange={setTab}
          pages={[
            () => <OverviewTab project={project} controller={controller} onSeeTeam={() => setTab(2)} />,
            () => <TasksTab project={project} controller={controller} />,
            () => <MembersTab project={project} controller={controller} />,
          ]}
        />
        {isOwner && project.audience === "Solo yo" ? (
          <View style={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 16 }}>
            <View style={[{ borderRadius: 14 }, boxShadow({ color: withAlpha(Palette.shadow, 0.22), blur: 6, dy: 2 })]}>
              <FilledButton
                label="Editar proyecto"
                onPress={() => void Nav.to("CreateProject", { editProjectId: project.id })}
                backgroundColor={HomeColors.primaryPurple}
                foregroundColor={Colors.white}
                borderRadius={14}
                style={{ paddingVertical: 16 }}
                textStyle={{ fontSize: 16, fontWeight: "bold" }}
              />
            </View>
          </View>
        ) : canParticipate ? (
          <View style={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 16 }}>
            <View style={[{ borderRadius: 14 }, boxShadow({ color: withAlpha(Palette.shadow, 0.22), blur: 6, dy: 2 })]}>
              <FilledButton
                testID="participate_button"
                label="Quiero participar"
                icon={<MaterialIcon name="group_add_outlined" size={19} color={Colors.white} />}
                onPress={() => {
                  if (!requireSession()) return;
                  void Nav.to("ChooseParticipation", { project });
                }}
                backgroundColor={HomeColors.primaryPurple}
                foregroundColor={Colors.white}
                borderRadius={14}
                style={{ paddingVertical: 16 }}
                textStyle={{ fontSize: 16, fontWeight: "bold", color: Colors.white }}
              />
            </View>
          </View>
        ) : (
          <View style={{ height: 12 }} />
        )}
      </SafeAreaView>
    </View>
  );
}
