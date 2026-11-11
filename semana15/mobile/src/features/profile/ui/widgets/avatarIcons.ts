// Equivalente de profile/ui/widgets/avatar_icons.dart: catálogo de iconos para
// la foto de perfil (en `user_profiles.avatarIcon` se guarda solo la clave).
import { IconName } from "@/src/core/ui/MaterialIcon";

export const AvatarIcons = {
  all: [
    ["person", "person_rounded"],
    ["face", "face_rounded"],
    ["smile", "emoji_emotions_rounded"],
    ["school", "school_rounded"],
    ["code", "code_rounded"],
    ["palette", "palette_rounded"],
    ["science", "science_rounded"],
    ["campaign", "campaign_rounded"],
    ["lightbulb", "lightbulb_rounded"],
    ["rocket", "rocket_launch_rounded"],
    ["eco", "eco_rounded"],
    ["music", "music_note_rounded"],
    ["sports", "sports_soccer_rounded"],
    ["camera", "photo_camera_rounded"],
    ["pets", "pets_rounded"],
    ["star", "star_rounded"],
  ] as [string, IconName][],

  of(key: string | null | undefined): IconName | null {
    if (key == null || key === "") return null;
    return AvatarIcons.all.find(([k]) => k === key)?.[1] ?? null;
  },
};
