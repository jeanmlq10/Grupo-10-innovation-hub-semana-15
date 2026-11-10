// "Documentos de contexto del proyecto" (Corrección 7), paso Información básica.
//
// Elige documentos del dispositivo (PDF, Word, TXT, PowerPoint), valida
// formato y tamaño, y los SUBE al bucket privado del proyecto
// (proyectos/documentos) a través de Roble. Cada documento muestra su
// estado real: subiendo, guardado o error (con reintento).
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
import { Text, View } from "react-native";

import { Palette } from "@/src/core/theme/brand";
import { HomeColors } from "@/src/core/theme/homeColors";
import { CircularProgressIndicator, InkWell } from "@/src/core/ui/material";
import { IconName, MaterialIcon } from "@/src/core/ui/MaterialIcon";

import { AttachmentPolicy } from "../../domain/models/projectAttachment";
import { ContextDocument } from "../viewmodels/createProjectController";

function iconFor(ext: string): IconName {
  return ext === "pdf" ? "picture_as_pdf_outlined" : "insert_drive_file_outlined";
}

function sizeLabel(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusLabel(doc: ContextDocument): string {
  switch (doc.status) {
    case "pending":
      return "En cola para subir";
    case "uploading":
      return "Subiendo…";
    case "uploaded":
      return "Guardado en el proyecto";
    case "error":
      return doc.error ?? "No se pudo subir";
  }
}

export function ProjectContextDocuments({
  documents,
  onAdd,
  onRemove,
  onRetry,
}: {
  documents: ContextDocument[];
  /** Devuelve el mensaje de error si el archivo no cumple los requisitos. */
  onAdd: (file: { name: string; size?: number | null; mimeType?: string | null; uri: string }) => string | null;
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const full = documents.filter((d) => d.status !== "error").length >= AttachmentPolicy.maxFiles;

  const pick = async () => {
    if (picking || full) return;
    setPicking(true);
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: AttachmentPolicy.allowedMimeTypes,
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const errors: string[] = [];
      for (const asset of result.assets) {
        const message = onAdd({ name: asset.name, size: asset.size ?? null, mimeType: asset.mimeType ?? null, uri: asset.uri });
        if (message) errors.push(message);
      }
      setError(errors.length > 0 ? errors.join("\n") : null);
    } catch {
      setError("No se pudo abrir el selector de archivos.");
    } finally {
      setPicking(false);
    }
  };

  return (
    <View testID="context_documents">
      <Text style={{ fontWeight: "600", color: HomeColors.textPrimary, fontSize: 14 }}>Documentos de contexto del proyecto</Text>
      <Text style={{ marginTop: 4, fontSize: 12.5, color: HomeColors.textSecondary, lineHeight: 12.5 * 1.35 }}>
        PDF, Word, TXT o PowerPoint con información complementaria (máx. 10 MB, hasta {AttachmentPolicy.maxFiles} archivos).
      </Text>
      <View style={{ height: 10 }} />
      {documents.map((doc, i) => (
        <View
          key={doc.key}
          testID={`context_document_${i}`}
          style={{
            marginBottom: 8,
            paddingLeft: 12,
            paddingVertical: 8,
            paddingRight: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: doc.status === "error" ? Palette.error : HomeColors.borderGrey,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: HomeColors.navSelectedBackground, alignItems: "center", justifyContent: "center" }}>
            {doc.status === "uploading" ? (
              <CircularProgressIndicator size={18} />
            ) : (
              <MaterialIcon name={iconFor(doc.extension)} size={19} color={HomeColors.primaryPurple} />
            )}
          </View>
          <View style={{ width: 10 }} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: 13.5, fontWeight: "600", color: HomeColors.textPrimary }}>
              {doc.name}
            </Text>
            <Text numberOfLines={2} style={{ fontSize: 12, color: doc.status === "error" ? Palette.errorStrong : HomeColors.textSecondary }}>
              {[doc.extension.toUpperCase(), sizeLabel(doc.sizeBytes), statusLabel(doc)].filter((x) => x !== "").join(" · ")}
            </Text>
          </View>
          {doc.status === "error" ? (
            <InkWell
              circle
              testID={`retry_context_document_${i}`}
              accessibilityLabel={`Reintentar ${doc.name}`}
              onPress={() => onRetry(i)}
              style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
            >
              <MaterialIcon name="refresh_rounded" size={20} color={HomeColors.primaryPurple} />
            </InkWell>
          ) : null}
          <InkWell
            circle
            testID={`remove_context_document_${i}`}
            accessibilityLabel={`Quitar ${doc.name}`}
            onPress={doc.status === "uploading" ? null : () => {
              onRemove(i);
              setError(null);
            }}
            style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
          >
            <MaterialIcon name="close" size={20} color={HomeColors.textSecondary} />
          </InkWell>
        </View>
      ))}
      <InkWell
        testID="attach_file_button"
        accessibilityLabel="Adjuntar archivo"
        onPress={full ? null : () => void pick()}
        borderRadius={14}
        style={{
          height: 50,
          borderRadius: 14,
          backgroundColor: full ? HomeColors.surfaceGrey : HomeColors.flowLavender,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          opacity: full ? 0.6 : 1,
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 14, color: HomeColors.primaryPurple }}>
          {full ? "Límite de archivos alcanzado" : picking ? "Abriendo..." : "Adjuntar archivo"}
        </Text>
        <View style={{ width: 8 }} />
        <MaterialIcon name="upload_file_outlined" size={20} color={HomeColors.primaryPurple} />
      </InkWell>
      {error ? (
        <View testID="context_document_error" style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: Palette.errorTint }}>
          <Text style={{ fontSize: 12.5, color: Palette.errorStrong }}>{error}</Text>
        </View>
      ) : null}
      <View style={{ marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: Palette.cyanTint, flexDirection: "row" }}>
        <MaterialIcon name="lock_outlined" size={16} color={Palette.primary} />
        <View style={{ width: 6 }} />
        <Text style={{ flex: 1, fontSize: 12, color: Palette.primary, lineHeight: 12 * 1.35 }}>
          Los documentos se guardan en el almacenamiento privado del proyecto. Solo tú y tu equipo los ven en la app.
        </Text>
      </View>
    </View>
  );
}
