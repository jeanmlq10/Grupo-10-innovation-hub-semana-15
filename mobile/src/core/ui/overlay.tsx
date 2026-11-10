// Equivalente de `Get.dialog`, `Get.bottomSheet` / `showModalBottomSheet` y
// `Get.snackbar`. Un único <OverlayHost/> (en App.tsx) pinta lo que haya
// abierto encima del navegador, como el Overlay de Flutter.
import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Palette } from "../theme/brand";
import { withAlpha } from "../theme/homeColors";
import { boxShadow } from "../theme/shadow";

type ModalKind = "dialog" | "sheet";

type ModalItem = {
  id: number;
  kind: ModalKind;
  render: () => React.ReactNode;
  dismissible: boolean;
  resolve: (value: unknown) => void;
  /** Hoja que ocupa la altura que necesite (isScrollControlled). */
  scrollControlled?: boolean;
  barrierColor?: string;
  raw?: boolean;
  sheetBackground?: string;
  sheetRadius?: number;
};

export type SnackOptions = {
  position?: "TOP" | "BOTTOM";
  icon?: React.ReactNode;
  backgroundColor?: string;
  colorText?: string;
  durationMs?: number;
  borderColor?: string;
  borderWidth?: number;
};

type SnackItem = { id: number; title: string; message: string; options: SnackOptions };

let modals: ModalItem[] = [];
let snackQueue: SnackItem[] = [];
let currentSnack: SnackItem | null = null;
let ids = 0;
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

function showNextSnack() {
  if (currentSnack || snackQueue.length === 0) return;
  currentSnack = snackQueue.shift()!;
  emit();
}

export const Overlay = {
  /** `Get.dialog(widget, barrierDismissible: ...)` */
  dialog<T = unknown>(
    render: () => React.ReactNode,
    { barrierDismissible = true, barrierColor, raw = false }: { barrierDismissible?: boolean; barrierColor?: string; raw?: boolean } = {},
  ): Promise<T | undefined> {
    return new Promise((resolve) => {
      modals = [
        ...modals,
        { id: ++ids, kind: "dialog", render, dismissible: barrierDismissible, resolve: resolve as (v: unknown) => void, barrierColor, raw },
      ];
      emit();
    });
  },

  /** `Get.bottomSheet(...)` / `showModalBottomSheet(...)` */
  bottomSheet<T = unknown>(
    render: () => React.ReactNode,
    {
      isDismissible = true,
      isScrollControlled = false,
      backgroundColor,
      radius,
    }: { isDismissible?: boolean; isScrollControlled?: boolean; backgroundColor?: string; radius?: number } = {},
  ): Promise<T | undefined> {
    return new Promise((resolve) => {
      modals = [
        ...modals,
        {
          id: ++ids,
          kind: "sheet",
          render,
          dismissible: isDismissible,
          resolve: resolve as (v: unknown) => void,
          scrollControlled: isScrollControlled,
          sheetBackground: backgroundColor,
          sheetRadius: radius,
        },
      ];
      emit();
    });
  },

  hasModal: () => modals.length > 0,

  closeTop(result?: unknown) {
    const top = modals[modals.length - 1];
    if (!top) return;
    modals = modals.slice(0, -1);
    emit();
    top.resolve(result);
  },

  /** `Get.snackbar(title, message, ...)` (cola: uno a la vez, 3 s). */
  snackbar(title: string, message: string, options: SnackOptions = {}) {
    snackQueue.push({ id: ++ids, title, message, options });
    showNextSnack();
  },

  isSnackbarOpen: () => currentSnack != null,

  closeCurrentSnackbar() {
    if (!currentSnack) return;
    currentSnack = null;
    emit();
    setTimeout(showNextSnack, 0);
  },

  /** Sólo para pruebas. */
  reset() {
    modals = [];
    snackQueue = [];
    currentSnack = null;
    emit();
  },
};

/** Atajo con la misma firma conceptual que `Get.snackbar`. */
export const snackbar = Overlay.snackbar;

function GetSnackbar({ item }: { item: SnackItem }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const { position = "TOP", icon, backgroundColor, colorText, durationMs = 3000, borderColor, borderWidth } = item.options;
  const top = position === "TOP";

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== "web" }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: Platform.OS !== "web" }).start(() => {
        if (currentSnack?.id === item.id) Overlay.closeCurrentSnackbar();
      });
    }, durationMs);
    return () => clearTimeout(t);
  }, [anim, durationMs, item.id]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [top ? -120 : 120, 0] });
  const textColor = colorText ?? Palette.textPrimary;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.snackWrap,
        top ? { top: insets.top + 8 } : { bottom: insets.bottom + 8 },
        { transform: [{ translateY }], opacity: anim },
      ]}
    >
      <Pressable
        onPress={() => Overlay.closeCurrentSnackbar()}
        style={[
          styles.snack,
          { backgroundColor: backgroundColor ?? Palette.surface },
          backgroundColor ? null : styles.snackBranded,
          borderColor ? { borderColor, borderWidth: borderWidth ?? 1 } : null,
        ]}
      >
        {/* Acento verde limón de la marca, a la izquierda del aviso. */}
        {backgroundColor ? null : <View style={styles.snackAccent} />}
        {icon ? <View style={styles.snackIcon}>{icon}</View> : null}
        <View style={{ flex: 1 }}>
          <Text style={{ color: textColor, fontWeight: "800", fontSize: 15.5 }}>{item.title}</Text>
          <Text style={{ color: colorText ?? Palette.textSecondary, fontWeight: "400", fontSize: 14, marginTop: 2 }}>
            {item.message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function ModalLayer({ item, isTop }: { item: ModalItem; isTop: boolean }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const close = () => {
    if (item.dismissible && isTop) Overlay.closeTop(undefined);
  };

  if (item.kind === "dialog") {
    if (item.raw) {
      return (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: item.barrierColor ?? "transparent" }]} onPress={close} />
          {item.render()}
        </View>
      );
    }
    return (
      <View style={StyleSheet.absoluteFill}>
        <Pressable
          style={[StyleSheet.absoluteFill, styles.barrier, item.barrierColor ? { backgroundColor: item.barrierColor } : null]}
          onPress={close}
          accessibilityLabel="Cerrar"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.dialogCenter}
          pointerEvents="box-none"
        >
          {item.render()}
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={[StyleSheet.absoluteFill, styles.barrier]} onPress={close} accessibilityLabel="Cerrar" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.sheetBottom}
        pointerEvents="box-none"
      >
        <View
          style={{
            maxHeight: item.scrollControlled ? height - insets.top : height * (9 / 16),
            backgroundColor: item.sheetBackground ?? Palette.surface,
            borderTopLeftRadius: item.sheetRadius ?? 28,
            borderTopRightRadius: item.sheetRadius ?? 28,
            overflow: "hidden",
          }}
        >
          {item.render()}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function OverlayHost() {
  useSyncExternalStore(subscribe, () => version, () => version);
  const [, force] = useState(0);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (modals.length > 0) {
        const top = modals[modals.length - 1];
        if (top.dismissible) Overlay.closeTop(undefined);
        force((n) => n + 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {modals.map((m, i) => (
        <ModalLayer key={m.id} item={m} isTop={i === modals.length - 1} />
      ))}
      {currentSnack ? <GetSnackbar key={currentSnack.id} item={currentSnack} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  barrier: { backgroundColor: "rgba(20,0,41,0.55)" },
  dialogCenter: { flex: 1, justifyContent: "center", alignItems: "stretch" },
  sheetBottom: { flex: 1, justifyContent: "flex-end" },
  snackWrap: { position: "absolute", left: 10, right: 10 },
  snack: {
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  snackBranded: {
    borderWidth: 1,
    borderColor: Palette.border,
    ...boxShadow({ color: withAlpha(Palette.shadow, 0.16), blur: 18, dy: 6 }),
  },
  snackAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 6, backgroundColor: Palette.accent },
  snackIcon: { marginRight: 12 },
});
