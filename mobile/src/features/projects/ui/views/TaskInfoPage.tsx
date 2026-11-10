// Equivalente de projects/ui/views/task_info_page.dart: "Información de tareas".
import React, { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, Text, TextInput, View } from "react-native";
import type { TextInputInstance } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AlertDialog, FilledButton, IconButton, InkWell, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { Overlay } from "@/src/core/ui/overlay";
import { ThemedTextField } from "@/src/core/ui/themedTextField";
import { DashedBorder } from "@/src/core/widgets/DashedBorder";
import { ProjectTask, TaskVisibility } from "@/src/features/tasks/domain/models/projectTask";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { DeadlinePickerField } from "../widgets/DeadlinePickerField";
import { WizardHeader, WizardTitle } from "../widgets/wizardBits";
import { WizardNavButtons } from "../widgets/WizardNavButtons";
import { Palette } from "@/src/core/theme/brand";

function NewTaskDialog() {
  const [text, setText] = useState("");
  return (
    <AlertDialog
      title="Nueva tarea"
      content={
        <ThemedTextField
          testID="new_task_title"
          autoFocus
          value={text}
          onChangeText={setText}
          returnKeyType="done"
          onSubmitEditing={() => Nav.back(text)}
          hint="Ej: Diseñar la interfaz"
        />
      }
      actions={
        <>
          <TextButton label="Cancelar" onPress={() => Nav.back()} />
          <FilledButton label="Agregar" onPress={() => Nav.back(text)} backgroundColor={HomeColors.primaryPurple} />
        </>
      }
    />
  );
}

/** Selector "Público / Solo equipo" de una tarea temporal (Corrección 4.2). */
function VisibilitySelector({ value, onChanged, testID }: { value: TaskVisibility; onChanged: (v: TaskVisibility) => void; testID?: string }) {
  const option = (v: TaskVisibility, label: string, icon: "public" | "lock_outline") => {
    const selected = value === v;
    return (
      <InkWell
        testID={`${testID}_${v}`}
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        onPress={() => onChanged(v)}
        borderRadius={10}
        style={{
          flex: 1,
          height: 38,
          borderRadius: 10,
          backgroundColor: selected ? HomeColors.primaryPurple : HomeColors.surfaceGrey,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcon name={icon} size={16} color={selected ? Colors.white : HomeColors.textSecondary} />
        <View style={{ width: 6 }} />
        <Text style={{ fontSize: 13, fontWeight: "600", color: selected ? Colors.white : HomeColors.textSecondary }}>{label}</Text>
      </InkWell>
    );
  };
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {option(TaskVisibility.public, "Público", "public")}
        {option(TaskVisibility.team, "Solo equipo", "lock_outline")}
      </View>
      <Text style={{ marginTop: 6, fontSize: 12, color: HomeColors.textSecondary }}>
        {value === TaskVisibility.team
          ? "Solo tú y los integrantes del equipo podrán verla."
          : "Cualquier persona que consulte el proyecto podrá verla."}
      </Text>
    </View>
  );
}

/** Tarjeta de una tarea: título, estado, visibilidad, descripción y "Disponible hasta". */
function TaskInfoCard({
  task,
  onDescriptionChanged,
  onDeadlinePicked,
  onVisibilityChanged,
  onRemove,
  onIncrement,
  onDecrement,
}: {
  task: ProjectTask;
  onVisibilityChanged: (v: TaskVisibility) => void;
  onDescriptionChanged: (v: string) => void;
  onDeadlinePicked: (d: Date) => void;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  const [description, setDescription] = useState(task.description);
  const focused = useRef(false);
  const inputRef = useRef<TextInputInstance>(null);

  useEffect(() => {
    // didUpdateWidget: si no tiene foco, se sincroniza con el modelo.
    if (!focused.current && description !== task.description) setDescription(task.description);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.description]);

  return (
    <View
      style={{
        marginBottom: 14,
        paddingLeft: 14,
        paddingTop: 12,
        paddingRight: 8,
        paddingBottom: 14,
        borderWidth: 1,
        borderColor: HomeColors.borderGrey,
        borderRadius: 14,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <MaterialIcon name="drag_indicator" color={HomeColors.textSecondary} size={20} />
        <View style={{ width: 6 }} />
        <Text style={{ flex: 1, fontWeight: "bold", fontSize: 14.5, color: HomeColors.textPrimary }}>{task.title}</Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 3, backgroundColor: Palette.successBackground, borderRadius: 20 }}>
          <Text style={{ fontSize: 11.5, fontWeight: "600", color: Palette.successForeground }}>Disponible</Text>
        </View>
      </View>
      <View style={{ height: 10 }} />
      <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>¿Quién puede ver esta tarea?</Text>
      <View style={{ height: 6 }} />
      <View style={{ paddingRight: 6 }}>
        <VisibilitySelector testID={`task_visibility_${task.title}`} value={task.visibility} onChanged={onVisibilityChanged} />
      </View>
      <View style={{ height: 10 }} />
      <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>Descripción</Text>
      <View style={{ height: 6 }} />
      <View style={{ paddingRight: 6 }}>
        <View style={{ backgroundColor: HomeColors.surfaceGrey, borderRadius: 12 }}>
          <TextInput
            ref={inputRef}
            value={description}
            onChangeText={(v) => {
              setDescription(v);
              onDescriptionChanged(v);
            }}
            onFocus={() => (focused.current = true)}
            onBlur={() => (focused.current = false)}
            multiline
            numberOfLines={2}
            placeholder="Describe qué hay que hacer"
            placeholderTextColor={HomeColors.textSecondary}
            style={{
              color: HomeColors.textPrimary,
              fontSize: 14,
              paddingHorizontal: 14,
              paddingVertical: 12,
              maxHeight: 12 * 2 + 20 * 2,
              textAlignVertical: "top",
              ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : {}),
            }}
          />
        </View>
      </View>
      <View style={{ height: 12 }} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontSize: 13, color: HomeColors.textSecondary }}>Personas necesarias</Text>
        <IconButton icon="remove" size={18} tooltip="Menos personas" onPress={onDecrement} />
        <Text style={{ fontWeight: "bold", color: HomeColors.textPrimary, fontSize: 14 }}>{`${task.numberNeeded}`}</Text>
        <IconButton icon="add" size={18} tooltip="Más personas" onPress={onIncrement} />
      </View>
      <View style={{ height: 4 }} />
      <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>Disponible hasta</Text>
      <View style={{ height: 6 }} />
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <DeadlinePickerField value={task.deadline} onPicked={onDeadlinePicked} />
        </View>
        <IconButton icon="delete_outline" tooltip="Quitar tarea" color={Palette.error} onPress={onRemove} />
      </View>
    </View>
  );
}

export function TaskInfoPage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  const tasks = controller.tasks.value;

  const addTask = async () => {
    const title = await Overlay.dialog<string>(() => <NewTaskDialog />);
    if (title != null) controller.addTask(title);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <WizardHeader step={2} />
        <View style={{ height: 20 }} />
        <WizardTitle title="Información de tareas" subtitle="Configura las tareas de tu proyecto" />
        <View style={{ height: 20 }} />
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          {tasks.length === 0 ? (
            <Text style={{ paddingBottom: 14, fontSize: 13.5, color: HomeColors.textSecondary }}>
              Tareas puntuales en las que alguien puede ayudar sin unirse al equipo. Agrégalas aquí o sigue sin tareas.
            </Text>
          ) : null}
          {tasks.map((task, i) => (
            <TaskInfoCard
              key={`task-info-${i}`}
              task={task}
              onDescriptionChanged={(v) => controller.updateTaskDescription(i, v)}
              onDeadlinePicked={(d) => controller.setTaskDeadline(i, d)}
              onVisibilityChanged={(v) => controller.setTaskVisibility(i, v)}
              onRemove={() => controller.removeTask(i)}
              onIncrement={() => controller.incrementTask(i)}
              onDecrement={() => controller.decrementTask(i)}
            />
          ))}
          <DashedBorder color={HomeColors.primaryPurple} radius={12}>
            <InkWell
              testID="add_task"
              onPress={() => void addTask()}
              borderRadius={12}
              style={{
                backgroundColor: HomeColors.navSelectedBackground,
                borderRadius: 12,
                paddingVertical: 13,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialIcon name="add_circle_outline" color={HomeColors.primaryPurple} size={20} />
              <View style={{ width: 8 }} />
              <Text style={{ fontWeight: "600", color: HomeColors.primaryPurple, fontSize: 14 }}>Agregar otra tarea</Text>
            </InkWell>
          </DashedBorder>
          <View style={{ height: 8 }} />
          <Text style={{ textAlign: "center", fontSize: 12.5, color: HomeColors.textSecondary }}>
            Configura hasta cuándo pueden postularse.
          </Text>
          <View style={{ height: 12 }} />
        </ScrollView>
        <View style={{ height: 8 }} />
        <WizardNavButtons onBack={() => Nav.back()} onNext={() => void Nav.to("EstimatedTime")} />
      </SafeAreaView>
    </View>
  );
}
