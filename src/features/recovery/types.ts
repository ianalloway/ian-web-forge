export type IncisionAppearance =
  | "clean_dry"
  | "mild_redness"
  | "scab_forming"
  | "bruising"
  | "drainage"
  | "other";

export const INCISION_LABELS: Record<IncisionAppearance, string> = {
  clean_dry: "Clean & dry",
  mild_redness: "Mild redness (expected)",
  scab_forming: "Scab forming",
  bruising: "Bruising around incision",
  drainage: "Drainage / oozing",
  other: "Other (see notes)",
};

export type RomExerciseKey =
  | "anklePumps"
  | "alphabet"
  | "towelStretch"
  | "calfStretch"
  | "heelSlides"
  | "balance";

export const ROM_EXERCISE_LABELS: Record<RomExerciseKey, string> = {
  anklePumps: "Ankle pumps",
  alphabet: "Ankle alphabet (A–Z)",
  towelStretch: "Towel stretch",
  calfStretch: "Calf stretch",
  heelSlides: "Heel slides",
  balance: "Supported balance / weight shift",
};

export type RomExercises = Record<RomExerciseKey, boolean>;

export interface DailyEntry {
  id: string;
  date: string;
  painLevel: number;
  incisionAppearance: IncisionAppearance;
  incisionNotes?: string;
  romExercises: RomExercises;
  romMinutes?: number;
  notes?: string;
}

export interface PTGoalWeek {
  id: string;
  weekStart: string;
  goals: string[];
  completed: boolean[];
  notes?: string;
}

export type ConcernSymptomKey =
  | "redness"
  | "heat"
  | "unusualSwelling"
  | "fever"
  | "increasedPain"
  | "numbness"
  | "odor"
  | "drainage";

export const CONCERN_SYMPTOM_LABELS: Record<ConcernSymptomKey, string> = {
  redness: "Redness spreading from incision",
  heat: "Heat at incision site",
  unusualSwelling: "Unusual or worsening swelling",
  fever: "Fever or chills",
  increasedPain: "Sudden increase in pain",
  numbness: "New numbness or tingling",
  odor: "Foul odor from incision",
  drainage: "Heavy or pus-like drainage",
};

export type ConcernSeverity = "monitor" | "discuss_soon" | "urgent";

export interface ConcernFlag {
  id: string;
  date: string;
  symptoms: Partial<Record<ConcernSymptomKey, boolean>>;
  otherSymptom?: string;
  severity: ConcernSeverity;
  notes?: string;
  discussedWithSurgeon: boolean;
}

export type QuestionPriority = "low" | "medium" | "high";

export interface AppointmentQuestion {
  id: string;
  question: string;
  priority: QuestionPriority;
  appointmentDate?: string;
  asked: boolean;
  createdAt: string;
}

export interface RecoveryTrackerState {
  surgeryDate?: string;
  dailyEntries: DailyEntry[];
  ptGoalWeeks: PTGoalWeek[];
  concernFlags: ConcernFlag[];
  appointmentQuestions: AppointmentQuestion[];
}

export const EMPTY_ROM: RomExercises = {
  anklePumps: false,
  alphabet: false,
  towelStretch: false,
  calfStretch: false,
  heelSlides: false,
  balance: false,
};

export const DEFAULT_STATE: RecoveryTrackerState = {
  dailyEntries: [],
  ptGoalWeeks: [],
  concernFlags: [],
  appointmentQuestions: [],
};
