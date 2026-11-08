"use client";

import { useSyncExternalStore } from "react";
import { initialProfiles, type ProfilesState } from "./demo-domain";

const key = "proyectate-profiles-demo-v1", changed = "proyectate-profiles-demo-changed";
let lastRaw: string | null = null, lastSnapshot: ProfilesState = initialProfiles;
function valid(value: unknown): value is ProfilesState {
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 || !("profiles" in value) || !value.profiles || typeof value.profiles !== "object") return false;
  const profiles = value.profiles as Record<string, unknown>;
  return ["demo-a", "demo-b"].every(id => !!profiles[id] && typeof profiles[id] === "object" && (profiles[id] as Record<string, unknown>).userId === id);
}
function snapshot(): ProfilesState {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return initialProfiles;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === lastRaw) return lastSnapshot;
    const parsed: unknown = raw ? JSON.parse(raw) : initialProfiles;
    lastRaw = raw; lastSnapshot = valid(parsed) ? parsed : initialProfiles;
    return lastSnapshot;
  } catch { return initialProfiles; }
}
function subscribe(callback: () => void): () => void {
  window.addEventListener(changed, callback);
  const storage = (event: StorageEvent) => { if (event.key === key) callback(); };
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", storage); };
}
export function useDemoProfiles(): ProfilesState { return useSyncExternalStore(subscribe, snapshot, () => initialProfiles); }
export function updateDemoProfiles(change: (current: ProfilesState) => ProfilesState): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") throw new Error("La demostración solo funciona en desarrollo.");
  window.localStorage.setItem(key, JSON.stringify(change(snapshot())));
  lastRaw = null; window.dispatchEvent(new Event(changed));
}
export function resetDemoProfiles(): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return;
  window.localStorage.removeItem(key); lastRaw = null; window.dispatchEvent(new Event(changed));
}
