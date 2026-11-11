// Equivalentes React Native de los widgets de Material de Flutter que usa la
// app: InkWell, botones (Filled/Outlined/Text/Icon), AppBar, Scaffold,
// AlertDialog, CircularProgressIndicator, LinearProgressIndicator, Switch y
// Divider. Mantienen las medidas por defecto de Material 3 en Flutter.
import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityState,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Edge, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { M3 } from "../theme/appTheme";
import { Colors } from "../theme/homeColors";
import { Nav } from "../navigation/Nav";
import { IconName, MaterialIcon } from "./MaterialIcon";
import { Palette } from "../theme/brand";

const RIPPLE = "rgba(42,0,87,0.10)";

type InkProps = {
  onPress?: (() => void) | null;
  onLongPress?: () => void;
  borderRadius?: number;
  /** Color del "splash" (por defecto el de Material: negro al 12%). */
  splashColor?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  testID?: string;
  circle?: boolean;
};

/** `InkWell`: área pulsable con el efecto de tinta de Material. */
export function InkWell({
  onPress,
  onLongPress,
  borderRadius = 0,
  splashColor = RIPPLE,
  style,
  children,
  disabled,
  accessibilityLabel,
  accessibilityState,
  testID,
  circle,
}: InkProps) {
  const enabled = !!onPress && !disabled;
  return (
    <Pressable
      onPress={enabled ? () => onPress?.() : undefined}
      onLongPress={onLongPress}
      disabled={!enabled && !onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      testID={testID}
      android_ripple={enabled ? { color: splashColor, borderless: false, foreground: true } : undefined}
      style={({ pressed }) => [
        { borderRadius: circle ? 9999 : borderRadius, overflow: "hidden" },
        style,
        pressed && enabled && Platform.OS !== "android" ? { opacity: 1 } : null,
      ]}
    >
      {({ pressed }) => (
        <>
          {children}
          {pressed && enabled && Platform.OS !== "android" ? (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: splashColor, borderRadius: circle ? 9999 : borderRadius }]}
            />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

type ButtonProps = {
  onPress?: (() => void) | null;
  label?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  backgroundColor?: string;
  foregroundColor?: string;
  disabledBackgroundColor?: string;
  disabledForegroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  height?: number;
  paddingHorizontal?: number;
  icon?: React.ReactNode;
  testID?: string;
  accessibilityLabel?: string;
};

function ButtonBase({
  onPress,
  label,
  children,
  style,
  textStyle,
  bg,
  fg,
  disabledBg,
  disabledFg,
  borderRadius = 20,
  borderColor,
  borderWidth = 0,
  height = 40,
  paddingHorizontal = 24,
  icon,
  testID,
  accessibilityLabel,
}: Omit<ButtonProps, "backgroundColor" | "foregroundColor"> & {
  bg: string;
  fg: string;
  disabledBg: string;
  disabledFg: string;
}) {
  const enabled = !!onPress;
  const color = enabled ? fg : disabledFg;
  return (
    <InkWell
      onPress={onPress}
      borderRadius={borderRadius}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? label}
      splashColor={fg === Colors.white ? "rgba(255,255,255,0.18)" : RIPPLE}
      style={[
        {
          minHeight: height,
          backgroundColor: enabled ? bg : disabledBg,
          borderRadius,
          borderColor: borderColor ?? "transparent",
          borderWidth,
          paddingHorizontal,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 8 }}>{icon}</View> : null}
      {label != null ? (
        <Text style={[{ color, fontSize: 14, fontWeight: "500", textAlign: "center" }, textStyle]}>{label}</Text>
      ) : typeof children === "string" ? (
        <Text style={[{ color, fontSize: 14, fontWeight: "500", textAlign: "center" }, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </InkWell>
  );
}

/** `FilledButton` */
export function FilledButton(p: ButtonProps) {
  return (
    <ButtonBase
      {...p}
      bg={p.backgroundColor ?? M3.primary}
      fg={p.foregroundColor ?? M3.onPrimary}
      disabledBg={p.disabledBackgroundColor ?? Palette.track}
      disabledFg={p.disabledForegroundColor ?? M3.onSurfaceDisabled}
    />
  );
}

/** `OutlinedButton` */
export function OutlinedButton(p: ButtonProps) {
  return (
    <ButtonBase
      {...p}
      bg={p.backgroundColor ?? "transparent"}
      fg={p.foregroundColor ?? M3.primary}
      disabledBg={p.disabledBackgroundColor ?? p.backgroundColor ?? "transparent"}
      disabledFg={p.disabledForegroundColor ?? M3.onSurfaceDisabled}
      borderColor={p.borderColor ?? M3.outline}
      borderWidth={p.borderWidth ?? 1}
    />
  );
}

/** `TextButton` */
export function TextButton(p: ButtonProps) {
  return (
    <ButtonBase
      {...p}
      bg={p.backgroundColor ?? "transparent"}
      fg={p.foregroundColor ?? M3.primary}
      disabledBg={p.disabledBackgroundColor ?? "transparent"}
      disabledFg={p.disabledForegroundColor ?? M3.onSurfaceDisabled}
      paddingHorizontal={p.paddingHorizontal ?? 12}
    />
  );
}

/** `IconButton` (48x48 de área táctil, icono de 24). */
export function IconButton({
  icon,
  onPress,
  color = M3.onSurfaceVariant,
  size = 24,
  tooltip,
  style,
  testID,
}: {
  icon: IconName;
  onPress?: (() => void) | null;
  color?: string;
  size?: number;
  tooltip?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  return (
    <InkWell
      onPress={onPress}
      circle
      accessibilityLabel={tooltip}
      testID={testID}
      style={[{ width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 24 }, style]}
    >
      <MaterialIcon name={icon} size={size} color={onPress ? color : M3.onSurfaceDisabled} />
    </InkWell>
  );
}

/** Botón "atrás" automático de la AppBar de Flutter (icono según plataforma). */
export function BackButton({ color = M3.onSurface, onPress }: { color?: string; onPress?: () => void }) {
  return (
    <IconButton
      icon={Platform.OS === "ios" ? "arrow_back_ios" : "arrow_back"}
      color={color}
      tooltip="Atrás"
      onPress={onPress ?? (() => Nav.pop())}
    />
  );
}

/** `AppBar` de Material 3 (alto 56, título titleLarge 22). */
export function AppBar({
  title,
  titleStyle,
  centerTitle,
  backgroundColor = Colors.white,
  leading,
  automaticallyImplyLeading = true,
  actions,
  bottom,
  foregroundColor = M3.onSurface,
}: {
  title?: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  centerTitle?: boolean;
  backgroundColor?: string;
  leading?: React.ReactNode;
  automaticallyImplyLeading?: boolean;
  actions?: React.ReactNode;
  bottom?: React.ReactNode;
  foregroundColor?: string;
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const canPop = navigation.canGoBack();
  const showLeading = leading !== undefined ? leading != null : automaticallyImplyLeading && canPop;
  const center = centerTitle ?? Platform.OS === "ios";
  const titleNode =
    typeof title === "string" ? (
      <Text numberOfLines={1} style={[{ fontSize: 22, fontWeight: "400", color: foregroundColor }, titleStyle]}>
        {title}
      </Text>
    ) : (
      title
    );
  return (
    <View style={{ backgroundColor, paddingTop: insets.top }}>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
        {showLeading ? (
          <View style={{ width: 48, alignItems: "center" }}>{leading ?? <BackButton color={foregroundColor} />}</View>
        ) : null}
        <View
          style={[
            { flex: 1, paddingHorizontal: 12 },
            center ? { position: "absolute", left: 60, right: 60, alignItems: "center" } : showLeading ? { paddingLeft: 12 } : { paddingLeft: 12 },
          ]}
        >
          {titleNode}
        </View>
        {center ? <View style={{ flex: 1 }} /> : null}
        {actions ? <View style={{ flexDirection: "row", alignItems: "center" }}>{actions}</View> : null}
      </View>
      {bottom}
    </View>
  );
}

/** `Scaffold`: fondo, AppBar opcional, cuerpo y barra inferior. */
export function Scaffold({
  backgroundColor = Colors.white,
  appBar,
  children,
  bottomNavigationBar,
  safeTop = true,
  floatingActionButton,
}: {
  backgroundColor?: string;
  appBar?: React.ReactNode;
  children?: React.ReactNode;
  bottomNavigationBar?: React.ReactNode;
  safeTop?: boolean;
  floatingActionButton?: React.ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor }}>
      {appBar}
      <View style={{ flex: 1 }}>{children}</View>
      {bottomNavigationBar}
      {floatingActionButton}
      {!appBar && safeTop ? null : null}
    </View>
  );
}

/** `SafeArea` */
export function SafeArea({
  children,
  style,
  top = true,
  bottom = true,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  top?: boolean;
  bottom?: boolean;
}) {
  const edges: Edge[] = ["left", "right"];
  if (top) edges.push("top");
  if (bottom) edges.push("bottom");
  return (
    <SafeAreaView edges={edges} style={[{ flex: 1 }, style]}>
      {children}
    </SafeAreaView>
  );
}

/** `AlertDialog` de Material 3. Se muestra con `Overlay.dialog(...)`. */
export function AlertDialog({
  title,
  content,
  actions,
  backgroundColor = M3.elevation.level3,
  insetHorizontal = 40,
}: {
  title?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  backgroundColor?: string;
  insetHorizontal?: number;
}) {
  return (
    <View
      style={{
        marginHorizontal: insetHorizontal,
        backgroundColor,
        borderRadius: 28,
        paddingTop: 24,
        paddingBottom: 24,
        maxWidth: 560,
        alignSelf: "center",
        minWidth: 280,
        width: "auto",
      }}
    >
      {title != null ? (
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          {typeof title === "string" ? <Text style={{ fontSize: 24, color: M3.onSurface }}>{title}</Text> : title}
        </View>
      ) : null}
      {content != null ? (
        <ScrollView style={{ paddingHorizontal: 24, flexGrow: 0 }} keyboardShouldPersistTaps="handled">
          {typeof content === "string" ? <Text style={{ fontSize: 14, color: M3.onSurfaceVariant, lineHeight: 20 }}>{content}</Text> : content}
        </ScrollView>
      ) : null}
      {actions != null ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 24, paddingTop: 24, gap: 8 }}>
          {actions}
        </View>
      ) : null}
    </View>
  );
}

/** `CircularProgressIndicator` (indeterminado). */
export function CircularProgressIndicator({
  size = 36,
  strokeWidth = 4,
  color = M3.primary,
  backgroundColor,
  value,
}: {
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  value?: number;
}) {
  const spin = useRef(new Animated.Value(0)).current;
  const [arc, setArc] = useState(0.25);
  useEffect(() => {
    if (value != null) return;
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1333, easing: Easing.linear, useNativeDriver: Platform.OS !== "web" }),
    );
    loop.start();
    let t = 0;
    const id = setInterval(() => {
      t += 1;
      setArc(0.08 + 0.62 * (0.5 - 0.5 * Math.cos((t / 22) * Math.PI)));
    }, 60);
    return () => {
      loop.stop();
      clearInterval(id);
    };
  }, [spin, value]);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const fraction = value != null ? Math.max(0, Math.min(1, value)) : arc;
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View style={{ width: size, height: size, transform: value != null ? [] : [{ rotate }] }}>
      <Svg width={size} height={size}>
        {backgroundColor ? (
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={backgroundColor} strokeWidth={strokeWidth} fill="none" />
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * fraction} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </Animated.View>
  );
}

/** `LinearProgressIndicator` (determinado). */
export function LinearProgressIndicator({
  value,
  minHeight = 4,
  color = M3.primary,
  backgroundColor = M3.surfaceVariant,
  borderRadius = 0,
}: {
  value: number;
  minHeight?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
}) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height: minHeight, backgroundColor, borderRadius, overflow: "hidden" }}>
      <View style={{ width: `${v * 100}%`, height: "100%", backgroundColor: color, borderRadius }} />
    </View>
  );
}

/** `Switch` de Material 3. */
export function M3Switch({
  value,
  onChange,
  activeColor = M3.primary,
  disabled,
  testID,
}: {
  value: boolean;
  onChange?: ((v: boolean) => void) | null;
  activeColor?: string;
  disabled?: boolean;
  testID?: string;
}) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 150, useNativeDriver: false }).start();
  }, [anim, value]);
  const enabled = !!onChange && !disabled;
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 24] });
  const knob = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 24] });
  const knobOffset = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !enabled }}
      onPress={enabled ? () => onChange?.(!value) : undefined}
      style={{ width: 60, height: 48, justifyContent: "center", alignItems: "center", opacity: enabled ? 1 : 0.38 }}
    >
      <View
        style={{
          width: 52,
          height: 32,
          borderRadius: 16,
          backgroundColor: value ? activeColor : M3.surfaceVariant,
          borderWidth: 2,
          borderColor: value ? activeColor : M3.outline,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            left,
            marginLeft: knobOffset,
            width: knob,
            height: knob,
            borderRadius: 12,
            backgroundColor: value ? M3.onPrimary : M3.outline,
          }}
        />
      </View>
    </Pressable>
  );
}

/** `Divider` */
export function Divider({ height = 16, color = M3.outlineVariant, thickness = 1 }: { height?: number; color?: string; thickness?: number }) {
  return (
    <View style={{ height, justifyContent: "center" }}>
      <View style={{ height: thickness, backgroundColor: color }} />
    </View>
  );
}

/** `SizedBox(width/height)` */
export function Gap({ h, w }: { h?: number; w?: number }) {
  return <View style={{ height: h ?? 0, width: w ?? 0 }} />;
}

/** `Tooltip`: en móvil solo aporta la etiqueta de accesibilidad. */
export function Tooltip({ message, children }: { message: string; children: React.ReactNode }) {
  return <View accessibilityLabel={message}>{children}</View>;
}

/** `SimpleDialog` + `SimpleDialogOption` de Material 3. */
export function SimpleDialog({ title, options }: { title: string; options: { label: string; onPress: () => void }[] }) {
  return (
    <View
      style={{
        marginHorizontal: 40,
        backgroundColor: M3.elevation.level3,
        borderRadius: 28,
        paddingTop: 24,
        paddingBottom: 16,
        minWidth: 280,
        alignSelf: "center",
      }}
    >
      <Text style={{ paddingHorizontal: 24, paddingBottom: 12, fontSize: 24, color: M3.onSurface }}>{title}</Text>
      {options.map((o) => (
        <InkWell key={o.label} onPress={o.onPress} style={{ paddingHorizontal: 24, paddingVertical: 8 }}>
          <Text style={{ fontSize: 16, color: M3.onSurface }}>{o.label}</Text>
        </InkWell>
      ))}
    </View>
  );
}
