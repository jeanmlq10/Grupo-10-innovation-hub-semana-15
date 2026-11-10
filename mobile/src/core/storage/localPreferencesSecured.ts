// Equivalente de core/storage/local_preferences_secured.dart
// (flutter_secure_storage → expo-secure-store). Si el almacén seguro no está
// disponible, cae a LocalPreferencesShared, igual que en Flutter.
import * as SecureStore from "expo-secure-store";

import { ILocalPreferences } from "./iLocalPreferences";
import { LocalPreferencesShared } from "./localPreferencesShared";

const INDEX_KEY = "__secure_prefs_index__";
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_");

export class LocalPreferencesSecured implements ILocalPreferences {
  private useFallback = false;

  constructor(private readonly fallback: ILocalPreferences = new LocalPreferencesShared()) {}

  private async secureOrFallback<T>(secure: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.useFallback) return fallback();
    try {
      return await secure();
    } catch (e) {
      this.useFallback = true;
      console.warn(`expo-secure-store is unavailable; using AsyncStorage fallback. (${e})`);
      return fallback();
    }
  }

  private async readRaw(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(safeKey(key));
  }

  private async writeRaw(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(safeKey(key), value);
    const index = JSON.parse((await SecureStore.getItemAsync(INDEX_KEY)) ?? "[]") as string[];
    if (!index.includes(safeKey(key))) {
      index.push(safeKey(key));
      await SecureStore.setItemAsync(INDEX_KEY, JSON.stringify(index));
    }
  }

  getString(key: string) {
    return this.secureOrFallback(() => this.readRaw(key), () => this.fallback.getString(key));
  }
  setString(key: string, value: string) {
    return this.secureOrFallback(() => this.writeRaw(key, value), () => this.fallback.setString(key, value));
  }
  getInt(key: string) {
    return this.secureOrFallback(
      async () => {
        const v = await this.readRaw(key);
        const n = v == null ? NaN : Number.parseInt(v, 10);
        return Number.isFinite(n) ? n : null;
      },
      () => this.fallback.getInt(key),
    );
  }
  setInt(key: string, value: number) {
    return this.secureOrFallback(() => this.writeRaw(key, String(Math.trunc(value))), () => this.fallback.setInt(key, value));
  }
  getDouble(key: string) {
    return this.secureOrFallback(
      async () => {
        const v = await this.readRaw(key);
        const n = v == null ? NaN : Number.parseFloat(v);
        return Number.isFinite(n) ? n : null;
      },
      () => this.fallback.getDouble(key),
    );
  }
  setDouble(key: string, value: number) {
    return this.secureOrFallback(() => this.writeRaw(key, String(value)), () => this.fallback.setDouble(key, value));
  }
  getBool(key: string) {
    return this.secureOrFallback(
      async () => {
        const v = await this.readRaw(key);
        if (v == null) return null;
        if (v.toLowerCase() === "true") return true;
        if (v.toLowerCase() === "false") return false;
        return null;
      },
      () => this.fallback.getBool(key),
    );
  }
  setBool(key: string, value: boolean) {
    return this.secureOrFallback(() => this.writeRaw(key, String(value)), () => this.fallback.setBool(key, value));
  }
  getStringList(key: string) {
    return this.secureOrFallback(
      async () => {
        const v = await this.readRaw(key);
        if (v == null) return null;
        try {
          const decoded = JSON.parse(v);
          return Array.isArray(decoded) ? decoded.map(String) : null;
        } catch {
          return null;
        }
      },
      () => this.fallback.getStringList(key),
    );
  }
  setStringList(key: string, value: string[]) {
    return this.secureOrFallback(() => this.writeRaw(key, JSON.stringify(value)), () => this.fallback.setStringList(key, value));
  }
  remove(key: string) {
    return this.secureOrFallback(() => SecureStore.deleteItemAsync(safeKey(key)), () => this.fallback.remove(key));
  }
  clear() {
    return this.secureOrFallback(
      async () => {
        const index = JSON.parse((await SecureStore.getItemAsync(INDEX_KEY)) ?? "[]") as string[];
        await Promise.all(index.map((k) => SecureStore.deleteItemAsync(k)));
        await SecureStore.deleteItemAsync(INDEX_KEY);
      },
      () => this.fallback.clear(),
    );
  }
}
