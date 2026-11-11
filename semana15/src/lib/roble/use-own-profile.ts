"use client";
import { useEffect, useState } from "react";

export type OwnProfile = {
  name: string; username: string; bio: string; career: string; avatarIcon: string;
  profileVisibility: "public" | "private"; contactPermission: "everyone" | "nobody";
  activityVisibility: "everyone" | "onlyMe"; notificationsEnabled: boolean; mutedNotifications: string[];
};
type Identity = { userId: string; email: string; name: string };
export const emptyProfile: OwnProfile = { name: "", username: "", bio: "", career: "", avatarIcon: "person", profileVisibility: "public", contactPermission: "everyone", activityVisibility: "everyone", notificationsEnabled: true, mutedNotifications: [] };

export function useOwnProfile() {
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/profile/me", { credentials: "same-origin", cache: "no-store" }),
    ]).then(async ([auth, result]) => {
      if (!active) return;
      if (auth.status === 401 || result.status === 401) { setStatus("signed-out"); return; }
      if (!auth.ok || !result.ok) { setStatus("error"); return; }
      const [authBody, body] = await Promise.all([auth.json(), result.json()]);
      if (active) { setIdentity(authBody.user); setProfile(body.profile); setStatus("ready"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);
  async function save(body: Record<string, unknown>): Promise<boolean> {
    if (busy) return false;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/profile/me", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No pudimos guardar el perfil.");
      setProfile(result.profile);
      setMessage("Cambios guardados en Roble. También estarán disponibles en la app móvil.");
      return true;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "No pudimos guardar el perfil.");
      return false;
    } finally { setBusy(false); }
  }
  return { profile, identity, status, message, busy, save };
}
