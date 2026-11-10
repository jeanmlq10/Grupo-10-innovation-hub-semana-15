// Equivalente de core/storage/local_preferences_shared.dart (SharedPreferences
// → AsyncStorage). Es la implementación de web y el respaldo de la segura.
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ILocalPreferences } from "./iLocalPreferences";

const PREFIX = "flutter."; // mismo prefijo que usa SharedPreferences en Flutter

export class LocalPreferencesShared implements ILocalPreferences {
  private async read<T>(key: string, type: string, parse: (raw: unknown) => T | null): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      if (raw == null) return null;
      return parse(JSON.parse(raw));
    } catch (e) {
      console.error(`Error getting ${type} for key "${key}": ${e}`);
      return null;
    }
  }

  private async write(key: string, value: unknown, type: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error setting ${type} for key "${key}": ${e}`);
      throw e;
    }
  }

  getString(key: string) {
    return this.read(key, "String", (v) => (typeof v === "string" ? v : null));
  }
  setString(key: string, value: string) {
    return this.write(key, value, "String");
  }
  getInt(key: string) {
    return this.read(key, "int", (v) => (typeof v === "number" ? Math.trunc(v) : null));
  }
  setInt(key: string, value: number) {
    return this.write(key, Math.trunc(value), "int");
  }
  getDouble(key: string) {
    return this.read(key, "double", (v) => (typeof v === "number" ? v : null));
  }
  setDouble(key: string, value: number) {
    return this.write(key, value, "double");
  }
  getBool(key: string) {
    return this.read(key, "bool", (v) => (typeof v === "boolean" ? v : null));
  }
  setBool(key: string, value: boolean) {
    return this.write(key, value, "bool");
  }
  getStringList(key: string) {
    return this.read(key, "List<String>", (v) => (Array.isArray(v) ? v.map(String) : null));
  }
  setStringList(key: string, value: string[]) {
    return this.write(key, value, "List<String>");
  }

  async remove(key: string) {
    try {
      await AsyncStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.error(`Error removing key "${key}": ${e}`);
      throw e;
    }
  }

  async clear() {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
      await AsyncStorage.multiRemove(keys);
    } catch (e) {
      console.error(`Error clearing local preferences: ${e}`);
      throw e;
    }
  }
}
