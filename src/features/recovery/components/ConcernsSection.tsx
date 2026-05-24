import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  CONCERN_SYMPTOM_LABELS,
  type ConcernFlag,
  type ConcernSeverity,
  type ConcernSymptomKey,
  type RecoveryTrackerState,
} from "../types";
import { formatDisplayDate, newId, todayIso } from "../utils";

interface ConcernsSectionProps {
  state: RecoveryTrackerState;
  onChange: (updater: (prev: RecoveryTrackerState) => RecoveryTrackerState) => void;
}

const SEVERITY_LABELS: Record<ConcernSeverity, string> = {
  monitor: "Monitor at home",
  discuss_soon: "Discuss at next visit",
  urgent: "Contact surgeon soon",
};

const SEVERITY_VARIANT: Record<
  ConcernSeverity,
  "outline" | "secondary" | "destructive"
> = {
  monitor: "outline",
  discuss_soon: "secondary",
  urgent: "destructive",
};

const emptySymptoms = (): Partial<Record<ConcernSymptomKey, boolean>> => ({});

export function ConcernsSection({ state, onChange }: ConcernsSectionProps) {
  const [symptoms, setSymptoms] = useState(emptySymptoms);
  const [otherSymptom, setOtherSymptom] = useState("");
  const [severity, setSeverity] = useState<ConcernSeverity>("discuss_soon");
  const [notes, setNotes] = useState("");

  const addFlag = () => {
    const hasSymptom =
      Object.values(symptoms).some(Boolean) || otherSymptom.trim().length > 0;
    if (!hasSymptom) {
      return;
    }
    const flag: ConcernFlag = {
      id: newId(),
      date: todayIso(),
      symptoms,
      otherSymptom: otherSymptom.trim() || undefined,
      severity,
      notes: notes.trim() || undefined,
      discussedWithSurgeon: false,
    };
    onChange((prev) => ({
      ...prev,
      concernFlags: [flag, ...prev.concernFlags],
    }));
    setSymptoms(emptySymptoms());
    setOtherSymptom("");
    setNotes("");
    setSeverity("discuss_soon");
  };

  const toggleDiscussed = (id: string) => {
    onChange((prev) => ({
      ...prev,
      concernFlags: prev.concernFlags.map((c) =>
        c.id === id ? { ...c, discussedWithSurgeon: !c.discussedWithSurgeon } : c,
      ),
    }));
  };

  const removeFlag = (id: string) => {
    onChange((prev) => ({
      ...prev,
      concernFlags: prev.concernFlags.filter((c) => c.id !== id),
    }));
  };

  const active = state.concernFlags.filter((c) => !c.discussedWithSurgeon);
  const resolved = state.concernFlags.filter((c) => c.discussedWithSurgeon);

  const symptomList = (flag: ConcernFlag) => {
    const named = (Object.keys(CONCERN_SYMPTOM_LABELS) as ConcernSymptomKey[])
      .filter((k) => flag.symptoms[k])
      .map((k) => CONCERN_SYMPTOM_LABELS[k]);
    if (flag.otherSymptom) {
      named.push(flag.otherSymptom);
    }
    return named;
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Flag concerning symptoms
          </CardTitle>
          <CardDescription>
            Track redness, heat, unusual swelling, or other warning signs to bring up with your
            surgeon. This tool does not replace medical advice — call your care team for urgent
            symptoms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(CONCERN_SYMPTOM_LABELS) as ConcernSymptomKey[]).map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={symptoms[key] ?? false}
                  onChange={(e) =>
                    setSymptoms((s) => ({ ...s, [key]: e.target.checked }))
                  }
                  className="mt-0.5 accent-destructive"
                />
                {CONCERN_SYMPTOM_LABELS[key]}
              </label>
            ))}
          </div>

          <Textarea
            placeholder="Other symptom to discuss (optional)"
            value={otherSymptom}
            onChange={(e) => setOtherSymptom(e.target.value)}
            rows={2}
          />

          <div>
            <p className="mb-2 text-sm font-medium">How concerned are you?</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(SEVERITY_LABELS) as ConcernSeverity[]).map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={severity === s ? "default" : "outline"}
                  onClick={() => setSeverity(s)}
                >
                  {SEVERITY_LABELS[s]}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Notes (when it started, what makes it better/worse)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <Button variant="destructive" onClick={addFlag}>
            Save concern flag
          </Button>
        </CardContent>
      </Card>

      {active.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Open — discuss with surgeon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {active.map((flag) => (
              <ConcernCard
                key={flag.id}
                flag={flag}
                symptomList={symptomList(flag)}
                onDiscuss={() => toggleDiscussed(flag.id)}
                onRemove={() => removeFlag(flag.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Discussed with care team
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.map((flag) => (
              <ConcernCard
                key={flag.id}
                flag={flag}
                symptomList={symptomList(flag)}
                onDiscuss={() => toggleDiscussed(flag.id)}
                onRemove={() => removeFlag(flag.id)}
                resolved
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConcernCard({
  flag,
  symptomList,
  onDiscuss,
  onRemove,
  resolved,
}: {
  flag: ConcernFlag;
  symptomList: string[];
  onDiscuss: () => void;
  onRemove: () => void;
  resolved?: boolean;
}) {
  return (
    <div
      className={`rounded-md border p-3 ${resolved ? "border-border opacity-75" : "border-destructive/40 bg-destructive/5"}`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-medium">{formatDisplayDate(flag.date)}</span>
        <Badge variant={SEVERITY_VARIANT[flag.severity]}>{SEVERITY_LABELS[flag.severity]}</Badge>
      </div>
      <ul className="mb-2 list-inside list-disc text-sm">
        {symptomList.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {flag.notes && <p className="mb-2 text-sm text-muted-foreground">{flag.notes}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={resolved ? "outline" : "secondary"} onClick={onDiscuss}>
          {resolved ? "Mark as open" : "Mark discussed"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </div>
  );
}
