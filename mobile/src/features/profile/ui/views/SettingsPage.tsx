// Equivalente de profile/ui/views/settings_page.dart: "Configuración".
import React from "react";
import { ScrollView, Text, View } from "react-native";

import { Nav } from "@/src/core/navigation/Nav";
import { Colors } from "@/src/core/theme/homeColors";
import { M3 } from "@/src/core/theme/appTheme";
import { AlertDialog, AppBar, TextButton } from "@/src/core/ui/material";
import { Overlay, snackbar } from "@/src/core/ui/overlay";

import { ProfileMenuTile } from "../widgets/ProfileMenuTile";

const soon = (title: string) => snackbar(title, "Esta opción estará disponible en una próxima versión.", { position: "BOTTOM" });

/** Equivalente de `showAboutDialog(...)` (textos de Material en español). */
function showAboutDialog() {
  void Overlay.dialog(() => (
    <AlertDialog
      title={
        <View>
          <Text style={{ fontSize: 24, color: M3.onSurface }}>Movil</Text>
          <Text style={{ fontSize: 14, color: M3.onSurfaceVariant, marginTop: 4 }}>1.0.0</Text>
        </View>
      }
      content={<Text style={{ fontSize: 12, color: M3.onSurfaceVariant, marginTop: 8 }}>Programación Móvil · Uninorte · Grupo 10</Text>}
      actions={
        <>
          <TextButton
            label="Ver licencias"
            onPress={() => {
              Nav.back();
              void Overlay.dialog(() => (
                <AlertDialog
                  title="Licencias"
                  content="Movil 1.0.0 · Expo, React Native, React Navigation, React Native Paper, react-native-svg y Material Icons (Apache 2.0)."
                  actions={<TextButton label="Cerrar" onPress={() => Nav.back()} />}
                />
              ));
            }}
          />
          <TextButton label="Cerrar" onPress={() => Nav.back()} />
        </>
      }
    />
  ));
}

export function SettingsPage() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar centerTitle title="Configuración" titleStyle={{ fontWeight: "bold" }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8 }}>
        <ProfileMenuTile icon="person_outline" title="Cuenta" subtitle="Información personal" onTap={() => void Nav.to("EditProfile")} />
        <ProfileMenuTile icon="settings_suggest_outlined" title="Apariencia" subtitle="Tema, idioma, accesibilidad" onTap={() => soon("Apariencia")} />
        <ProfileMenuTile icon="notifications_none" title="Notificaciones" subtitle="Preferencias de notificaciones" onTap={() => void Nav.to("NotificationSettings")} />
        <ProfileMenuTile icon="lock_outline" title="Privacidad" subtitle="Quién ve tu perfil y tu actividad" onTap={() => void Nav.to("Privacy")} />
        <ProfileMenuTile icon="storage_outlined" title="Datos y almacenamiento" subtitle="Uso de datos, caché" onTap={() => soon("Datos y almacenamiento")} />
        <ProfileMenuTile
          icon="help_outline"
          title="Ayuda"
          subtitle="Centro de ayuda"
          onTap={() =>
            void Overlay.dialog(() => (
              <AlertDialog
                title="Ayuda"
                content='Publica tu idea desde "Crea otra idea", explora proyectos y postúlate a una tarea o al equipo. El creador decide y te avisamos en Notificaciones.'
                actions={<TextButton label="Entendido" onPress={() => Nav.back()} />}
              />
            ))
          }
        />
        <ProfileMenuTile icon="info_outline" title="Acerca de" subtitle="Versión de la app" onTap={showAboutDialog} />
      </ScrollView>
    </View>
  );
}
