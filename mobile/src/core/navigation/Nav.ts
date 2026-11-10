// Equivalente de la navegación de GetX (`Get.to`, `Get.off`, `Get.offAll`,
// `Get.back`, `Get.offNamed`, `Get.offAllNamed`, `Get.toNamed`) sobre React
// Navigation, para que las pantallas y controladores migrados naveguen igual.
//
// - Las pantallas reciben sus argumentos (objetos, callbacks...) como en
//   `Get.to(() => Pagina(arg))`: se guardan aquí y la ruta sólo lleva su id.
// - `Nav.to(...)` devuelve una Promise que se resuelve al cerrar esa pantalla
//   con el valor de `Nav.back(result)`, como `await Get.to(...)`.
// - `Nav.back()` respeta la regla de GetX 4.x: si hay un snackbar visible,
//   sólo cierra el snackbar; si hay un diálogo u hoja abierta, la cierra.
import { CommonActions, StackActions, createNavigationContainerRef } from "@react-navigation/native";

import { Overlay } from "../ui/overlay";
import { AppRoutes, NamedRoute, ScreenName, ScreenParams } from "./routes";

export const navigationRef = createNavigationContainerRef<Record<string, { argsId?: string } | undefined>>();

type Entry = { args: unknown; result: unknown; resolve: (value: unknown) => void };
const entries = new Map<string, Entry>();
let seq = 0;

/** Middleware de rutas con nombre (AuthGuard). Devuelve la ruta a la que ir. */
type Guard = (route: NamedRoute) => NamedRoute;
let guard: Guard = (route) => route;

function register(args: unknown): { id: string; promise: Promise<unknown> } {
  const id = `a${++seq}`;
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((r) => (resolve = r));
  entries.set(id, { args, result: undefined, resolve });
  return { id, promise };
}

function currentArgsId(): string | undefined {
  if (!navigationRef.isReady()) return undefined;
  const route = navigationRef.getCurrentRoute();
  return (route?.params as { argsId?: string } | undefined)?.argsId;
}

function namedScreen(route: NamedRoute): ScreenName {
  return AppRoutes.screenFor(route);
}

export const Nav = {
  setGuard(g: Guard) {
    guard = g;
  },

  /** Argumentos de la pantalla (lo que en Flutter era el constructor). */
  argsOf<T>(argsId: string | undefined): T | undefined {
    return argsId ? (entries.get(argsId)?.args as T | undefined) : undefined;
  },

  /** Lo llama cada pantalla al desmontarse: resuelve el `await Nav.to(...)`. */
  release(argsId: string | undefined) {
    if (!argsId) return;
    const entry = entries.get(argsId);
    if (!entry) return;
    entries.delete(argsId);
    entry.resolve(entry.result);
  },

  /** `Get.to(() => Pagina(args))` */
  to<R = unknown, S extends ScreenName = ScreenName>(screen: S, args?: ScreenParams[S]): Promise<R | undefined> {
    const { id, promise } = register(args);
    navigationRef.dispatch(StackActions.push(screen, { argsId: id }));
    return promise as Promise<R | undefined>;
  },

  /** `Get.off(() => Pagina(args))`: reemplaza la pantalla actual. */
  off<S extends ScreenName>(screen: S, args?: ScreenParams[S]): Promise<unknown> {
    const { id, promise } = register(args);
    navigationRef.dispatch(StackActions.replace(screen, { argsId: id }));
    return promise;
  },

  /** `Get.offAll(() => Pagina(args))`: deja sólo esa pantalla. */
  offAll<S extends ScreenName>(screen: S, args?: ScreenParams[S]): Promise<unknown> {
    const { id, promise } = register(args);
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: screen, params: { argsId: id } }] }));
    return promise;
  },

  /** `Get.toNamed(ruta)` (pasa por el AuthGuard). */
  toNamed(route: NamedRoute) {
    navigationRef.dispatch(StackActions.push(namedScreen(guard(route))));
  },

  /** `Get.offNamed(ruta)` (pasa por el AuthGuard). */
  offNamed(route: NamedRoute) {
    navigationRef.dispatch(StackActions.replace(namedScreen(guard(route))));
  },

  /** `Get.offAllNamed(ruta)` (pasa por el AuthGuard). */
  offAllNamed(route: NamedRoute) {
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: namedScreen(guard(route)) }] }));
  },

  /**
   * `Get.back(result: x)`. Igual que GetX 4.x: primero cierra el snackbar
   * visible; si no hay, cierra el diálogo u hoja de arriba; si no, la pantalla.
   */
  back(result?: unknown) {
    if (Overlay.isSnackbarOpen()) {
      Overlay.closeCurrentSnackbar();
      return;
    }
    if (Overlay.hasModal()) {
      Overlay.closeTop(result);
      return;
    }
    Nav.pop(result);
  },

  /** `Navigator.of(context).pop(result)` / `maybePop`: cierra la pantalla. */
  pop(result?: unknown) {
    if (!navigationRef.isReady() || !navigationRef.canGoBack()) return;
    const id = currentArgsId();
    if (id) {
      const entry = entries.get(id);
      if (entry) entry.result = result;
    }
    navigationRef.goBack();
  },

  /** `Navigator.of(context).popUntil((route) => route.isFirst)`. */
  popToTop() {
    if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.dispatch(StackActions.popToTop());
  },
};
