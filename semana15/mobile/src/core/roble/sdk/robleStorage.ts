// Port de `roble_storage.dart`: dónde persiste la sesión (tokens).
// En Flutter el SDK usa flutter_secure_storage (Keychain / Keystore). Aquí el
// equivalente es expo-secure-store; en web, que no tiene almacén seguro, se usa
// AsyncStorage (localStorage), igual que el fallback del proyecto Flutter.
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface RobleTokenStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// SecureStore sólo admite claves con [A-Za-z0-9._-].
const safeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, "_");

export class RobleSecureStorage implements RobleTokenStorage {
  async getItem(key: string) {
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(safeKey(key));
  }

  async setItem(key: string, value: string) {
    if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
    await SecureStore.setItemAsync(safeKey(key), value);
  }

  async removeItem(key: string) {
    if (Platform.OS === "web") return AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(safeKey(key));
  }
}

/** En memoria, para pruebas. */
export class RobleMemoryStorage implements RobleTokenStorage {
  private values = new Map<string, string>();
  async getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  async removeItem(key: string) {
    this.values.delete(key);
  }
}
