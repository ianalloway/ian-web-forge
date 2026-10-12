export type ExperimentCategory =
  | "decisions"
  | "ml"
  | "algorithms"
  | "systems"
  | "simulation"
  | "generative"
  | "play";

export const CATEGORIES: { id: ExperimentCategory; label: string; blurb: string }[] = [
  {
    id: "decisions",
    label: "Evaluation & decisions",
    blurb: "Judging judges, sizing bets, and reading a number for what it is actually worth.",
  },
  {
    id: "ml",
    label: "Machine learning & statistics",
    blurb: "Models you can watch fit, overfit, sample, and converge.",
  },
  {
    id: "algorithms",
    label: "Algorithms",
    blurb: "Search, geometry, and dynamic programming, one step at a time.",
  },
  {
    id: "systems",
    label: "Systems & encoding",
    blurb: "The data structures and codes underneath caches, compressors, and networks.",
  },
  {
    id: "simulation",
    label: "Simulation & physics",
    blurb: "Integrators, phase transitions, and crowds that organise themselves.",
  },
  {
    id: "generative",
    label: "Emergence & generative",
    blurb: "Simple local rules, surprisingly complicated pictures.",
  },
  {
    id: "play",
    label: "Play",
    blurb: "Small games, built from scratch.",
  },
];
