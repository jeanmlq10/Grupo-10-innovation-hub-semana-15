// Equivalente de profile/ui/views/privacy_page.dart: "Privacidad".
import * as Clipboard from "expo-clipboard";
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { getContainer, useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { RouteNames } from "@/src/core/navigation/routes";
import { M3 } from "@/src/core/theme/appTheme";
import { Colors } from "@/src/core/theme/homeColors";
import { AlertDialog, AppBar, SimpleDialog, TextButton } from "@/src/core/ui/material";
import { Overlay, snackbar } from "@/src/core/ui/overlay";

import { ActivityVisibility, ContactPermission, ProfileVisibility } from "../../domain/models/userProfile";
import { ProfileController } from "../viewmodels/profileController";
import { ProfileMenuTile } from "../widgets/ProfileMenuTile";
import { Palette } from "@/src/core/theme/brand";

function choose<T extends string>(title: string, options: [T, string][]): Promise<T | undefined> {
  return Overlay.dialog<T>(() => (
    <SimpleDialog title={title} options={options.map(([value, label]) => ({ label, onPress: () => Nav.back(value) }))} />
  ));
}

const VISIBILITY: [ProfileVisibility, string][] = [
  [ProfileVisibility.public, "Público"],
  [ProfileVisibility.private, "Privado"],
];
const CONTACT: [ContactPermission, string][] = [
  [ContactPermission.everyone, "Todos los usuarios"],
  [ContactPermission.nobody, "Nadie"],
];
const ACTIVITY: [ActivityVisibility, string][] = [
  [ActivityVisibility.onlyMe, "Solo yo"],
  [ActivityVisibility.everyone, "Todos los usuarios"],
];
const label = <T,>(options: [T, string][], value: T) => options.find(([v]) => v === value)?.[1];

export function PrivacyPage() {
  const controller = useFind<ProfileController>(TOKENS.ProfileController);
  const p = controller.profile.value;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Privacidad" titleStyle={{ fontWeight: "bold" }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}>
        <ProfileMenuTile
          icon="person_outline"
          title="Visibilidad del perfil"
          subtitle={label(VISIBILITY, p?.visibility ?? ProfileVisibility.public)}
          onTap={async () => {
            const value = await choose("Visibilidad del perfil", VISIBILITY);
            if (value != null) void controller.savePrivacy({ visibility: value });
          }}
        />
        <ProfileMenuTile
          icon="verified_user_outlined"
          title="Quién puede contactarte"
          subtitle={label(CONTACT, p?.contact ?? ContactPermission.everyone)}
          onTap={async () => {
            const value = await choose("Quién puede contactarte", CONTACT);
            if (value != null) void controller.savePrivacy({ contact: value });
          }}
        />
        <ProfileMenuTile
          icon="schedule"
          title="Datos de actividad"
          subtitle={label(ACTIVITY, p?.activityVisibility ?? ActivityVisibility.everyone)}
          onTap={async () => {
            const value = await choose("Datos de actividad", ACTIVITY);
            if (value != null) void controller.savePrivacy({ activityVisibility: value });
          }}
        />
        <ProfileMenuTile
          icon="download_outlined"
          title="Descargar mis datos"
          subtitle="Solicitar un archivo"
          onTap={() => {
            const data = controller.exportMyData();
            void Overlay.dialog(() => (
              <AlertDialog
                title="Mis datos"
                content={
                  <Text selectable style={{ fontSize: 12, color: M3.onSurfaceVariant }}>
                    {data}
                  </Text>
                }
                actions={
                  <>
                    <TextButton
                      label="Copiar"
                      onPress={() => {
                        void Clipboard.setStringAsync(data);
                        Nav.back();
                        snackbar("Mis datos", "Copiados al portapapeles.");
                      }}
                    />
                    <TextButton label="Cerrar" onPress={() => Nav.back()} />
                  </>
                }
              />
            ));
          }}
        />
        <ProfileMenuTile
          icon="delete_outline"
          title="Eliminar cuenta"
          subtitle="Eliminar permanentemente"
          destructive
          onTap={async () => {
            const confirm = await Overlay.dialog<boolean>(() => (
              <AlertDialog
                title="¿Eliminar cuenta?"
                content="Se borrarán los datos de tu perfil y se cerrará tu sesión. Tus proyectos y comentarios se conservan. La cuenta de acceso la elimina el administrador de Roble."
                actions={
                  <>
                    <TextButton label="Cancelar" onPress={() => Nav.back(false)} />
                    <TextButton label="Eliminar" foregroundColor={Palette.error} onPress={() => Nav.back(true)} />
                  </>
                }
              />
            ));
            if (confirm === true && (await getContainer().resolve<ProfileController>(TOKENS.ProfileController).deleteProfileData())) {
              Nav.offAllNamed(RouteNames.central);
            }
          }}
        />
      </ScrollView>
    </View>
  );
}
