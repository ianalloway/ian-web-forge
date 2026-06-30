/**
 * Playground catalog — the single source of truth for the site's
 * client-side interactive demos. Consumed by the /playground hub page and
 * the Playground section on /demos so the two never drift apart.
 *
 * Pure data only (no JSX); the views map `iconKey` to a lucide icon.
 */

export type PlaygroundTag = "game" | "tool" | "sim";

export type PlaygroundIcon =
  | "terminal"
  | "bomb"
  | "hash"
  | "keyboard"
  | "sparkles"
  | "gamepad";

export interface PlaygroundItem {
  /** Internal SPA route. */
  path: string;
  title: string;
  blurb: string;
  tag: PlaygroundTag;
  iconKey: PlaygroundIcon;
}

export const PLAYGROUND_ITEMS: PlaygroundItem[] = [
  {
    path: "/terminal",
    title: "Terminal",
    blurb:
      "An interactive shell for the site — type whoami, ls, projects, or open /life. Tab-completion and command history included.",
    tag: "tool",
    iconKey: "terminal",
  },
  {
    path: "/minesweeper",
    title: "Minesweeper",
    blurb:
      "Clear the board without hitting a mine — first-click-safe, flood-fill reveals, flagging, and beginner/intermediate/expert boards with a timer.",
    tag: "game",
    iconKey: "bomb",
  },
  {
    path: "/2048",
    title: "2048",
    blurb:
      "Slide and merge matching tiles to reach 2048. Arrow keys, WASD, or swipe — with score and best-score tracking.",
    tag: "game",
    iconKey: "hash",
  },
  {
    path: "/wpm",
    title: "Typing Speed Test",
    blurb:
      "Measure your WPM and accuracy on short, on-theme lines. Live net/gross WPM, a running timer, and per-character feedback.",
    tag: "tool",
    iconKey: "keyboard",
  },
  {
    path: "/life",
    title: "Game of Life",
    blurb:
      "Conway's cellular automaton — draw cells, drop in gliders and a glider gun, and watch the B3/S23 rules play out on a wrap-around grid.",
    tag: "sim",
    iconKey: "sparkles",
  },
  {
    path: "/snake",
    title: "Snake",
    blurb:
      "The classic — grid movement, food, growth, score, and crash state. Arrow keys or WASD, space to pause.",
    tag: "game",
    iconKey: "gamepad",
  },
];

export const TAG_LABELS: Record<PlaygroundTag, string> = {
  game: "game",
  tool: "tool",
  sim: "sim",
};
