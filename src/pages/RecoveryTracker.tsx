import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  ChevronLeft,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  MessageSquarePlus,
  Plus,
  ShieldCheck,
  ThermometerSun,
  Trash2,
} from 'lucide-react';
import MatrixRain from '@/components/MatrixRain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type DailyLog = {
  id: string;
  date: string;
  pain: number;
  incision: string;
  dorsiflexion: number;
  plantarflexion: number;
  exerciseMinutes: number;
  symptoms: string[];
  notes: string;
};

type TherapyGoal = {
  id: string;
  week: string;
  goal: string;
  status: 'planned' | 'in-progress' | 'done';
};

type CheckupQuestion = {
  id: string;
  question: string;
  priority: 'routine' | 'important' | 'urgent';
};

const STORAGE_KEYS = {
  logs: 'recovery-tracker.logs',
  goals: 'recovery-tracker.goals',
  questions: 'recovery-tracker.questions',
};

const SYMPTOM_OPTIONS = [
  'Redness spreading',
  'Heat around incision',
  'Unusual swelling',
  'Drainage or odor',
  'Fever or chills',
  'New calf pain',
];

const INCISION_OPTIONS = [
  'Dry and closed',
  'Mild bruising',
  'Scabbing',
  'Redness noted',
  'Drainage noted',
];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInput(date);
};

const getCurrentWeekLabel = () => {
  const now = new Date();
  const next = new Date();
  next.setDate(now.getDate() + 6);
  return `${toDateInput(now)} to ${toDateInput(next)}`;
};

const DEFAULT_LOGS: DailyLog[] = [
  {
    id: 'sample-1',
    date: daysAgo(21),
    pain: 7,
    incision: 'Mild bruising, dry dressing',
    dorsiflexion: 4,
    plantarflexion: 18,
    exerciseMinutes: 8,
    symptoms: ['Unusual swelling'],
    notes: 'Elevated most of the evening after exercises.',
  },
  {
    id: 'sample-2',
    date: daysAgo(14),
    pain: 5,
    incision: 'Dry and closed',
    dorsiflexion: 7,
    plantarflexion: 24,
    exerciseMinutes: 14,
    symptoms: [],
    notes: 'Swelling improved after icing and ankle pumps.',
  },
  {
    id: 'sample-3',
    date: daysAgo(7),
    pain: 4,
    incision: 'Scabbing, no drainage',
    dorsiflexion: 10,
    plantarflexion: 31,
    exerciseMinutes: 18,
    symptoms: [],
    notes: 'Added towel stretches after PT approval.',
  },
  {
    id: 'sample-4',
    date: daysAgo(1),
    pain: 3,
    incision: 'Dry and closed',
    dorsiflexion: 13,
    plantarflexion: 36,
    exerciseMinutes: 22,
    symptoms: [],
    notes: 'Walking boot feels more comfortable today.',
  },
];

const DEFAULT_GOALS: TherapyGoal[] = [
  {
    id: 'goal-1',
    week: getCurrentWeekLabel(),
    goal: 'Complete ankle alphabet, towel stretch, and band work once daily if cleared by PT.',
    status: 'in-progress',
  },
  {
    id: 'goal-2',
    week: 'Next PT review',
    goal: 'Ask PT whether swelling response is normal after longer standing blocks.',
    status: 'planned',
  },
];

const DEFAULT_QUESTIONS: CheckupQuestion[] = [
  {
    id: 'question-1',
    question: 'When can I progress weight-bearing and driving restrictions?',
    priority: 'important',
  },
  {
    id: 'question-2',
    question: 'Which incision changes should trigger a same-day call?',
    priority: 'urgent',
  },
];

const getInitialLogForm = (): Omit<DailyLog, 'id'> => ({
  date: toDateInput(new Date()),
  pain: 3,
  incision: 'Dry and closed',
  dorsiflexion: 12,
  plantarflexion: 35,
  exerciseMinutes: 20,
  symptoms: [],
  notes: '',
});

function readStoredArray<T>(key: string, fallback: T[]) {
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T[]) : fallback;
  } catch {
    return fallback;
  }
}

const RecoveryTracker = () => {
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() =>
    readStoredArray(STORAGE_KEYS.logs, DEFAULT_LOGS),
  );
  const [therapyGoals, setTherapyGoals] = useState<TherapyGoal[]>(() =>
    readStoredArray(STORAGE_KEYS.goals, DEFAULT_GOALS),
  );
  const [questions, setQuestions] = useState<CheckupQuestion[]>(() =>
    readStoredArray(STORAGE_KEYS.questions, DEFAULT_QUESTIONS),
  );
  const [dailyForm, setDailyForm] = useState<Omit<DailyLog, 'id'>>(() => getInitialLogForm());
  const [goalForm, setGoalForm] = useState<Omit<TherapyGoal, 'id'>>({
    week: getCurrentWeekLabel(),
    goal: '',
    status: 'planned',
  });
  const [questionForm, setQuestionForm] = useState<Omit<CheckupQuestion, 'id'>>({
    question: '',
    priority: 'routine',
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.goals, JSON.stringify(therapyGoals));
  }, [therapyGoals]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.questions, JSON.stringify(questions));
  }, [questions]);

  const sortedLogs = useMemo(
    () => [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date)),
    [dailyLogs],
  );

  const firstLog = sortedLogs[0];
  const latestLog = sortedLogs[sortedLogs.length - 1];
  const flaggedLogs = useMemo(() => dailyLogs.filter((log) => log.symptoms.length > 0), [dailyLogs]);
  const avgPain = useMemo(() => {
    const recentLogs = sortedLogs.slice(-7);
    if (!recentLogs.length) return 0;
    return recentLogs.reduce((total, log) => total + log.pain, 0) / recentLogs.length;
  }, [sortedLogs]);
  const romChange = sortedLogs.length > 1 && firstLog && latestLog
    ? latestLog.dorsiflexion + latestLog.plantarflexion - (firstLog.dorsiflexion + firstLog.plantarflexion)
    : 0;

  const chartData = sortedLogs.map((log) => ({
    date: new Date(`${log.date}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    pain: log.pain,
    dorsiflexion: log.dorsiflexion,
    plantarflexion: log.plantarflexion,
    exerciseMinutes: log.exerciseMinutes,
  }));

  const toggleSymptom = (symptom: string) => {
    setDailyForm((current) => {
      const symptoms = current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom];
      return { ...current, symptoms };
    });
  };

  const addDailyLog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entry: DailyLog = { ...dailyForm, id: createId() };

    setDailyLogs((current) =>
      [entry, ...current.filter((log) => log.date !== entry.date)].sort((a, b) => b.date.localeCompare(a.date)),
    );
    setDailyForm(getInitialLogForm());
  };

  const addTherapyGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goalForm.goal.trim()) return;

    setTherapyGoals((current) => [{ ...goalForm, id: createId() }, ...current]);
    setGoalForm({ week: getCurrentWeekLabel(), goal: '', status: 'planned' });
  };

  const addQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!questionForm.question.trim()) return;

    setQuestions((current) => [{ ...questionForm, id: createId() }, ...current]);
    setQuestionForm({ question: '', priority: 'routine' });
  };

  const updateGoalStatus = (id: string, status: TherapyGoal['status']) => {
    setTherapyGoals((current) =>
      current.map((goal) => (goal.id === id ? { ...goal, status } : goal)),
    );
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <MatrixRain />

      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-primary/25 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-primary font-mono font-bold tracking-tight">
            <ChevronLeft size={18} />
            IAN.SYS / RECOVERY
          </Link>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <a href="#daily-log" className="rounded border border-primary/30 px-2 py-1 text-primary/80 hover:text-primary">
              Daily log
            </a>
            <a href="#symptoms" className="rounded border border-primary/30 px-2 py-1 text-primary/80 hover:text-primary">
              Symptoms
            </a>
            <a href="#checkup" className="rounded border border-primary/30 px-2 py-1 text-primary/80 hover:text-primary">
              Check-up
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-28">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <Badge className="mb-4 border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
              <HeartPulse className="mr-2 h-3.5 w-3.5" />
              Post-op ankle recovery tracker
            </Badge>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-primary matrix-text md:text-6xl">
              Recovery dashboard for the next few weeks.
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Log pain, incision appearance, range-of-motion work, PT goals, concerning symptoms, and the
              questions you want ready for your orthopedic check-up.
            </p>
          </div>
          <Card className="glass-card">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This dashboard is an organization aid, not medical advice. Contact your surgeon or care team
                  promptly for fever, worsening redness, heat, drainage, calf pain, or swelling that feels unusual.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: 'Days logged', value: dailyLogs.length, icon: CalendarCheck },
            { label: 'Recent avg pain', value: avgPain.toFixed(1), icon: Activity },
            { label: 'ROM change', value: `${romChange >= 0 ? '+' : ''}${romChange}°`, icon: Dumbbell },
            { label: 'Flagged days', value: flaggedLogs.length, icon: AlertTriangle },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="border-primary/20 bg-card/80">
                <CardContent className="p-5">
                  <Icon className="mb-4 h-5 w-5 text-primary" />
                  <p className="text-2xl font-bold text-primary">{metric.value}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mb-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <Card id="daily-log" className="glass-card scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ClipboardList className="h-5 w-5" />
                Daily recovery log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addDailyLog} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm text-muted-foreground">
                    Date
                    <Input
                      type="date"
                      value={dailyForm.date}
                      onChange={(event) => setDailyForm((current) => ({ ...current, date: event.target.value }))}
                    />
                  </label>
                  <label className="space-y-2 text-sm text-muted-foreground">
                    Pain level: {dailyForm.pain}/10
                    <div className="flex items-center gap-3">
                      <Input
                        type="range"
                        min="0"
                        max="10"
                        value={dailyForm.pain}
                        onChange={(event) => setDailyForm((current) => ({ ...current, pain: Number(event.target.value) }))}
                      />
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={dailyForm.pain}
                        aria-label="Pain level number"
                        onChange={(event) => {
                          const pain = Math.max(0, Math.min(10, Number(event.target.value)));
                          setDailyForm((current) => ({ ...current, pain }));
                        }}
                        className="w-20"
                      />
                    </div>
                  </label>
                </div>

                <label className="space-y-2 text-sm text-muted-foreground">
                  Incision appearance
                  <select
                    value={dailyForm.incision}
                    onChange={(event) => setDailyForm((current) => ({ ...current, incision: event.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {INCISION_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="space-y-2 text-sm text-muted-foreground">
                    Dorsiflexion
                    <Input
                      type="number"
                      min="0"
                      max="40"
                      value={dailyForm.dorsiflexion}
                      onChange={(event) =>
                        setDailyForm((current) => ({ ...current, dorsiflexion: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label className="space-y-2 text-sm text-muted-foreground">
                    Plantarflexion
                    <Input
                      type="number"
                      min="0"
                      max="70"
                      value={dailyForm.plantarflexion}
                      onChange={(event) =>
                        setDailyForm((current) => ({ ...current, plantarflexion: Number(event.target.value) }))
                      }
                    />
                  </label>
                  <label className="space-y-2 text-sm text-muted-foreground">
                    Exercise minutes
                    <Input
                      type="number"
                      min="0"
                      max="180"
                      value={dailyForm.exerciseMinutes}
                      onChange={(event) =>
                        setDailyForm((current) => ({ ...current, exerciseMinutes: Number(event.target.value) }))
                      }
                    />
                  </label>
                </div>

                <fieldset className="space-y-3 rounded-lg border border-primary/20 p-4">
                  <legend className="px-2 text-xs uppercase tracking-[0.2em] text-primary/80">
                    Concerning symptoms to discuss
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SYMPTOM_OPTIONS.map((symptom) => (
                      <label key={symptom} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={dailyForm.symptoms.includes(symptom)}
                          onChange={() => toggleSymptom(symptom)}
                          className="h-4 w-4 accent-primary"
                        />
                        {symptom}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label className="space-y-2 text-sm text-muted-foreground">
                  Notes
                  <Textarea
                    value={dailyForm.notes}
                    placeholder="What changed after exercises, icing, elevation, or walking?"
                    onChange={(event) => setDailyForm((current) => ({ ...current, notes: event.target.value }))}
                  />
                </label>

                <Button type="submit" className="w-full font-mono">
                  <Plus className="h-4 w-4" />
                  Save daily entry
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Activity className="h-5 w-5" />
                Recovery trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary) / 0.16)" />
                    <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--primary) / 0.35)',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="pain" name="Pain /10" stroke="#f97316" strokeWidth={3} dot />
                    <Line type="monotone" dataKey="dorsiflexion" name="Dorsiflexion" stroke="#22c55e" strokeWidth={3} dot />
                    <Line type="monotone" dataKey="plantarflexion" name="Plantarflexion" stroke="#38bdf8" strokeWidth={3} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {sortedLogs.slice(-4).reverse().map((log) => (
                  <div key={log.id} className="rounded-lg border border-primary/20 bg-background/60 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-primary">{log.date}</p>
                      <Badge variant={log.symptoms.length ? 'destructive' : 'outline'}>
                        {log.symptoms.length ? 'flagged' : 'clear'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pain {log.pain}/10 · ROM {log.dorsiflexion + log.plantarflexion}° · {log.exerciseMinutes} min
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{log.incision}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Dumbbell className="h-5 w-5" />
                Weekly physical therapy goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addTherapyGoal} className="mb-5 grid gap-3 md:grid-cols-[0.85fr_1.4fr_0.7fr_auto]">
                <Input
                  value={goalForm.week}
                  aria-label="Goal week"
                  onChange={(event) => setGoalForm((current) => ({ ...current, week: event.target.value }))}
                />
                <Input
                  value={goalForm.goal}
                  aria-label="Physical therapy goal"
                  placeholder="Add a PT goal for this week"
                  onChange={(event) => setGoalForm((current) => ({ ...current, goal: event.target.value }))}
                />
                <select
                  value={goalForm.status}
                  aria-label="Goal status"
                  onChange={(event) =>
                    setGoalForm((current) => ({ ...current, status: event.target.value as TherapyGoal['status'] }))
                  }
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="planned">Planned</option>
                  <option value="in-progress">In progress</option>
                  <option value="done">Done</option>
                </select>
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
              <div className="space-y-3">
                {therapyGoals.map((goal) => (
                  <div key={goal.id} className="rounded-lg border border-primary/20 bg-background/60 p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-primary/70">{goal.week}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{goal.goal}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTherapyGoals((current) => current.filter((item) => item.id !== goal.id))}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Delete ${goal.goal}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['planned', 'in-progress', 'done'] as TherapyGoal['status'][]).map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={goal.status === status ? 'default' : 'outline'}
                          onClick={() => updateGoalStatus(goal.id, status)}
                          className="capitalize"
                        >
                          {status.replace('-', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card id="symptoms" className="glass-card scroll-mt-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ThermometerSun className="h-5 w-5" />
                Surgeon discussion flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {flaggedLogs.length ? (
                flaggedLogs.map((log) => (
                  <div key={log.id} className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                    <p className="mb-2 text-sm font-semibold text-destructive">{log.date}</p>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {log.symptoms.map((symptom) => (
                        <Badge key={symptom} variant="destructive">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Incision: {log.incision}. Pain: {log.pain}/10. Note: {log.notes || 'No extra note.'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
                  <p className="text-sm text-muted-foreground">
                    No concerning symptoms are flagged in the current log history.
                  </p>
                </div>
              )}
              <div className="rounded-lg border border-primary/20 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-primary/70">Bring up immediately</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redness that spreads, warmth, drainage, fever, sharp calf pain, or swelling that is worse than
                  expected for your care plan.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="checkup" className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] scroll-mt-24">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <MessageSquarePlus className="h-5 w-5" />
                Orthopedic check-up questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={addQuestion} className="space-y-3">
                <Textarea
                  value={questionForm.question}
                  placeholder="Add a question to ask at your next appointment"
                  onChange={(event) => setQuestionForm((current) => ({ ...current, question: event.target.value }))}
                />
                <div className="flex flex-wrap gap-3">
                  <select
                    value={questionForm.priority}
                    aria-label="Question priority"
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        priority: event.target.value as CheckupQuestion['priority'],
                      }))
                    }
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="routine">Routine</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <Button type="submit">
                    <Plus className="h-4 w-4" />
                    Save question
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-primary">Appointment prep list</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question.id} className="rounded-lg border border-primary/20 bg-background/60 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <Badge
                        variant={question.priority === 'urgent' ? 'destructive' : question.priority === 'important' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {question.priority}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setQuestions((current) => current.filter((item) => item.id !== question.id))}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Delete ${question.question}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">{question.question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default RecoveryTracker;
