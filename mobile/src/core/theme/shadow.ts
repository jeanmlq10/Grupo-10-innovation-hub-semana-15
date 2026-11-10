// Equivalente de `BoxShadow(color, blurRadius, offset, spreadRadius)` de Flutter.
// React Native 0.76+ (Nueva Arquitectura, la única en Expo SDK 57) acepta
// `boxShadow` en iOS, Android y web, así que se traduce 1:1.
// Flutter convierte blurRadius a sigma = blur*0.57735+0.5; CSS usa blur = 2*sigma.
import { ViewStyle } from "react-native";

export type FlutterShadow = { color: string; blur: number; dx?: number; dy?: number; spread?: number };

export function boxShadow(...shadows: FlutterShadow[]): ViewStyle {
  return {
    boxShadow: shadows
      .map(({ color, blur, dx = 0, dy = 0, spread = 0 }) => {
        const cssBlur = blur <= 0 ? 0 : Math.round((blur * 0.57735 + 0.5) * 2 * 10) / 10;
        return `${dx}px ${dy}px ${cssBlur}px ${spread}px ${color}`;
      })
      .join(", "),
  };
}
