"use client";
import { useSyncExternalStore } from "react";
import { initialComms, type CommsState } from "./demo-domain";
const key = "proyectate-comms-demo-v1", changed = "proyectate-comms-demo-changed";
let lastRaw: string | null = null, lastSnapshot: CommsState = initialComms;
function valid(value: unknown): value is CommsState {
  return !!value && typeof value === "object" && "version" in value && value.version === 1 && "messages" in value && Array.isArray(value.messages) && "readNotificationIds" in value && !!value.readNotificationIds && typeof value.readNotificationIds === "object";
}
function snapshot(): CommsState {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return initialComms;
  try { const raw = window.localStorage.getItem(key); if (raw === lastRaw) return lastSnapshot; const parsed: unknown = raw ? JSON.parse(raw) : initialComms; lastRaw = raw; lastSnapshot = valid(parsed) ? parsed : initialComms; return lastSnapshot; } catch { return initialComms; }
}
function subscribe(callback: () => void): () => void {
  window.addEventListener(changed, callback);
  const storage = (event: StorageEvent) => { if (event.key === key) callback(); };
  window.addEventListener("storage", storage);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", storage); };
}
export function useDemoComms(): CommsState { return useSyncExternalStore(subscribe, snapshot, () => initialComms); }
export function updateDemoComms(change: (current: CommsState) => CommsState): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") throw new Error("La demostración solo funciona en desarrollo.");
  window.localStorage.setItem(key, JSON.stringify(change(snapshot()))); lastRaw = null; window.dispatchEvent(new Event(changed));
}
export function resetDemoComms(): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return;
  window.localStorage.removeItem(key); lastRaw = null; window.dispatchEvent(new Event(changed));
}
