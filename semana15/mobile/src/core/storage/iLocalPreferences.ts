// Equivalente de core/storage/i_local_preferences.dart (misma interfaz).
export interface ILocalPreferences {
  getString(key: string): Promise<string | null>;
  setString(key: string, value: string): Promise<void>;

  getInt(key: string): Promise<number | null>;
  setInt(key: string, value: number): Promise<void>;

  getDouble(key: string): Promise<number | null>;
  setDouble(key: string, value: number): Promise<void>;

  getBool(key: string): Promise<boolean | null>;
  setBool(key: string, value: boolean): Promise<void>;

  getStringList(key: string): Promise<string[] | null>;
  setStringList(key: string, value: string[]): Promise<void>;

  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}
