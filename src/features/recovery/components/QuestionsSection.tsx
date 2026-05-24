import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircleQuestion } from "lucide-react";
import type { AppointmentQuestion, QuestionPriority, RecoveryTrackerState } from "../types";
import { formatDisplayDate, newId } from "../utils";

interface QuestionsSectionProps {
  state: RecoveryTrackerState;
  onChange: (updater: (prev: RecoveryTrackerState) => RecoveryTrackerState) => void;
}

const PRIORITY_LABELS: Record<QuestionPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function QuestionsSection({ state, onChange }: QuestionsSectionProps) {
  const [question, setQuestion] = useState("");
  const [priority, setPriority] = useState<QuestionPriority>("medium");
  const [appointmentDate, setAppointmentDate] = useState("");

  const addQuestion = () => {
    const text = question.trim();
    if (!text) {
      return;
    }
    const item: AppointmentQuestion = {
      id: newId(),
      question: text,
      priority,
      appointmentDate: appointmentDate || undefined,
      asked: false,
      createdAt: new Date().toISOString(),
    };
    onChange((prev) => ({
      ...prev,
      appointmentQuestions: [item, ...prev.appointmentQuestions],
    }));
    setQuestion("");
    setAppointmentDate("");
  };

  const toggleAsked = (id: string) => {
    onChange((prev) => ({
      ...prev,
      appointmentQuestions: prev.appointmentQuestions.map((q) =>
        q.id === id ? { ...q, asked: !q.asked } : q,
      ),
    }));
  };

  const removeQuestion = (id: string) => {
    onChange((prev) => ({
      ...prev,
      appointmentQuestions: prev.appointmentQuestions.filter((q) => q.id !== id),
    }));
  };

  const pending = state.appointmentQuestions.filter((q) => !q.asked);
  const asked = state.appointmentQuestions.filter((q) => q.asked);

  const groupedPending = groupByAppointment(pending);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MessageCircleQuestion className="h-5 w-5 text-primary" />
            Orthopedic check-up questions
          </CardTitle>
          <CardDescription>
            Capture questions as they come up so nothing gets forgotten at your next appointment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="e.g. When can I drive? Is this swelling normal?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuestion()}
          />
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PRIORITY_LABELS) as QuestionPriority[]).map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={priority === p ? "default" : "outline"}
                onClick={() => setPriority(p)}
              >
                {PRIORITY_LABELS[p]} priority
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="appt-date" className="text-sm whitespace-nowrap">
              For appointment (optional):
            </label>
            <Input
              id="appt-date"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>
          <Button onClick={addQuestion}>Add question</Button>
        </CardContent>
      </Card>

      {Object.keys(groupedPending).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">To ask ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedPending).map(([group, items]) => (
              <div key={group}>
                <p className="mb-2 text-sm font-medium text-muted-foreground">{group}</p>
                <ul className="space-y-2">
                  {items.map((q) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      onToggle={() => toggleAsked(q.id)}
                      onRemove={() => removeQuestion(q.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {asked.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Already asked</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {asked.map((q) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  onToggle={() => toggleAsked(q.id)}
                  onRemove={() => removeQuestion(q.id)}
                  done
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function groupByAppointment(questions: AppointmentQuestion[]) {
  const groups: Record<string, AppointmentQuestion[]> = {};
  for (const q of questions) {
    const key = q.appointmentDate
      ? `Appointment: ${formatDisplayDate(q.appointmentDate)}`
      : "Any upcoming visit";
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(q);
  }
  const order = ["Any upcoming visit"];
  const sorted: Record<string, AppointmentQuestion[]> = {};
  for (const k of order) {
    if (groups[k]) {
      sorted[k] = groups[k];
    }
  }
  for (const k of Object.keys(groups).sort()) {
    if (!sorted[k]) {
      sorted[k] = groups[k];
    }
  }
  return sorted;
}

function QuestionRow({
  question,
  onToggle,
  onRemove,
  done,
}: {
  question: AppointmentQuestion;
  onToggle: () => void;
  onRemove: () => void;
  done?: boolean;
}) {
  return (
    <li
      className={`flex flex-wrap items-start gap-2 rounded-md border border-border px-3 py-2 ${done ? "opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        checked={question.asked}
        onChange={onToggle}
        className="mt-1 accent-primary"
        aria-label="Mark question as asked"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${done ? "line-through" : ""}`}>{question.question}</p>
        <p className="text-xs text-muted-foreground">
          {PRIORITY_LABELS[question.priority]} priority
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </li>
  );
}
