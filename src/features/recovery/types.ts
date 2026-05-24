export type IncisionAppearance =
  | "healing-well"
  | "minor-redness"
  | "draining"
  | "concerning";

export const incisionLabels: Record<IncisionAppearance, string> = {
  "healing-well": "Healing well — clean & dry",
  "minor-redness": "Minor redness around edges",
  draining: "Draining or weeping",
  concerning: "Concerning — bleeding/opening",
};

export type RomExercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  notes?: string;
};

export const DEFAULT_EXERCISES: Pick<RomExercise, "name" | "sets" | "reps">[] = [
  { name: "Ankle pumps", sets: 3, reps: 20 },
  { name: "Alphabet tracing", sets: 2, reps: 1 },
  { name: "Towel scrunches", sets: 3, reps: 15 },
  { name: "Calf stretch (seated)", sets: 3, reps: 30 },
  { name: "Inversion / eversion", sets: 3, reps: 15 },
];

export type DailyLog = {
  /** ISO date string (YYYY-MM-DD), used as primary key. */
  date: string;
  /** Pain level 0-10. */
  pain: number;
  /** Subjective swelling 0-10. */
  swelling: number;
  /** Range-of-motion estimate 0-100% of normal. */
  romPercent: number;
  incision: IncisionAppearance;
  exercises: RomExercise[];
  notes: string;
  /** Symptom flags entered for this day. */
  redFlags: RedFlag[];
};

export type RedFlagType =
  | "redness-spreading"
  | "warmth-heat"
  | "unusual-swelling"
  | "fever"
  | "calf-pain"
  | "numbness-tingling"
  | "drainage-pus"
  | "pain-spike"
  | "other";

export const redFlagLabels: Record<RedFlagType, string> = {
  "redness-spreading": "Spreading redness around incision",
  "warmth-heat": "Warmth or heat at site",
  "unusual-swelling": "Unusual / increasing swelling",
  fever: "Fever or chills (>100.4°F)",
  "calf-pain": "Calf pain or tightness (DVT concern)",
  "numbness-tingling": "Numbness or tingling in foot/toes",
  "drainage-pus": "Drainage / pus from incision",
  "pain-spike": "Sudden severe pain spike",
  other: "Other concern",
};

export type RedFlag = {
  id: string;
  date: string;
  type: RedFlagType;
  notes: string;
  resolved: boolean;
};

export type WeeklyGoal = {
  id: string;
  /** ISO date for the Monday of the target week. */
  weekStart: string;
  text: string;
  done: boolean;
};

export type SurgeonQuestion = {
  id: string;
  text: string;
  /** Optional appointment date (ISO) the question is targeted for. */
  appointmentDate?: string;
  asked: boolean;
};

export type Appointment = {
  id: string;
  date: string;
  notes: string;
};

export type RecoveryState = {
  surgeryDate: string | null;
  logs: DailyLog[];
  goals: WeeklyGoal[];
  questions: SurgeonQuestion[];
  appointments: Appointment[];
};
