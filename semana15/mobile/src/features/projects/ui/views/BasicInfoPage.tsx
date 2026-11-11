// Equivalente de projects/ui/views/basic_info_page.dart: "Información básica" (1/4).
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFind } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { Nav } from "@/src/core/navigation/Nav";
import { Colors, HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, InkWell } from "@/src/core/ui/material";
import { MaterialIcon } from "@/src/core/ui/MaterialIcon";
import { snackbar } from "@/src/core/ui/overlay";

import { CreateProjectController } from "../viewmodels/createProjectController";
import { ProjectAvatar } from "../widgets/ProjectAvatar";
import { ProjectContextDocuments } from "../widgets/ProjectContextDocuments";
import { GreyTextField, PurpleWideButton, WizardHeader, WizardTitle } from "../widgets/wizardBits";

export function BasicInfoPage() {
  const controller = useFind<CreateProjectController>(TOKENS.CreateProjectController);
  const [name, setName] = useState(controller.name.value);
  const [description, setDescription] = useState(controller.description.value);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const pickImage = async () => {
    if (controller.imageUploading.value) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      snackbar("Imagen del proyecto", "Permite el acceso a tus fotos para elegir una imagen.", { position: "BOTTOM" });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const name = asset.fileName ?? `portada-${Date.now()}.jpg`;
    setPreviewUri(asset.uri);
    const ok = await controller.setProjectImage({
      name,
      uri: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      size: asset.fileSize ?? null,
    });
    if (!ok) setPreviewUri(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      <SafeAreaView style={{ flex: 1, paddingLeft: 20, paddingTop: 12, paddingRight: 20, paddingBottom: 20 }}>
        <WizardHeader step={1} />
        <View style={{ height: 20 }} />
        <WizardTitle title="Información básica" subtitle="Cuéntanos sobre tu proyecto" />
        <View style={{ height: 22 }} />
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <View style={{ alignItems: "center" }}>
            <View>
              <View style={{ width: 88, height: 88, borderRadius: 18, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                {previewUri ? (
                  <ProjectAvatar imageUrl={previewUri} size={88} radius={18} />
                ) : (
                  <ProjectAvatar imageFileId={controller.imageFileId.value} size={88} radius={18} />
                )}
                {controller.imageUploading.value ? (
                  <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgressIndicator size={26} />
                  </View>
                ) : null}
              </View>
              <InkWell
                circle
                testID="project_image_button"
                accessibilityLabel="Elegir imagen del proyecto"
                onPress={() => void pickImage()}
                style={{
                  position: "absolute",
                  right: -4,
                  bottom: -4,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: HomeColors.primaryPurple,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcon name="camera_alt" color={Colors.white} size={15} />
              </InkWell>
            </View>
          </View>
          <View style={{ height: 22 }} />
          <Text style={{ fontWeight: "600", color: HomeColors.textPrimary, fontSize: 14 }}>Nombre del proyecto</Text>
          <View style={{ height: 8 }} />
          <GreyTextField
            testID="project_name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              controller.updateName(v);
            }}
            hint="Ej. Mi proyecto"
          />
          <View style={{ height: 18 }} />
          <Text style={{ fontWeight: "600", color: HomeColors.textPrimary, fontSize: 14 }}>Descripción</Text>
          <View style={{ height: 8 }} />
          <GreyTextField
            testID="project_description"
            value={description}
            onChangeText={(v) => {
              setDescription(v);
              controller.updateDescription(v);
            }}
            hint="Describe tu proyecto..."
            maxLines={4}
          />
          <View style={{ height: 22 }} />
          <ProjectContextDocuments
            documents={controller.contextDocuments.value}
            onAdd={(file) => controller.addContextDocument(file)}
            onRemove={(i) => void controller.removeContextDocument(i)}
            onRetry={(i) => controller.retryContextDocument(i)}
          />
          <View style={{ height: 8 }} />
        </ScrollView>
        <View style={{ height: 12 }} />
        <PurpleWideButton testID="basic_info_next" label="Siguiente" onPress={() => void Nav.to("TeamNeeded")} />
      </SafeAreaView>
    </View>
  );
}
