/**
 * Wordle — pure game logic, tech-themed word list.
 *
 * Rules: 6 attempts to guess a hidden 5-letter word. After each guess every
 * letter is marked correct (right position), present (wrong position), or
 * absent. Duplicate letters follow the standard Wordle rule: only as many
 * yellows as there are unmatched copies in the target.
 */

export type LetterState = "correct" | "present" | "absent" | "empty";
export type GameStatus = "playing" | "won" | "lost";

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const WORDS: string[] = [
  "react", "redux", "async", "await", "yield", "fetch", "parse", "query",
  "class", "scope", "const", "debug", "error", "throw", "catch", "array",
  "stack", "queue", "graph", "token", "bytes", "cache", "mutex", "proxy",
  "build", "clone", "merge", "patch", "model", "route", "index", "float",
  "frame", "event", "delta", "embed", "local", "typed", "regex", "mocha",
  "agile", "macro", "trait", "union", "tuple", "slice", "chunk", "alias",
  "loops", "ninja", "solid", "hooks", "fiber", "flaky", "inbox", "grpc",
  "linux", "shell", "stdin", "stdio", "mkdir", "chmod", "oauth", "crypt",
];

export interface Guess {
  word: string;
  states: LetterState[];
}

export interface GameState {
  target: string;
  guesses: Guess[];
  current: string;
  status: GameStatus;
  /** Best known state per letter across all guesses (correct > present > absent). */
  keyboard: Record<string, LetterState>;
}

function pickTarget(random: () => number): string {
  return WORDS[Math.floor(random() * WORDS.length)];
}

export function createGame(random: () => number = Math.random): GameState {
  return {
    target: pickTarget(random),
    guesses: [],
    current: "",
    status: "playing",
    keyboard: {},
  };
}

function mergeLetterState(existing: LetterState | undefined, next: LetterState): LetterState {
  const rank: Record<LetterState, number> = { correct: 3, present: 2, absent: 1, empty: 0 };
  return rank[next] > rank[existing ?? "empty"] ? next : (existing ?? "empty");
}

function evaluateGuess(target: string, guess: string): LetterState[] {
  const states: LetterState[] = Array(WORD_LENGTH).fill("absent");
  const targetPool: (string | null)[] = [...target];

  // First pass: exact matches.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) {
      states[i] = "correct";
      targetPool[i] = null;
    }
  }

  // Second pass: present-but-wrong-position.
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (states[i] !== "correct") {
      const idx = targetPool.indexOf(guess[i]);
      if (idx !== -1) {
        states[i] = "present";
        targetPool[idx] = null;
      }
    }
  }

  return states;
}

export function addLetter(state: GameState, letter: string): GameState {
  if (state.status !== "playing" || state.current.length >= WORD_LENGTH) return state;
  return { ...state, current: state.current + letter.toLowerCase() };
}

export function removeLetter(state: GameState): GameState {
  if (state.status !== "playing" || state.current.length === 0) return state;
  return { ...state, current: state.current.slice(0, -1) };
}

export function submitGuess(state: GameState): GameState {
  if (state.status !== "playing" || state.current.length !== WORD_LENGTH) return state;

  const word = state.current;
  const states = evaluateGuess(state.target, word);
  const guess: Guess = { word, states };

  const keyboard = { ...state.keyboard };
  for (let i = 0; i < WORD_LENGTH; i++) {
    keyboard[word[i]] = mergeLetterState(keyboard[word[i]], states[i]);
  }

  const guesses = [...state.guesses, guess];
  const won = states.every((s) => s === "correct");
  const status: GameStatus =
    won ? "won" : guesses.length >= MAX_GUESSES ? "lost" : "playing";

  return { ...state, guesses, current: "", keyboard, status };
}

/** Current guess rows including empty rows to fill to MAX_GUESSES. */
export function allRows(state: GameState): { word: string; states: LetterState[] | null }[] {
  const rows: { word: string; states: LetterState[] | null }[] = state.guesses.map((g) => ({
    word: g.word,
    states: g.states,
  }));

  if (state.status === "playing") {
    const padded = state.current.padEnd(WORD_LENGTH, " ");
    rows.push({ word: padded, states: null });
  }

  while (rows.length < MAX_GUESSES) {
    rows.push({ word: "     ", states: null });
  }

  return rows;
}
