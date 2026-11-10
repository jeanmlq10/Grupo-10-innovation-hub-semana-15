// Envoltorio de cada pantalla: entrega sus argumentos (como el constructor de
// la página en Flutter) y, al cerrarse, resuelve el `await Nav.to(...)`.
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";

import { Nav } from "./Nav";
import { ScreenName, ScreenParams } from "./routes";

type RouteParams = { argsId?: string } | undefined;

export function screen<S extends ScreenName>(
  Component: React.ComponentType<{ args: ScreenParams[S] }>,
): React.ComponentType {
  function Screen() {
    const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
    const argsId = route.params?.argsId;
    const args = Nav.argsOf<ScreenParams[S]>(argsId) as ScreenParams[S];
    useEffect(() => () => Nav.release(argsId), [argsId]);
    return <Component args={args} />;
  }
  Screen.displayName = `Screen(${Component.displayName ?? Component.name ?? "Page"})`;
  return Screen;
}
