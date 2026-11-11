// Equivalente de auth/ui/first_access_store.dart: recuerda, en este
// dispositivo, que una cuenta terminó registro + verificación aquí pero aún
// no ha visto "¿Qué quieres hacer?".
import { getContainer } from "@/src/core/di/DIProvider";
import { TOKENS } from "@/src/core/di/tokens";
import { ILocalPreferences } from "@/src/core/storage/iLocalPreferences";

const PREFIX = "first_access_pending:";
const key = (email: string) => `${PREFIX}${email.trim().toLowerCase()}`;

function preferences(): ILocalPreferences | null {
  try {
    const c = getContainer();
    return c.isRegistered(TOKENS.LocalPreferences) ? c.resolve<ILocalPreferences>(TOKENS.LocalPreferences) : null;
  } catch {
    return null;
  }
}

export const FirstAccessStore = {
  async markPending(email: string) {
    if (email.trim() === "") return;
    try {
      await preferences()?.setBool(key(email), true);
    } catch {
      // igual que en Flutter: si no se puede guardar, no pasa nada
    }
  },

  async consume(email: string): Promise<boolean> {
    const prefs = preferences();
    if (prefs == null || email.trim() === "") return false;
    try {
      const pending = (await prefs.getBool(key(email))) ?? false;
      if (pending) await prefs.remove(key(email));
      return pending;
    } catch {
      return false;
    }
  },
};
