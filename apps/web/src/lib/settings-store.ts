"use client";

import { useSyncExternalStore } from "react";

export type ControlBinding = {
  key?: string;
  key2?: string;
  mouse?: number;
  mouse2?: number;
  button?: number;
  button2?: number;
};

export type AppSettings = {
  showHud: boolean;
  deadzoneTrail: boolean;
  masterVolume: number;
  carBody: "octane" | "fennec" | "dominus";
  camera: {
    fov: number;
    distance: number;
    height: number;
  };
  deadzone: {
    sensitivity: number;
    size: number;
    type: "cross" | "square" | "circle";
  };
  controls: {
    yawLeft: ControlBinding;
    yawRight: ControlBinding;
    pitchUp: ControlBinding;
    pitchDown: ControlBinding;
    airRollLeft: ControlBinding;
    airRollRight: ControlBinding;
    freeAirRoll: ControlBinding;
    boost: ControlBinding;
  };
};

const STORAGE_KEY = "airdribble-app-settings";

const defaultSettings: AppSettings = {
  showHud: true,
  deadzoneTrail: true,
  masterVolume: 70,
  carBody: "octane",
  camera: {
    fov: 90,
    distance: 3.8,
    height: 2,
  },
  deadzone: {
    sensitivity: 1,
    size: 0.15,
    type: "cross",
  },
  controls: {
    yawLeft: { key: "a" },
    yawRight: { key: "d" },
    pitchUp: { key: "s" },
    pitchDown: { key: "w" },
    airRollLeft: { key: "q", button: 4 }, // LB
    airRollRight: { key: "e", button: 5 }, // RB
    freeAirRoll: { key: "Shift", button: 2 }, // X / Square
    boost: { mouse: 0, button: 1, }, // B / Circle / Left Click
  },
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
    carBody: value.carBody ?? defaultSettings.carBody,
    camera: {
      fov: value.camera?.fov ?? defaultSettings.camera.fov,
      distance: value.camera?.distance ?? defaultSettings.camera.distance,
      height: value.camera?.height ?? defaultSettings.camera.height,
    },
    deadzone: {
      sensitivity: value.deadzone?.sensitivity ?? defaultSettings.deadzone.sensitivity,
      size: value.deadzone?.size ?? defaultSettings.deadzone.size,
      type: value.deadzone?.type ?? defaultSettings.deadzone.type,
    },
    controls: {
      yawLeft: value.controls?.yawLeft ?? defaultSettings.controls.yawLeft,
      yawRight: value.controls?.yawRight ?? defaultSettings.controls.yawRight,
      pitchUp: value.controls?.pitchUp ?? defaultSettings.controls.pitchUp,
      pitchDown: value.controls?.pitchDown ?? defaultSettings.controls.pitchDown,
      airRollLeft: value.controls?.airRollLeft ?? defaultSettings.controls.airRollLeft,
      airRollRight: value.controls?.airRollRight ?? defaultSettings.controls.airRollRight,
      freeAirRoll: value.controls?.freeAirRoll ?? defaultSettings.controls.freeAirRoll,
      boost: value.controls?.boost ?? defaultSettings.controls.boost,
    },
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
