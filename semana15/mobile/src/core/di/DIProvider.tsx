import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { Controller, useController } from "../state/Controller";
import { createAppContainer } from "./appContainer";
import { Container } from "./container";

const DIContext = createContext<Container | null>(null);

type Props = {
  children: React.ReactNode;
  // Optional: pass a container with fakes (e.g. in tests). Defaults to the app's container.
  container?: Container;
};

let globalContainer: Container | null = null;

/** Acceso fuera de React (equivalente de `Get.find` en código no visual). */
export function getContainer(): Container {
  if (!globalContainer) throw new Error("DIProvider missing");
  return globalContainer;
}

export function DIProvider({ children, container }: Props) {
  const value = useMemo(() => container ?? createAppContainer(), [container]);
  globalContainer = value;
  return <DIContext.Provider value={value}>{children}</DIContext.Provider>;
}

export function useDI() {
  const c = useContext(DIContext);
  if (!c) throw new Error("DIProvider missing");
  return c;
}

/** `Get.find<T>()` + `Obx`: el controlador y re-pintado cuando cambia. */
export function useFind<T extends Controller>(token: symbol): T {
  const di = useDI();
  const [controller] = useState(() => di.acquire<T>(token));
  useEffect(() => () => di.release(token), [di, token]);
  return useController(controller);
}

/** `Get.find<T>()` sin suscribirse a cambios. */
export function useFindStatic<T>(token: symbol): T {
  const di = useDI();
  return useMemo(() => di.resolve<T>(token), [di, token]);
}
