// Equivalente de profile/ui/widgets/profile_labels.dart.
import { IconName } from "@/src/core/ui/MaterialIcon";

import { ActivityKind } from "../../domain/models/activityEntry";
import { CommitmentLevel } from "../../domain/models/trajectorySummary";

export const ProfileLabels = {
  commitment(level: CommitmentLevel): string {
    switch (level) {
      case CommitmentLevel.high:
        return "Alto";
      case CommitmentLevel.medium:
        return "Medio";
      case CommitmentLevel.low:
        return "Bajo";
      case CommitmentLevel.newcomer:
        return "Nuevo";
    }
  },

  activityTitle(kind: ActivityKind, { self }: { self: boolean }): string {
    switch (kind) {
      case ActivityKind.publication:
        return self ? "Publicaste un nuevo proyecto" : "Publicó un nuevo proyecto";
      case ActivityKind.participation:
        return self ? "Te uniste a un proyecto" : "Se unió a un proyecto";
      case ActivityKind.taskAssignment:
        return self ? "Fuiste asignado a una tarea" : "Fue asignado a una tarea";
      case ActivityKind.comment:
        return self ? "Comentaste en un proyecto" : "Comentó en un proyecto";
      case ActivityKind.follow:
        return self ? "Seguiste un proyecto" : "Siguió un proyecto";
    }
  },

  activityIcon(kind: ActivityKind): IconName {
    switch (kind) {
      case ActivityKind.publication:
        return "add_circle_outline";
      case ActivityKind.participation:
        return "group_outlined";
      case ActivityKind.taskAssignment:
        return "assignment_ind_outlined";
      case ActivityKind.comment:
        return "chat_bubble_outline";
      case ActivityKind.follow:
        return "notifications_none";
    }
  },
};
