import type { RecoveryState } from "./types";

const STORAGE_KEY = "ankle-recovery-tracker:v1";

export const emptyState: RecoveryState = {
  surgeryDate: null,
  logs: [],
  goals: [],
  questions: [],
  appointments: [],
};

export function loadState(): RecoveryState {
  if (typeof window === "undefined") {
    return emptyState;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<RecoveryState>;
    return {
      surgeryDate: parsed.surgeryDate ?? null,
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : [],
    };
  } catch {
    return emptyState;
  }
}

export function saveState(state: RecoveryState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date for the Monday of the week containing `iso`. */
export function weekStartIso(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const dow = d.getDay(); // 0 = Sun .. 6 = Sat
  const diff = (dow + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysSince(iso: string): number {
  const start = new Date(`${iso}T00:00:00`);
  const now = new Date();
  const diffMs = now.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

export function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
