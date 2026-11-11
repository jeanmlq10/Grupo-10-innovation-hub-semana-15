// Equivalente de GetxController + `.obs` + `Obx(...)`.
//
// Los controladores de Flutter (GetX) se migran como clases TypeScript con la
// MISMA lógica. Cada valor reactivo es un `Rx<T>` (lo que en Dart era `.obs`):
// al cambiarlo, el controlador avisa a los componentes suscritos con
// `useController(...)`, que se vuelven a pintar (lo que hacía `Obx`).
import { useEffect, useSyncExternalStore } from "react";

type Listener = () => void;

export class Rx<T> {
  private _value: T;
  private listeners = new Set<(value: T) => void>();

  constructor(
    initial: T,
    private readonly onChange?: () => void,
  ) {
    this._value = initial;
  }

  get value(): T {
    return this._value;
  }

  set value(next: T) {
    if (Object.is(next, this._value)) return;
    this._value = next;
    this.listeners.forEach((l) => l(next));
    this.onChange?.();
  }

  /** Fuerza el aviso aunque el valor sea el mismo objeto (como `refresh()` en GetX). */
  refresh() {
    this.listeners.forEach((l) => l(this._value));
    this.onChange?.();
  }

  /** Equivalente de `ever(rx, callback)`. */
  listen(cb: (value: T) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export abstract class Controller {
  private listeners = new Set<Listener>();
  private version = 0;
  private initialized = false;

  /** Crea un valor reactivo ligado a este controlador (`.obs`). */
  protected obs<T>(initial: T): Rx<T> {
    return new Rx<T>(initial, () => this.update());
  }

  /** Avisa a la UI (equivalente de `update()` en GetX). */
  update() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  readonly subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getVersion = () => this.version;

  /** Se llama una vez, la primera vez que se resuelve (como `onInit`). */
  ensureInit() {
    if (this.initialized) return;
    this.initialized = true;
    this.onInit();
  }

  protected onInit(): void {}

  onClose(): void {}
}

/** Re-pinta el componente cada vez que el controlador cambia (`Obx`). */
export function useController<T extends Controller>(controller: T): T {
  useSyncExternalStore(controller.subscribe, controller.getVersion, controller.getVersion);
  return controller;
}

/** Ejecuta `fn` una vez al montar (equivalente de `initState`). */
export function useOnMount(fn: () => void | (() => void)) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fn, []);
}
