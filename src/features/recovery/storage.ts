import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_STATE,
  type RecoveryTrackerState,
} from "./types";

const STORAGE_KEY = "recovery-tracker-v1";

function loadState(): RecoveryTrackerState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw) as RecoveryTrackerState;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      dailyEntries: parsed.dailyEntries ?? [],
      ptGoalWeeks: parsed.ptGoalWeeks ?? [],
      concernFlags: parsed.concernFlags ?? [],
      appointmentQuestions: parsed.appointmentQuestions ?? [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function persistState(state: RecoveryTrackerState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useRecoveryTracker() {
  const [state, setState] = useState<RecoveryTrackerState>(loadState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: RecoveryTrackerState) => RecoveryTrackerState) => {
    setState((prev) => {
      const next = updater(prev);
      persistState(next);
      return next;
    });
  }, []);

  const setSurgeryDate = useCallback(
    (surgeryDate: string | undefined) => {
      update((prev) => ({ ...prev, surgeryDate }));
    },
    [update],
  );

  const resetAll = useCallback(() => {
    persistState(DEFAULT_STATE);
    setState(DEFAULT_STATE);
  }, []);

  return {
    state,
    update,
    setSurgeryDate,
    resetAll,
    hydrated,
  };
}

export function exportRecoveryData(state: RecoveryTrackerState): string {
  return JSON.stringify(state, null, 2);
}

export function importRecoveryData(json: string): RecoveryTrackerState | null {
  try {
    const parsed = JSON.parse(json) as RecoveryTrackerState;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return {
      ...DEFAULT_STATE,
      ...parsed,
      dailyEntries: parsed.dailyEntries ?? [],
      ptGoalWeeks: parsed.ptGoalWeeks ?? [],
      concernFlags: parsed.concernFlags ?? [],
      appointmentQuestions: parsed.appointmentQuestions ?? [],
    };
  } catch {
    return null;
  }
}
