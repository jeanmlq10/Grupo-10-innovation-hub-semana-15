// Imagen de perfil de un proyecto (Corrección 3).
//
// Es el ÚNICO componente que dibuja la imagen de un proyecto en la app
// (tarjeta de Explorar, Mis proyectos, vista general). Orden:
// 1. `imageFileId`: archivo en el bucket privado (R2); pide una URL firmada
//    temporal al mostrarla (solo con sesión iniciada).
// 2. `imageUrl`: URL directa (compatibilidad).
// 3. Icono de la categoría sobre el tinte limón de la marca.
import React, { useState } from "react";
import { Image, View } from "react-native";

import { Palette } from "@/src/core/theme/brand";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { useSignedFileUrl } from "@/src/features/attachments/ui/hooks/useSignedFileUrl";

export const CATEGORY_ICONS: Record<string, IconName> = {
  "Medio ambiente": "eco_outlined",
  "Impacto social": "groups_outlined",
  Innovación: "lightbulb_outline",
  Tecnología: "memory_outlined",
  Educación: "school_outlined",
  Comunidad: "diversity_3_outlined",
  "Arte y cultura": "palette_outlined",
  Emprendimiento: "rocket_launch_rounded",
  Salud: "emoji_emotions_rounded",
  Agricultura: "eco_outlined",
};

export function categoryIcon(categories: string[]): IconName {
  for (const category of categories) {
    const icon = CATEGORY_ICONS[category];
    if (icon) return icon;
  }
  return "eco_outlined";
}

export function ProjectAvatar({
  imageUrl,
  imageFileId,
  categories = [],
  size = 44,
  radius,
  testID,
}: {
  imageUrl?: string | null;
  imageFileId?: string | null;
  categories?: string[];
  size?: number;
  radius?: number;
  testID?: string;
}) {
  const [failed, setFailed] = useState(false);
  const signed = useSignedFileUrl(imageFileId);
  const r = radius ?? Math.round(size * 0.27);
  const url = (signed ?? imageUrl ?? "").trim();
  if (url !== "" && !failed) {
    return (
      <Image
        testID={testID}
        source={{ uri: url }}
        onError={() => setFailed(true)}
        accessibilityLabel="Imagen del proyecto"
        resizeMode="cover"
        style={{ width: size, height: size, borderRadius: r, backgroundColor: Palette.limeTint }}
      />
    );
  }
  return (
    <View
      testID={testID}
      accessibilityLabel="Imagen del proyecto (sin imagen)"
      style={{ width: size, height: size, backgroundColor: Palette.limeTint, borderRadius: r, alignItems: "center", justifyContent: "center" }}
    >
      <MaterialIcon name={categoryIcon(categories)} color={Palette.primary} size={Math.round(size * 0.52)} />
    </View>
  );
}
