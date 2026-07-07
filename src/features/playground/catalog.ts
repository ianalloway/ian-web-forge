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
  | "gamepad"
  | "layers"
  | "type"
  | "chart"
  | "disc"
  | "navigation"
  | "wind"
  | "map";

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
  {
    path: "/tetris",
    title: "Tetris",
    blurb:
      "Rotate and place tetrominoes to clear lines. Hard-drop with Space, hold with C, ghost piece preview, and escalating speed across levels.",
    tag: "game",
    iconKey: "layers",
  },
  {
    path: "/wordle",
    title: "Wordle",
    blurb:
      "6 tries to guess a hidden 5-letter tech or programming word. Green = right position, yellow = wrong position.",
    tag: "game",
    iconKey: "type",
  },
  {
    path: "/sort",
    title: "Sort Visualizer",
    blurb:
      "Watch five classic algorithms — bubble, insertion, selection, merge, and quicksort — step through the same shuffled array. Adjustable speed, step counter, yellow highlights on comparisons.",
    tag: "sim",
    iconKey: "chart",
  },
  {
    path: "/breakout",
    title: "Breakout",
    blurb:
      "Canvas-based Breakout: move the paddle with your mouse or arrow keys, keep the ball bouncing, and clear 60 bricks across 6 colored rows. Speed ramps as you score.",
    tag: "game",
    iconKey: "disc",
  },
  {
    path: "/pathfind",
    title: "Pathfinding",
    blurb:
      "Draw walls on a grid and watch BFS or A★ find the shortest path step by step. See how A★'s heuristic focuses the search compared to BFS's even wavefront.",
    tag: "sim",
    iconKey: "navigation",
  },
  {
    path: "/boids",
    title: "Boids",
    blurb:
      "120 agents, three local rules — separation, alignment, and cohesion — producing emergent flocking. Click the canvas to spawn more boids mid-sim.",
    tag: "sim",
    iconKey: "wind",
  },
  {
    path: "/maze",
    title: "Maze Generator",
    blurb:
      "Recursive-backtracker DFS carves a perfect 18×24 maze one passage at a time. Then watch BFS trace the shortest path from S to E.",
    tag: "sim",
    iconKey: "map",
  },
];

export const TAG_LABELS: Record<PlaygroundTag, string> = {
  game: "game",
  tool: "tool",
  sim: "sim",
};
