"use client";

import { useSyncExternalStore } from "react";
import { initialState, emptyState, type DemoState } from "./demo-domain";

const key = "proyectate-projects-demo-v1";
const changed = "proyectate-projects-demo-changed";
let lastRaw: string | null = null;
let lastSnapshot: DemoState = initialState;

function validState(value: unknown): value is DemoState {
  return !!value && typeof value === "object" && "version" in value && value.version === 1 && "actor" in value && (value.actor === "demo-a" || value.actor === "demo-b") && "projects" in value && Array.isArray(value.projects);
}

function snapshot(): DemoState {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === lastRaw) return lastSnapshot;
    const parsed: unknown = raw ? JSON.parse(raw) : initialState;
    lastRaw = raw;
    lastSnapshot = validState(parsed) ? parsed : initialState;
    return lastSnapshot;
  } catch { return initialState; }
}

function serverSnapshot(): DemoState { return process.env.NODE_ENV === "development" ? initialState : emptyState; }
function subscribe(callback: () => void): () => void {
  window.addEventListener(changed, callback);
  const onStorage = (event: StorageEvent) => { if (event.key === key) callback(); };
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", onStorage); };
}

export function useDemoWorkspace(): DemoState { return useSyncExternalStore(subscribe, snapshot, serverSnapshot); }

export function updateDemoWorkspace(change: (current: DemoState) => DemoState): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") throw new Error("La demostración solo funciona en desarrollo.");
  const updated = change(snapshot());
  window.localStorage.setItem(key, JSON.stringify(updated));
  lastRaw = null;
  window.dispatchEvent(new Event(changed));
}

export function resetDemoWorkspace(): void {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  lastRaw = null;
  window.dispatchEvent(new Event(changed));
}
