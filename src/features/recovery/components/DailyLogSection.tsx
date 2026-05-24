import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck, Trash2 } from "lucide-react";
import {
  EMPTY_ROM,
  INCISION_LABELS,
  ROM_EXERCISE_LABELS,
  type DailyEntry,
  type IncisionAppearance,
  type RecoveryTrackerState,
} from "../types";
import {
  entryForDate,
  formatDisplayDate,
  newId,
  romPercent,
  sortedRomKeys,
  todayIso,
} from "../utils";

interface DailyLogSectionProps {
  state: RecoveryTrackerState;
  onChange: (updater: (prev: RecoveryTrackerState) => RecoveryTrackerState) => void;
}

function buildFormFromEntry(entry: DailyEntry | undefined, date: string): Omit<DailyEntry, "id"> {
  if (entry) {
    return {
      date: entry.date,
      painLevel: entry.painLevel,
      incisionAppearance: entry.incisionAppearance,
      incisionNotes: entry.incisionNotes,
      romExercises: { ...entry.romExercises },
      romMinutes: entry.romMinutes,
      notes: entry.notes,
    };
  }
  return {
    date,
    painLevel: 3,
    incisionAppearance: "clean_dry",
    romExercises: { ...EMPTY_ROM },
  };
}

export function DailyLogSection({ state, onChange }: DailyLogSectionProps) {
  const date = todayIso();
  const existing = entryForDate(state.dailyEntries, date);
  const [form, setForm] = useState(() => buildFormFromEntry(existing, date));

  const saveEntry = () => {
    onChange((prev) => {
      const withoutToday = prev.dailyEntries.filter((e) => e.date !== date);
      const entry: DailyEntry = {
        id: existing?.id ?? newId(),
        ...form,
        date,
      };
      return {
        ...prev,
        dailyEntries: [...withoutToday, entry].sort((a, b) => b.date.localeCompare(a.date)),
      };
    });
  };

  const deleteEntry = (id: string) => {
    onChange((prev) => ({
      ...prev,
      dailyEntries: prev.dailyEntries.filter((e) => e.id !== id),
    }));
  };

  const recent = state.dailyEntries
    .filter((e) => e.date !== date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Today&apos;s log — {formatDisplayDate(date)}
          </CardTitle>
          <CardDescription>
            Pain, incision check, and range-of-motion exercises. One entry per day; saving updates today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label htmlFor="pain-level" className="mb-2 block text-sm font-medium">
              Pain level: <span className="text-primary">{form.painLevel}</span> / 10
            </label>
            <input
              id="pain-level"
              type="range"
              min={0}
              max={10}
              step={1}
              value={form.painLevel}
              onChange={(e) => setForm((f) => ({ ...f, painLevel: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>None</span>
              <span>Worst</span>
            </div>
          </div>

          <div>
            <label htmlFor="incision" className="mb-2 block text-sm font-medium">
              Incision appearance
            </label>
            <select
              id="incision"
              value={form.incisionAppearance}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  incisionAppearance: e.target.value as IncisionAppearance,
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {(Object.keys(INCISION_LABELS) as IncisionAppearance[]).map((key) => (
                <option key={key} value={key}>
                  {INCISION_LABELS[key]}
                </option>
              ))}
            </select>
            <Textarea
              placeholder="Incision notes (optional)"
              className="mt-2"
              value={form.incisionNotes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, incisionNotes: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Range-of-motion exercises completed</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {sortedRomKeys().map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={form.romExercises[key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        romExercises: { ...f.romExercises, [key]: e.target.checked },
                      }))
                    }
                    className="accent-primary"
                  />
                  {ROM_EXERCISE_LABELS[key]}
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="rom-minutes" className="text-sm whitespace-nowrap">
                Minutes on ROM:
              </label>
              <Input
                id="rom-minutes"
                type="number"
                min={0}
                className="w-24"
                value={form.romMinutes ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    romMinutes: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>

          <Textarea
            placeholder="General notes for today (optional)"
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
          />

          <Button onClick={saveEntry} className="w-full sm:w-auto">
            {existing ? "Update today's log" : "Save today's log"}
          </Button>
        </CardContent>
      </Card>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent entries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3"
              >
                <div>
                  <p className="font-medium">{formatDisplayDate(entry.date)}</p>
                  <p className="text-sm text-muted-foreground">
                    Pain {entry.painLevel}/10 · {INCISION_LABELS[entry.incisionAppearance]} · ROM{" "}
                    {romPercent(entry)}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pain {entry.painLevel}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete entry"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
