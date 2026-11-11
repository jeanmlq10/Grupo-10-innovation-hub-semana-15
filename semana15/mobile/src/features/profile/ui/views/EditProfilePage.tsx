// Equivalente de profile/ui/views/edit_profile_page.dart: "Editar perfil".
import React, { useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { AppBar, FilledButton, IconButton, OutlinedButton, TextButton } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";
import { ThemedTextField } from "@/src/core/ui/themedTextField";

import { ProfileController } from "../viewmodels/profileController";
import { showAvatarIconPicker } from "../widgets/AvatarIconPicker";
import { ProfileAvatar } from "../widgets/ProfileAvatar";
import { Palette } from "@/src/core/theme/brand";

function Field({
  label,
  initial,
  onChange,
  hint,
  maxLines = 1,
  testID,
}: {
  label: string;
  initial: string;
  onChange: (v: string) => void;
  hint?: string;
  maxLines?: number;
  testID?: string;
}) {
  return (
    <View style={{ paddingBottom: 14 }}>
      <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>{label}</Text>
      <View style={{ height: 6 }} />
      <ThemedTextField
        testID={testID}
        defaultValue={initial}
        onChangeText={onChange}
        hint={hint}
        radius={10}
        dense
        multiline={maxLines > 1}
        numberOfLines={maxLines}
        style={maxLines > 1 ? { minHeight: 24 + 22 * maxLines } : undefined}
      />
    </View>
  );
}

export function EditProfilePage() {
  const controller = useFind<ProfileController>(TOKENS.ProfileController);
  const initial = controller.profile.value;
  const name = useRef(initial?.name ?? "");
  const username = useRef(initial?.username ?? "");
  const bio = useRef(initial?.bio ?? "");
  const career = useRef(initial?.career ?? "");
  const [avatarIcon, setAvatarIcon] = useState(initial?.avatarIcon ?? "");

  const pickIcon = async () => {
    const picked = await showAvatarIconPicker(avatarIcon);
    if (picked != null) setAvatarIcon(picked);
  };

  const save = async () => {
    const ok = await controller.saveBasics({
      name: name.current,
      username: username.current,
      bio: bio.current,
      career: career.current,
      avatarIcon,
    });
    if (!ok) return;
    Nav.back();
    snackbar("Perfil", "Tus cambios se guardaron.", { position: "BOTTOM" });
  };

  const changePassword = async () => {
    const ok = await controller.requestPasswordChange();
    snackbar(
      "Contraseña",
      ok ? "Te enviamos un correo para cambiar tu contraseña." : "No se pudo enviar el correo. Intenta más tarde.",
      { position: "BOTTOM" },
    );
  };

  const email = controller.profile.value?.email ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <AppBar
        centerTitle
        title="Editar perfil"
        titleStyle={{ fontWeight: "bold" }}
        actions={<IconButton icon="check" tooltip="Guardar" color={HomeColors.primaryPurple} onPress={() => void save()} />}
      />
      <ScrollView contentContainerStyle={{ paddingLeft: 20, paddingTop: 8, paddingRight: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <View style={{ alignItems: "center" }}>
          <Pressable onPress={() => void pickIcon()} accessibilityLabel="Cambiar icono">
            <ProfileAvatar name={name.current} iconKey={avatarIcon} size={88} />
            <View style={{ position: "absolute", right: 0, bottom: 0, padding: 6, borderRadius: 999, backgroundColor: HomeColors.primaryPurple }}>
              <MaterialIcon name="photo_camera_outlined" size={16} color={Colors.white} />
            </View>
          </Pressable>
        </View>
        <View style={{ alignItems: "center" }}>
          <TextButton label="Cambiar icono" onPress={() => void pickIcon()} />
        </View>
        <View style={{ height: 20 }} />
        <Field testID="edit_name" label="Nombre" initial={name.current} onChange={(v) => (name.current = v)} />
        <View style={{ paddingBottom: 14 }}>
          <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>Correo electrónico</Text>
          <View style={{ height: 6 }} />
          <ThemedTextField defaultValue={email} enabled={false} radius={10} dense />
        </View>
        <Field label="Nombre de usuario" initial={username.current} onChange={(v) => (username.current = v)} />
        <Field label="Carrera o programa" initial={career.current} onChange={(v) => (career.current = v)} />
        <Field label="Biografía" initial={bio.current} onChange={(v) => (bio.current = v)} hint="Cuéntanos sobre ti..." maxLines={3} />
        <Text style={{ fontSize: 13, color: HomeColors.textSecondary }}>Contraseña</Text>
        <View style={{ height: 6 }} />
        <View style={{ alignItems: "flex-start" }}>
          <OutlinedButton
            label="Cambiar contraseña"
            icon={<MaterialIcon name="lock_reset" size={18} color={Palette.secondary} />}
            onPress={() => void changePassword()}
            paddingHorizontal={16}
          />
        </View>
        <View style={{ height: 24 }} />
        <FilledButton
          testID="edit_save"
          label="Guardar cambios"
          onPress={controller.isSaving.value ? null : () => void save()}
          backgroundColor={HomeColors.primaryPurple}
          borderRadius={12}
          height={52}
          style={{ height: 52 }}
          textStyle={{ fontWeight: "700" }}
        />
      </ScrollView>
    </View>
  );
}
