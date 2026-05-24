import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import type { PTGoalWeek, RecoveryTrackerState } from "../types";
import { formatDisplayDate, newId, weekStartIso } from "../utils";

interface PTGoalsSectionProps {
  state: RecoveryTrackerState;
  onChange: (updater: (prev: RecoveryTrackerState) => RecoveryTrackerState) => void;
}

export function PTGoalsSection({ state, onChange }: PTGoalsSectionProps) {
  const currentWeek = weekStartIso();
  const week =
    state.ptGoalWeeks.find((w) => w.weekStart === currentWeek) ??
    ({
      id: newId(),
      weekStart: currentWeek,
      goals: [""],
      completed: [false],
    } satisfies PTGoalWeek);

  const [newGoal, setNewGoal] = useState("");

  const upsertWeek = (updated: PTGoalWeek) => {
    onChange((prev) => {
      const rest = prev.ptGoalWeeks.filter((w) => w.weekStart !== updated.weekStart);
      return { ...prev, ptGoalWeeks: [...rest, updated] };
    });
  };

  const addGoal = () => {
    const text = newGoal.trim();
    if (!text) {
      return;
    }
    const goals = [...week.goals.filter((g) => g.trim()), text];
    upsertWeek({
      ...week,
      id: week.id || newId(),
      goals,
      completed: goals.map((_, i) => week.completed[i] ?? false),
    });
    setNewGoal("");
  };

  const toggleGoal = (index: number) => {
    const completed = [...week.completed];
    completed[index] = !completed[index];
    upsertWeek({ ...week, id: week.id || newId(), completed });
  };

  const removeGoal = (index: number) => {
    const goals = week.goals.filter((_, i) => i !== index);
    const completed = week.completed.filter((_, i) => i !== index);
    upsertWeek({ ...week, id: week.id || newId(), goals, completed });
  };

  const pastWeeks = state.ptGoalWeeks
    .filter((w) => w.weekStart !== currentWeek && w.goals.some((g) => g.trim()))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  const doneCount = week.completed.filter(Boolean).length;
  const totalGoals = week.goals.filter((g) => g.trim()).length;

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-primary" />
            This week&apos;s PT goals
          </CardTitle>
          <CardDescription>
            Week of {formatDisplayDate(currentWeek)} — set targets with your physical therapist and
            check them off as you go.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalGoals > 0 && (
            <p className="text-sm text-muted-foreground">
              Progress: {doneCount} / {totalGoals} completed
            </p>
          )}

          <ul className="space-y-2">
            {week.goals
              .map((goal, index) => ({ goal, index }))
              .filter(({ goal }) => goal.trim())
              .map(({ goal, index }) => (
                <li
                  key={`${week.weekStart}-${index}`}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={week.completed[index] ?? false}
                    onChange={() => toggleGoal(index)}
                    className="accent-primary"
                  />
                  <span
                    className={
                      week.completed[index]
                        ? "flex-1 text-sm text-muted-foreground line-through"
                        : "flex-1 text-sm"
                    }
                  >
                    {goal}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => removeGoal(index)}>
                    Remove
                  </Button>
                </li>
              ))}
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="e.g. 10 min stationary bike, 3×10 towel stretch"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
            />
            <Button onClick={addGoal} className="shrink-0">
              Add goal
            </Button>
          </div>

          <Textarea
            placeholder="PT session notes for this week (optional)"
            value={week.notes ?? ""}
            onChange={(e) =>
              upsertWeek({ ...week, id: week.id || newId(), notes: e.target.value })
            }
            rows={2}
          />
        </CardContent>
      </Card>

      {pastWeeks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous weeks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pastWeeks.map((w) => {
              const total = w.goals.filter((g) => g.trim()).length;
              const done = w.completed.filter(Boolean).length;
              return (
                <div key={w.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">Week of {formatDisplayDate(w.weekStart)}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {done} / {total} goals completed
                  </p>
                  <ul className="list-inside list-disc text-sm text-muted-foreground">
                    {w.goals
                      .filter((g) => g.trim())
                      .map((g, i) => (
                        <li key={i} className={w.completed[i] ? "line-through" : ""}>
                          {g}
                        </li>
                      ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
