import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  Download,
  LayoutDashboard,
  MessageCircleQuestion,
  Upload,
} from "lucide-react";
import MatrixRain from "@/components/MatrixRain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { applyTheme, getStoredTheme, type SiteTheme } from "@/lib/theme";
import {
  exportRecoveryData,
  importRecoveryData,
  useRecoveryTracker,
} from "@/features/recovery/storage";
import { RecoveryChart } from "@/features/recovery/components/RecoveryChart";
import { DailyLogSection } from "@/features/recovery/components/DailyLogSection";
import { PTGoalsSection } from "@/features/recovery/components/PTGoalsSection";
import { ConcernsSection } from "@/features/recovery/components/ConcernsSection";
import { QuestionsSection } from "@/features/recovery/components/QuestionsSection";
import {
  activeConcerns,
  buildTrendSeries,
  daysPostOp,
  entryForDate,
  pendingQuestions,
  todayIso,
} from "@/features/recovery/utils";

type TabId = "overview" | "daily" | "pt" | "concerns" | "questions";

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "daily", label: "Daily log", icon: ClipboardList },
  { id: "pt", label: "PT goals", icon: Activity },
  { id: "concerns", label: "Concerns", icon: AlertTriangle },
  { id: "questions", label: "Questions", icon: MessageCircleQuestion },
];

export default function RecoveryTracker() {
  const { state, update, setSurgeryDate, resetAll, hydrated } = useRecoveryTracker();
  const [tab, setTab] = useState<TabId>("overview");
  const [theme] = useState<SiteTheme>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const postOpDays = daysPostOp(state.surgeryDate);
  const trend = buildTrendSeries(state.dailyEntries, state.surgeryDate);
  const todayEntry = entryForDate(state.dailyEntries, todayIso());
  const openConcerns = activeConcerns(state);
  const openQuestions = pendingQuestions(state);

  const avgPain =
    trend.length > 0
      ? (trend.reduce((s, p) => s + p.pain, 0) / trend.length).toFixed(1)
      : null;

  const handleExport = () => {
    const blob = new Blob([exportRecoveryData(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ankle-recovery-${todayIso()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      const text = await file.text();
      const imported = importRecoveryData(text);
      if (imported) {
        update(() => imported);
      }
    };
    input.click();
  };

  if (!hydrated) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <MatrixRain />
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 pb-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4" />
              Import
            </Button>
          </div>
        </div>

        <header className="mb-8">
          <h1 className="font-mono text-3xl font-bold tracking-tight text-primary md:text-4xl">
            Ankle recovery tracker
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Log daily pain, incision checks, and ROM exercises; track PT goals; flag symptoms for
            your surgeon; and organize questions for orthopedic follow-ups. Data stays in your
            browser only.
          </p>
        </header>

        <Card className="mb-6 border-primary/25">
          <CardContent className="flex flex-wrap items-end gap-4 pt-6">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="surgery-date" className="mb-1 block text-sm font-medium">
                Surgery date
              </label>
              <Input
                id="surgery-date"
                type="date"
                value={state.surgeryDate ?? ""}
                onChange={(e) => setSurgeryDate(e.target.value || undefined)}
              />
            </div>
            {postOpDays !== null && (
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{postOpDays}</p>
                <p className="text-xs text-muted-foreground">days post-op</p>
              </div>
            )}
            {todayEntry && (
              <Badge variant="secondary">Today logged · pain {todayEntry.painLevel}/10</Badge>
            )}
            {openConcerns.length > 0 && (
              <Badge variant="destructive">{openConcerns.length} open concern(s)</Badge>
            )}
            {openQuestions.length > 0 && (
              <Badge variant="outline">{openQuestions.length} question(s) pending</Badge>
            )}
          </CardContent>
        </Card>

        <nav
          className="mb-6 flex flex-wrap gap-2 border-b border-border pb-2"
          aria-label="Recovery sections"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={tab === id ? "default" : "ghost"}
              size="sm"
              onClick={() => setTab(id)}
              className="gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </nav>

        {tab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recovery trends</CardTitle>
                <CardDescription>
                  Pain level (0–10) and percentage of ROM exercises completed each logged day.
                  {avgPain !== null && ` Average pain: ${avgPain}/10.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecoveryChart data={trend} />
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Days logged" value={String(state.dailyEntries.length)} />
              <StatCard
                label="Latest pain"
                value={
                  trend.length > 0 ? `${trend[trend.length - 1].pain}/10` : "—"
                }
              />
              <StatCard
                label="Latest ROM"
                value={
                  trend.length > 0 ? `${trend[trend.length - 1].romPercent}%` : "—"
                }
              />
            </div>

            {openConcerns.length > 0 && (
              <Card className="border-destructive/40">
                <CardHeader>
                  <CardTitle className="text-destructive">Symptoms to discuss</CardTitle>
                  <CardDescription>
                    {openConcerns.length} open flag(s) — review in the Concerns tab.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <p className="text-center text-xs text-muted-foreground">
              Not medical advice. Contact your surgeon or go to the ER for emergencies.
            </p>
          </div>
        )}

        {tab === "daily" && <DailyLogSection state={state} onChange={update} />}
        {tab === "pt" && <PTGoalsSection state={state} onChange={update} />}
        {tab === "concerns" && <ConcernsSection state={state} onChange={update} />}
        {tab === "questions" && <QuestionsSection state={state} onChange={update} />}

        <div className="mt-12 text-center">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={resetAll}>
            Clear all local data
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <p className="text-2xl font-bold text-primary">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
