import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  Download,
  Heart,
  HelpCircle,
  Plus,
  Stethoscope,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  DEFAULT_EXERCISES,
  incisionLabels,
  redFlagLabels,
  type Appointment,
  type DailyLog,
  type IncisionAppearance,
  type RecoveryState,
  type RedFlag,
  type RedFlagType,
  type RomExercise,
  type SurgeonQuestion,
  type WeeklyGoal,
} from "@/features/recovery/types";
import {
  daysSince,
  emptyState,
  formatDateLabel,
  loadState,
  newId,
  saveState,
  todayIso,
  weekStartIso,
} from "@/features/recovery/storage";

const PAIN_COLOR = "#ff5577";
const SWELLING_COLOR = "#ffd166";
const ROM_COLOR = "#22ee88";

function emptyDailyLog(date: string): DailyLog {
  return {
    date,
    pain: 3,
    swelling: 3,
    romPercent: 30,
    incision: "healing-well",
    exercises: DEFAULT_EXERCISES.map((e) => ({
      id: newId(),
      name: e.name,
      sets: 0,
      reps: 0,
    })),
    notes: "",
    redFlags: [],
  };
}

export default function Recovery() {
  const { toast } = useToast();
  const [state, setState] = useState<RecoveryState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso());

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveState(state);
  }, [state, hydrated]);

  const currentLog: DailyLog = useMemo(() => {
    const found = state.logs.find((l) => l.date === selectedDate);
    return found ?? emptyDailyLog(selectedDate);
  }, [state.logs, selectedDate]);

  const upsertLog = (updater: (log: DailyLog) => DailyLog) => {
    setState((prev) => {
      const existing = prev.logs.find((l) => l.date === selectedDate);
      const base = existing ?? emptyDailyLog(selectedDate);
      const next = updater(base);
      const others = prev.logs.filter((l) => l.date !== selectedDate);
      return { ...prev, logs: [...others, next].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  };

  const saveLog = () => {
    upsertLog((l) => l);
    toast({
      title: "Daily log saved",
      description: `Entry recorded for ${formatDateLabel(selectedDate)}.`,
    });
  };

  const trendData = useMemo(() => {
    return state.logs
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        date: l.date.slice(5),
        pain: l.pain,
        swelling: l.swelling,
        rom: Math.round(l.romPercent / 10),
      }));
  }, [state.logs]);

  const activeRedFlags = useMemo(
    () =>
      state.logs
        .flatMap((l) => l.redFlags.map((f) => ({ ...f, dayDate: l.date })))
        .filter((f) => !f.resolved)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.logs],
  );

  const currentWeekStart = weekStartIso(selectedDate);
  const currentWeekGoals = state.goals.filter((g) => g.weekStart === currentWeekStart);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ankle-recovery-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported", description: "Saved as JSON." });
  };

  const importData = (file: File) => {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as RecoveryState;
        setState({
          surgeryDate: parsed.surgeryDate ?? null,
          logs: parsed.logs ?? [],
          goals: parsed.goals ?? [],
          questions: parsed.questions ?? [],
          appointments: parsed.appointments ?? [],
        });
        toast({ title: "Data imported", description: "Recovery records restored." });
      } catch {
        toast({
          title: "Import failed",
          description: "File was not valid recovery JSON.",
          variant: "destructive",
        });
      }
    });
  };

  const clearAll = () => {
    if (!window.confirm("Erase ALL recovery data stored on this device?")) return;
    setState(emptyState);
    toast({ title: "Cleared", description: "All local recovery data removed." });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixRain />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            className="font-mono terminal-border text-primary border-primary"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="mr-2" />
              Back to home
            </Link>
          </Button>
          <p className="text-xs font-mono text-primary/80">ankle recovery · stored locally</p>
        </div>

        <header className="mb-6 terminal-border rounded-xl bg-card/55 backdrop-blur-sm p-5 md:p-7">
          <p className="inline-block px-2 py-1 text-xs font-mono text-primary terminal-border mb-3">
            POST_OP_TRACKER
          </p>
          <h1 className="text-3xl md:text-4xl font-mono font-bold matrix-text text-primary mb-3">
            Ankle Recovery Dashboard
          </h1>
          <p className="max-w-3xl text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
            Log daily pain, incision appearance, and range-of-motion work. Flag warning symptoms
            for your surgeon, set weekly PT goals, and watch the trend over the coming weeks.
            Everything is stored only in this browser — nothing is uploaded.
          </p>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
            <SurgeryDateCard
              surgeryDate={state.surgeryDate}
              onChange={(date) => setState((s) => ({ ...s, surgeryDate: date }))}
            />
            <DateSelectorCard
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              logCount={state.logs.length}
            />
            <DataActionsCard
              onExport={exportData}
              onImport={importData}
              onClear={clearAll}
            />
          </div>
        </header>

        {activeRedFlags.length > 0 && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-destructive/60 bg-destructive/10 p-4 flex items-start gap-3"
          >
            <AlertTriangle className="text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-mono text-sm font-bold text-destructive">
                {activeRedFlags.length} unresolved warning sign
                {activeRedFlags.length === 1 ? "" : "s"} — discuss with your surgeon
              </p>
              <ul className="mt-1 text-xs font-mono text-destructive/90 space-y-0.5">
                {activeRedFlags.slice(0, 4).map((f) => (
                  <li key={f.id}>
                    · {formatDateLabel(f.date)} — {redFlagLabels[f.type]}
                    {f.notes ? ` (${f.notes})` : ""}
                  </li>
                ))}
                {activeRedFlags.length > 4 && (
                  <li className="opacity-80">… and {activeRedFlags.length - 4} more below</li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DailyLogCard
            log={currentLog}
            onChange={upsertLog}
            onSave={saveLog}
          />

          <SymptomsCard
            log={currentLog}
            onChange={upsertLog}
          />

          <WeeklyGoalsCard
            weekStart={currentWeekStart}
            goals={currentWeekGoals}
            onAdd={(text) =>
              setState((s) => ({
                ...s,
                goals: [
                  ...s.goals,
                  { id: newId(), weekStart: currentWeekStart, text, done: false },
                ],
              }))
            }
            onToggle={(id) =>
              setState((s) => ({
                ...s,
                goals: s.goals.map((g) =>
                  g.id === id ? { ...g, done: !g.done } : g,
                ),
              }))
            }
            onDelete={(id) =>
              setState((s) => ({
                ...s,
                goals: s.goals.filter((g) => g.id !== id),
              }))
            }
          />

          <QuestionsCard
            questions={state.questions}
            appointments={state.appointments}
            onAddQuestion={(text, appointmentDate) =>
              setState((s) => ({
                ...s,
                questions: [
                  ...s.questions,
                  { id: newId(), text, appointmentDate, asked: false },
                ],
              }))
            }
            onToggleQuestion={(id) =>
              setState((s) => ({
                ...s,
                questions: s.questions.map((q) =>
                  q.id === id ? { ...q, asked: !q.asked } : q,
                ),
              }))
            }
            onDeleteQuestion={(id) =>
              setState((s) => ({
                ...s,
                questions: s.questions.filter((q) => q.id !== id),
              }))
            }
            onAddAppointment={(date, notes) =>
              setState((s) => ({
                ...s,
                appointments: [
                  ...s.appointments,
                  { id: newId(), date, notes },
                ].sort((a, b) => a.date.localeCompare(b.date)),
              }))
            }
            onDeleteAppointment={(id) =>
              setState((s) => ({
                ...s,
                appointments: s.appointments.filter((a) => a.id !== id),
              }))
            }
          />
        </div>

        <Card className="mt-5 terminal-border bg-card/55 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="text-primary" size={18} />
              <CardTitle className="text-lg font-mono text-primary">Recovery trend</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">
              Lower pain &amp; swelling and rising range of motion show progress. ROM is shown on a
              0–10 scale (= percent ÷ 10) so it shares the axis with pain &amp; swelling.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length < 2 ? (
              <p className="text-sm font-mono text-muted-foreground py-8 text-center">
                Save at least two daily logs to see a trend line.
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                    <CartesianGrid stroke="hsl(120 25% 18%)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(120 80% 60%)"
                      tick={{ fontSize: 11, fontFamily: "monospace" }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      stroke="hsl(120 80% 60%)"
                      tick={{ fontSize: 11, fontFamily: "monospace" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(0 0% 6%)",
                        border: "1px solid hsl(120 25% 18%)",
                        fontFamily: "monospace",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "hsl(120 100% 60%)" }}
                    />
                    <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="pain"
                      name="Pain (0-10)"
                      stroke={PAIN_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="swelling"
                      name="Swelling (0-10)"
                      stroke={SWELLING_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rom"
                      name="ROM (×10%)"
                      stroke={ROM_COLOR}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-xs font-mono text-muted-foreground/80 leading-relaxed text-center">
          ⚠️ This dashboard is a personal organizer — not medical advice. Call your surgeon&apos;s
          office for any warning signs (spreading redness, warmth, increasing swelling, fever,
          calf pain) instead of waiting for your next visit.
        </p>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Sub-components                                */
/* -------------------------------------------------------------------------- */

function SurgeryDateCard({
  surgeryDate,
  onChange,
}: {
  surgeryDate: string | null;
  onChange: (date: string | null) => void;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-background/70 p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2">
        Surgery date
      </p>
      <Input
        type="date"
        value={surgeryDate ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="font-mono"
        aria-label="Surgery date"
      />
      <p className="mt-2 text-xs font-mono text-primary">
        {surgeryDate
          ? `Day ${daysSince(surgeryDate)} post-op (${formatDateLabel(surgeryDate)})`
          : "Set your surgery date to track post-op day count."}
      </p>
    </div>
  );
}

function DateSelectorCard({
  selectedDate,
  setSelectedDate,
  logCount,
}: {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  logCount: number;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-background/70 p-4">
      <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2">
        Logging for
      </p>
      <Input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value || todayIso())}
        max={todayIso()}
        className="font-mono"
        aria-label="Date being logged"
      />
      <p className="mt-2 text-xs font-mono text-primary">
        {logCount} day{logCount === 1 ? "" : "s"} logged so far
      </p>
    </div>
  );
}

function DataActionsCard({
  onExport,
  onImport,
  onClear,
}: {
  onExport: () => void;
  onImport: (f: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-lg border border-primary/30 bg-background/70 p-4 flex flex-col gap-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70">
        Backup &amp; restore
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="font-mono border-primary/40 text-primary"
          onClick={onExport}
        >
          <Download className="mr-1.5" size={14} /> Export
        </Button>
        <label className="inline-flex">
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = "";
            }}
          />
          <span className="cursor-pointer inline-flex items-center rounded-md border border-primary/40 text-primary px-3 h-8 text-sm font-mono bg-background hover:bg-primary/10">
            <Upload className="mr-1.5" size={14} /> Import
          </span>
        </label>
        <Button
          size="sm"
          variant="outline"
          className="font-mono border-destructive/60 text-destructive hover:text-destructive"
          onClick={onClear}
        >
          <Trash2 className="mr-1.5" size={14} /> Clear
        </Button>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground">
        Data lives only in this browser&apos;s localStorage.
      </p>
    </div>
  );
}

/* ------------------------------ Daily log ------------------------------ */

function DailyLogCard({
  log,
  onChange,
  onSave,
}: {
  log: DailyLog;
  onChange: (updater: (l: DailyLog) => DailyLog) => void;
  onSave: () => void;
}) {
  return (
    <Card className="terminal-border bg-card/55 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Heart className="text-primary" size={18} />
          <CardTitle className="text-lg font-mono text-primary">Daily check-in</CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          {formatDateLabel(log.date)} — log how the ankle is doing today.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SliderField
          label="Pain level"
          value={log.pain}
          color={PAIN_COLOR}
          minLabel="0 — none"
          maxLabel="10 — worst imaginable"
          onChange={(pain) => onChange((l) => ({ ...l, pain }))}
        />
        <SliderField
          label="Swelling"
          value={log.swelling}
          color={SWELLING_COLOR}
          minLabel="0 — none"
          maxLabel="10 — severe"
          onChange={(swelling) => onChange((l) => ({ ...l, swelling }))}
        />
        <div>
          <div className="flex justify-between items-baseline mb-1">
            <label
              htmlFor="rom-input"
              className="font-mono text-sm text-primary"
            >
              Range of motion (% of normal)
            </label>
            <span className="font-mono text-sm text-primary tabular-nums">
              {log.romPercent}%
            </span>
          </div>
          <input
            id="rom-input"
            type="range"
            min={0}
            max={100}
            step={5}
            value={log.romPercent}
            onChange={(e) =>
              onChange((l) => ({ ...l, romPercent: Number(e.target.value) }))
            }
            className="w-full accent-primary"
            style={{ accentColor: ROM_COLOR }}
          />
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>0% — fused / immobilized</span>
            <span>100% — pre-injury</span>
          </div>
        </div>

        <IncisionSelect
          value={log.incision}
          onChange={(incision) => onChange((l) => ({ ...l, incision }))}
        />

        <ExercisesEditor
          exercises={log.exercises}
          onChange={(exercises) => onChange((l) => ({ ...l, exercises }))}
        />

        <div>
          <label
            htmlFor="day-notes"
            className="block text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-1"
          >
            Notes for the day
          </label>
          <Textarea
            id="day-notes"
            placeholder="Anything noteworthy: meds, sleep, walking distance, ice/elevation…"
            value={log.notes}
            onChange={(e) => onChange((l) => ({ ...l, notes: e.target.value }))}
            className="font-mono min-h-[80px]"
          />
        </div>

        <Button onClick={onSave} className="w-full font-mono">
          Save log for {formatDateLabel(log.date)}
        </Button>
      </CardContent>
    </Card>
  );
}

function SliderField({
  label,
  value,
  color,
  minLabel,
  maxLabel,
  onChange,
}: {
  label: string;
  value: number;
  color: string;
  minLabel: string;
  maxLabel: string;
  onChange: (v: number) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <label htmlFor={id} className="font-mono text-sm text-primary">
          {label}
        </label>
        <span className="font-mono text-sm tabular-nums" style={{ color }}>
          {value} / 10
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color }}
      />
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function IncisionSelect({
  value,
  onChange,
}: {
  value: IncisionAppearance;
  onChange: (v: IncisionAppearance) => void;
}) {
  return (
    <div>
      <label
        htmlFor="incision-select"
        className="block text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-1"
      >
        Incision appearance
      </label>
      <select
        id="incision-select"
        value={value}
        onChange={(e) => onChange(e.target.value as IncisionAppearance)}
        className="w-full h-10 rounded-md border border-input bg-background px-3 font-mono text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {(Object.keys(incisionLabels) as IncisionAppearance[]).map((key) => (
          <option key={key} value={key}>
            {incisionLabels[key]}
          </option>
        ))}
      </select>
    </div>
  );
}

function ExercisesEditor({
  exercises,
  onChange,
}: {
  exercises: RomExercise[];
  onChange: (next: RomExercise[]) => void;
}) {
  const update = (id: string, patch: Partial<RomExercise>) =>
    onChange(exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const remove = (id: string) => onChange(exercises.filter((e) => e.id !== id));
  const add = () =>
    onChange([
      ...exercises,
      { id: newId(), name: "New exercise", sets: 0, reps: 0 },
    ]);

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2">
        Range-of-motion exercises
      </p>
      <ul className="space-y-2">
        {exercises.map((ex) => (
          <li
            key={ex.id}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center"
          >
            <Input
              value={ex.name}
              onChange={(e) => update(ex.id, { name: e.target.value })}
              className="font-mono h-9 text-sm"
              aria-label="Exercise name"
            />
            <label className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              sets
              <Input
                type="number"
                min={0}
                max={20}
                value={ex.sets}
                onChange={(e) =>
                  update(ex.id, { sets: Number(e.target.value) || 0 })
                }
                className="font-mono h-9 w-16 text-sm"
                aria-label={`${ex.name} sets`}
              />
            </label>
            <label className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
              reps
              <Input
                type="number"
                min={0}
                max={200}
                value={ex.reps}
                onChange={(e) =>
                  update(ex.id, { reps: Number(e.target.value) || 0 })
                }
                className="font-mono h-9 w-16 text-sm"
                aria-label={`${ex.name} reps`}
              />
            </label>
            <button
              type="button"
              onClick={() => remove(ex.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${ex.name}`}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={add}
        className="mt-2 font-mono border-primary/40 text-primary"
      >
        <Plus size={14} className="mr-1" /> Add exercise
      </Button>
    </div>
  );
}

/* ------------------------------ Symptoms ------------------------------ */

function SymptomsCard({
  log,
  onChange,
}: {
  log: DailyLog;
  onChange: (updater: (l: DailyLog) => DailyLog) => void;
}) {
  const [type, setType] = useState<RedFlagType>("redness-spreading");
  const [notes, setNotes] = useState("");

  const addFlag = () => {
    const flag: RedFlag = {
      id: newId(),
      date: log.date,
      type,
      notes: notes.trim(),
      resolved: false,
    };
    onChange((l) => ({ ...l, redFlags: [...l.redFlags, flag] }));
    setNotes("");
  };

  const toggle = (id: string) =>
    onChange((l) => ({
      ...l,
      redFlags: l.redFlags.map((f) =>
        f.id === id ? { ...f, resolved: !f.resolved } : f,
      ),
    }));
  const remove = (id: string) =>
    onChange((l) => ({
      ...l,
      redFlags: l.redFlags.filter((f) => f.id !== id),
    }));

  return (
    <Card className="terminal-border bg-card/55 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive" size={18} />
          <CardTitle className="text-lg font-mono text-primary">
            Concerning symptoms
          </CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          Flag warning signs — redness, warmth, unusual swelling — to bring up with your surgeon.
          Mark them resolved once they pass or are addressed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RedFlagType)}
            className="h-10 rounded-md border border-input bg-background px-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Symptom type"
          >
            {(Object.keys(redFlagLabels) as RedFlagType[]).map((k) => (
              <option key={k} value={k}>
                {redFlagLabels[k]}
              </option>
            ))}
          </select>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional details (location, duration…)"
            className="font-mono"
            aria-label="Symptom notes"
          />
        </div>
        <Button
          onClick={addFlag}
          variant="outline"
          className="font-mono border-destructive/60 text-destructive hover:text-destructive w-full sm:w-auto"
        >
          <AlertTriangle size={14} className="mr-1.5" /> Flag for {formatDateLabel(log.date)}
        </Button>

        {log.redFlags.length === 0 ? (
          <p className="text-sm font-mono text-muted-foreground text-center py-4">
            No symptoms flagged for this day. 🟢
          </p>
        ) : (
          <ul className="space-y-2">
            {log.redFlags.map((f) => (
              <li
                key={f.id}
                className={`rounded-md border px-3 py-2 flex items-start gap-2 ${
                  f.resolved
                    ? "border-primary/30 bg-background/40"
                    : "border-destructive/60 bg-destructive/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(f.id)}
                  className="mt-0.5"
                  aria-label={f.resolved ? "Mark unresolved" : "Mark resolved"}
                >
                  {f.resolved ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <Circle size={16} className="text-destructive" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-mono text-sm ${
                      f.resolved
                        ? "text-muted-foreground line-through"
                        : "text-destructive"
                    }`}
                  >
                    {redFlagLabels[f.type]}
                  </p>
                  {f.notes && (
                    <p className="font-mono text-xs text-muted-foreground mt-0.5">
                      {f.notes}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(f.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Delete symptom"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-[10px] font-mono text-muted-foreground border-t border-primary/15 pt-3">
          Call your surgeon&apos;s office now for: spreading redness, fever, increasing pain not
          relieved by meds, severe calf pain, numbness, or wound drainage with pus.
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Goals ------------------------------ */

function WeeklyGoalsCard({
  weekStart,
  goals,
  onAdd,
  onToggle,
  onDelete,
}: {
  weekStart: string;
  goals: WeeklyGoal[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [text, setText] = useState("");

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  const completed = goals.filter((g) => g.done).length;

  return (
    <Card className="terminal-border bg-card/55 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="text-primary" size={18} />
          <CardTitle className="text-lg font-mono text-primary">
            Weekly PT goals
          </CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          Week of {formatDateLabel(weekStart)} — {completed}/{goals.length} complete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Walk 10 min in boot · Hit 40% dorsiflexion"
            className="font-mono"
            aria-label="New weekly goal"
          />
          <Button type="submit" className="font-mono">
            <Plus size={14} className="mr-1" /> Add
          </Button>
        </form>

        {goals.length === 0 ? (
          <p className="text-sm font-mono text-muted-foreground text-center py-4">
            No goals yet for this week. Try 2–3 small, measurable targets.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {goals.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-2 rounded-md border border-primary/20 bg-background/50 px-3 py-2"
              >
                <button
                  type="button"
                  onClick={() => onToggle(g.id)}
                  aria-label={g.done ? "Mark incomplete" : "Mark complete"}
                >
                  {g.done ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <Circle size={16} className="text-primary/50" />
                  )}
                </button>
                <span
                  className={`flex-1 font-mono text-sm ${
                    g.done ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {g.text}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(g.id)}
                  aria-label="Delete goal"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------ Questions ------------------------------ */

function QuestionsCard({
  questions,
  appointments,
  onAddQuestion,
  onToggleQuestion,
  onDeleteQuestion,
  onAddAppointment,
  onDeleteAppointment,
}: {
  questions: SurgeonQuestion[];
  appointments: Appointment[];
  onAddQuestion: (text: string, appointmentDate?: string) => void;
  onToggleQuestion: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onAddAppointment: (date: string, notes: string) => void;
  onDeleteAppointment: (id: string) => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [questionDate, setQuestionDate] = useState<string>("");
  const [apptDate, setApptDate] = useState<string>("");
  const [apptNotes, setApptNotes] = useState<string>("");

  const handleAddQuestion = () => {
    const trimmed = questionText.trim();
    if (!trimmed) return;
    onAddQuestion(trimmed, questionDate || undefined);
    setQuestionText("");
  };

  const handleAddAppointment = () => {
    if (!apptDate) return;
    onAddAppointment(apptDate, apptNotes.trim());
    setApptDate("");
    setApptNotes("");
  };

  const grouped = useMemo(() => {
    const map = new Map<string, SurgeonQuestion[]>();
    for (const q of questions) {
      const key = q.appointmentDate ?? "unscheduled";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "unscheduled") return 1;
      if (b === "unscheduled") return -1;
      return a.localeCompare(b);
    });
  }, [questions]);

  return (
    <Card className="terminal-border bg-card/55 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Stethoscope className="text-primary" size={18} />
          <CardTitle className="text-lg font-mono text-primary">
            Surgeon visit prep
          </CardTitle>
        </div>
        <CardDescription className="font-mono text-xs">
          Park questions as they come up, group them by appointment, and check them off in the
          exam room.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-1">
            <CalendarDays size={12} /> Upcoming appointments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-2">
            <Input
              type="date"
              value={apptDate}
              onChange={(e) => setApptDate(e.target.value)}
              className="font-mono"
              aria-label="Appointment date"
            />
            <Input
              value={apptNotes}
              onChange={(e) => setApptNotes(e.target.value)}
              placeholder="e.g. 2-week post-op with Dr. Smith"
              className="font-mono"
              aria-label="Appointment notes"
            />
            <Button
              type="button"
              onClick={handleAddAppointment}
              variant="outline"
              className="font-mono border-primary/40 text-primary"
            >
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>

          {appointments.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 rounded-md border border-primary/20 bg-background/50 px-3 py-1.5"
                >
                  <Badge
                    variant="outline"
                    className="font-mono border-primary/40 text-primary whitespace-nowrap"
                  >
                    {formatDateLabel(a.date)}
                  </Badge>
                  <span className="flex-1 font-mono text-sm text-foreground truncate">
                    {a.notes || "Appointment"}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteAppointment(a.id)}
                    aria-label="Delete appointment"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-1">
            <ClipboardList size={12} /> Add a question
          </p>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddQuestion();
            }}
          >
            <Textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. When can I start weight-bearing without the boot?"
              className="font-mono min-h-[60px]"
              aria-label="Question text"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={questionDate}
                onChange={(e) => setQuestionDate(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 font-mono text-xs flex-1 min-w-[160px]"
                aria-label="Target appointment for question"
              >
                <option value="">No specific appointment</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.date}>
                    {formatDateLabel(a.date)} — {a.notes || "Appointment"}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" className="font-mono">
                <Plus size={14} className="mr-1" /> Add question
              </Button>
            </div>
          </form>
        </section>

        <section>
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/70 mb-2 flex items-center gap-1">
            <HelpCircle size={12} /> Question list
          </p>
          {questions.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground text-center py-4">
              No questions yet — jot them down whenever they pop into your head.
            </p>
          ) : (
            <div className="space-y-3">
              {grouped.map(([key, qs]) => (
                <div key={key}>
                  <p className="text-xs font-mono text-primary/80 mb-1">
                    {key === "unscheduled"
                      ? "Unscheduled / general"
                      : `For ${formatDateLabel(key)}`}
                  </p>
                  <ul className="space-y-1.5">
                    {qs.map((q) => (
                      <li
                        key={q.id}
                        className="flex items-start gap-2 rounded-md border border-primary/20 bg-background/50 px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleQuestion(q.id)}
                          className="mt-0.5"
                          aria-label={q.asked ? "Mark unasked" : "Mark asked"}
                        >
                          {q.asked ? (
                            <CheckCircle2 size={16} className="text-primary" />
                          ) : (
                            <Circle size={16} className="text-primary/50" />
                          )}
                        </button>
                        <span
                          className={`flex-1 font-mono text-sm ${
                            q.asked
                              ? "line-through text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {q.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteQuestion(q.id)}
                          aria-label="Delete question"
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
