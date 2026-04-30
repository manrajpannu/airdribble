"use client";

import { useSyncExternalStore } from "react";

export type AppSettings = {
  showHud: boolean;
  deadzoneTrail: boolean;
  masterVolume: number;
};

const STORAGE_KEY = "airdribble-app-settings";

const defaultSettings: AppSettings = {
  showHud: true,
  deadzoneTrail: true,
  masterVolume: 70,
};

let state: AppSettings = defaultSettings;
let hydrated = false;
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) listener();
}

function clampVolume(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeSettings(value: Partial<AppSettings>): AppSettings {
  return {
    showHud: value.showHud ?? defaultSettings.showHud,
    deadzoneTrail: value.deadzoneTrail ?? defaultSettings.deadzoneTrail,
    masterVolume: clampVolume(value.masterVolume ?? defaultSettings.masterVolume),
  };
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    state = normalizeSettings(parsed);
  } catch {
    state = defaultSettings;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSettingsSnapshot() {
  hydrate();
  return state;
}

export function getServerSettingsSnapshot() {
  return defaultSettings;
}

export function updateSettings(patch: Partial<AppSettings>) {
  hydrate();
  state = normalizeSettings({ ...state, ...patch });
  persist();
  emitChange();
}

export function useAppSettings() {
  return useSyncExternalStore(subscribe, getSettingsSnapshot, getServerSettingsSnapshot);
}
