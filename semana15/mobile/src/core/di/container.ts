// Contenedor de dependencias (template del curso) ampliado con lo que el
// proyecto Flutter usaba de GetX:
//  - `register`   → Get.put(..., permanent: true)  (singleton)
//  - `registerLazy` → Get.lazyPut(..., fenix: true): se crea al primer uso,
//    se destruye (onClose) cuando la última pantalla que lo usaba se cierra,
//    y se vuelve a crear la próxima vez que se necesite.
import { Controller } from "../state/Controller";

type LazyEntry = { factory: () => unknown; instance: unknown | null; refs: number };

export class Container {
  private singletons = new Map<symbol, unknown>();
  private lazies = new Map<symbol, LazyEntry>();

  register<T>(token: symbol, instance: T) {
    this.singletons.set(token, instance);
    if (instance instanceof Controller) instance.ensureInit();
    return this;
  }

  registerLazy<T>(token: symbol, factory: () => T) {
    this.lazies.set(token, { factory, instance: null, refs: 0 });
    return this;
  }

  isRegistered(token: symbol): boolean {
    return this.singletons.has(token) || this.lazies.has(token);
  }

  /** `Get.find<T>()` */
  resolve<T>(token: symbol): T {
    if (this.singletons.has(token)) return this.singletons.get(token) as T;
    const lazy = this.lazies.get(token);
    if (lazy) {
      if (lazy.instance == null) {
        lazy.instance = lazy.factory();
        if (lazy.instance instanceof Controller) lazy.instance.ensureInit();
      }
      return lazy.instance as T;
    }
    throw new Error(`No provider for ${String(token)}`);
  }

  /** Una pantalla empieza a usar el controlador (lo crea si hace falta). */
  acquire<T>(token: symbol): T {
    const instance = this.resolve<T>(token);
    const lazy = this.lazies.get(token);
    if (lazy) lazy.refs++;
    return instance;
  }

  /** La pantalla se cerró: si nadie más lo usa, se destruye (fenix). */
  release(token: symbol) {
    const lazy = this.lazies.get(token);
    if (!lazy || lazy.instance == null) return;
    lazy.refs = Math.max(0, lazy.refs - 1);
    if (lazy.refs === 0) {
      const instance = lazy.instance;
      lazy.instance = null;
      if (instance instanceof Controller) instance.onClose();
    }
  }
}
