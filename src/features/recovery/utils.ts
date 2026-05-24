import { format, parseISO, startOfWeek, differenceInCalendarDays } from "date-fns";
import type { DailyEntry, RecoveryTrackerState } from "./types";
import { ROM_EXERCISE_LABELS, type RomExerciseKey } from "./types";

export function todayIso(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplayDate(iso: string): string {
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

export function daysPostOp(surgeryDate: string | undefined): number | null {
  if (!surgeryDate) {
    return null;
  }
  try {
    return Math.max(0, differenceInCalendarDays(new Date(), parseISO(surgeryDate)));
  } catch {
    return null;
  }
}

export function weekStartIso(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function romCompletionCount(entry: DailyEntry): number {
  return Object.values(entry.romExercises).filter(Boolean).length;
}

export function romTotalCount(): number {
  return Object.keys(ROM_EXERCISE_LABELS).length;
}

export function romPercent(entry: DailyEntry): number {
  const total = romTotalCount();
  if (total === 0) {
    return 0;
  }
  return Math.round((romCompletionCount(entry) / total) * 100);
}

export interface TrendPoint {
  date: string;
  label: string;
  pain: number;
  romPercent: number;
  week: number;
}

export function buildTrendSeries(
  entries: DailyEntry[],
  surgeryDate?: string,
): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((entry) => {
    let week = 0;
    if (surgeryDate) {
      try {
        week = Math.floor(
          differenceInCalendarDays(parseISO(entry.date), parseISO(surgeryDate)) / 7,
        ) + 1;
      } catch {
        week = 0;
      }
    }
    return {
      date: entry.date,
      label: formatDisplayDate(entry.date),
      pain: entry.painLevel,
      romPercent: romPercent(entry),
      week: Math.max(week, 1),
    };
  });
}

export function activeConcerns(state: RecoveryTrackerState) {
  return state.concernFlags.filter((c) => !c.discussedWithSurgeon);
}

export function pendingQuestions(state: RecoveryTrackerState) {
  return state.appointmentQuestions.filter((q) => !q.asked);
}

export function entryForDate(entries: DailyEntry[], date: string): DailyEntry | undefined {
  return entries.find((e) => e.date === date);
}

export function newId(): string {
  return crypto.randomUUID();
}

export function sortedRomKeys(): RomExerciseKey[] {
  return Object.keys(ROM_EXERCISE_LABELS) as RomExerciseKey[];
}
