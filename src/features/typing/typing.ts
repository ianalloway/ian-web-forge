/**
 * Typing-speed test — pure scoring logic.
 *
 * Same shape as the snake/life/terminal feature modules: framework-free,
 * deterministic (injectable RNG for prompt selection), no rendering. The
 * React page in pages/Typing.tsx owns timing, keystrokes, and display.
 *
 * WPM uses the standard definition: one "word" = 5 characters, so
 * gross WPM = (typed chars / 5) / minutes elapsed. Net/accurate WPM
 * counts only correctly-typed characters.
 */

/** Short, on-theme prompts to type. */
export const PROMPTS: string[] = [
  "Evaluation-first machine learning systems survive contact with real users.",
  "A model that cannot be measured cannot be trusted in production.",
  "Ship it, watch it, fix it: the only loop that earns user trust over time.",
  "Calibrated probabilities beat confident guesses every single day.",
  "Kelly sizing turns a small edge into compounding growth without ruin.",
  "Good agents decline the work that does not clear margin.",
  "The green rain is just a canvas, but the discipline behind it is real.",
  "Walk-forward evaluation keeps backtests honest and leak-free.",
];

export interface TypingStats {
  /** Characters typed that match the target so far. */
  correctChars: number;
  /** Characters typed that do not match the target. */
  incorrectChars: number;
  /** Total characters typed. */
  typedChars: number;
  /** Fraction of the target completed, 0..1. */
  progress: number;
  /** Gross words-per-minute over all typed characters. */
  grossWpm: number;
  /** Net words-per-minute counting only correct characters. */
  netWpm: number;
  /** Correct / typed, 0..1 (1 when nothing typed yet). */
  accuracy: number;
  /** True once the full target has been typed. */
  complete: boolean;
}

function roundTo(value: number, places = 0): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * Score a typing attempt. `elapsedMs` is the time since the first
 * keystroke; pass 0 before timing starts.
 */
export function computeStats(target: string, typed: string, elapsedMs: number): TypingStats {
  const typedChars = typed.length;
  const compareLength = Math.min(typedChars, target.length);

  let correctChars = 0;
  for (let i = 0; i < compareLength; i += 1) {
    if (typed[i] === target[i]) {
      correctChars += 1;
    }
  }

  // Characters typed beyond the target length, or mismatches, count as wrong.
  const incorrectChars = typedChars - correctChars;

  const minutes = elapsedMs > 0 ? elapsedMs / 60000 : 0;
  const grossWpm = minutes > 0 ? roundTo(typedChars / 5 / minutes) : 0;
  const netWpm = minutes > 0 ? roundTo(Math.max(0, correctChars) / 5 / minutes) : 0;
  const accuracy = typedChars > 0 ? correctChars / typedChars : 1;

  return {
    correctChars,
    incorrectChars,
    typedChars,
    progress: target.length > 0 ? Math.min(1, typedChars / target.length) : 0,
    grossWpm,
    netWpm,
    accuracy,
    complete: typed.length >= target.length && typedChars > 0,
  };
}

export type CharState = "pending" | "correct" | "incorrect" | "current";

/**
 * Per-character display state for rendering the prompt with live feedback.
 * The character at the caret (next to type) is marked "current".
 */
export function charStates(target: string, typed: string): CharState[] {
  return Array.from(target, (char, index) => {
    if (index < typed.length) {
      return typed[index] === char ? "correct" : "incorrect";
    }
    if (index === typed.length) {
      return "current";
    }
    return "pending";
  });
}

/** Pick a prompt at random, optionally avoiding the current one. */
export function pickPrompt(random: () => number = Math.random, exclude?: string): string {
  const pool = exclude ? PROMPTS.filter((prompt) => prompt !== exclude) : PROMPTS;
  const choices = pool.length > 0 ? pool : PROMPTS;
  const index = Math.floor(random() * choices.length) % choices.length;
  return choices[index];
}
