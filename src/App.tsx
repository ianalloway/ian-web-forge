import { Suspense, lazy, type ComponentProps, type ElementType } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SEO from "./components/SEO";
import Index from "./pages/Index";

const Now = lazy(() => import("./pages/Now"));
const HireMe = lazy(() => import("./pages/HireMe"));
const Toolkit = lazy(() => import("./pages/Toolkit"));
const Demos = lazy(() => import("./pages/Demos"));
const Bots = lazy(() => import("./pages/Bots"));
const NbaApi = lazy(() => import("./pages/NbaApi"));
const Consulting = lazy(() => import("./pages/Consulting"));
const Snake = lazy(() => import("./pages/Snake"));
const Life = lazy(() => import("./pages/Life"));
const Terminal = lazy(() => import("./pages/Terminal"));
const Typing = lazy(() => import("./pages/Typing"));
const Game2048 = lazy(() => import("./pages/Game2048"));
const Minesweeper = lazy(() => import("./pages/Minesweeper"));
const Playground = lazy(() => import("./pages/Playground"));
const RecoveryTracker = lazy(() => import("./pages/RecoveryTracker"));
const Kelly = lazy(() => import("./pages/Kelly"));
const Tetris = lazy(() => import("./pages/Tetris"));
const Wordle = lazy(() => import("./pages/Wordle"));
const Sort = lazy(() => import("./pages/Sort"));
const Breakout = lazy(() => import("./pages/Breakout"));
const Pathfind = lazy(() => import("./pages/Pathfind"));
const Boids = lazy(() => import("./pages/Boids"));
const Maze = lazy(() => import("./pages/Maze"));
const Piano = lazy(() => import("./pages/Piano"));
const NotFound = lazy(() => import("./pages/NotFound"));

type RouteConfig = {
  path: string;
  Component: ElementType;
  seo?: Omit<ComponentProps<typeof SEO>, "path">;
};

const routes = [
  { path: "/", Component: Index },
  { path: "/now", Component: Now, seo: { title: "Now" } },
  { path: "/hireme", Component: HireMe, seo: { title: "Hire Me" } },
  {
    path: "/toolkit",
    Component: Toolkit,
    seo: {
      title: "Toolkit — Sports analytics & OSS",
      description: "Public index of Ian Alloway’s sports ML stack, odds utilities, reporting tools, and GitHub repos — solvent-agent, ai-advantage, nba-ratings, kelly-js, juryrig, and more.",
    },
  },
  {
    path: "/demos",
    Component: Demos,
    seo: {
      title: "Live Demos — SOLVENT, kelly-js, sports ML",
      description: "Working product demos: SOLVENT self-funding agent, kelly-js calculator, nba-edge Streamlit, sports-betting-ml, and AI Advantage.",
    },
  },
  {
    path: "/bots",
    Component: Bots,
    seo: {
      title: "How to Start the Bots — SOLVENT, juryrig, OpenClaw skills",
      description: "Copy-paste commands to run SOLVENT, juryrig, and OpenClaw agent skills locally. No API keys needed for the SOLVENT demo.",
    },
  },
  { path: "/snake", Component: Snake, seo: { title: "Snake", description: "Play a classic Snake game on Ian Alloway's site: keyboard controls, score tracking, food spawn, restart, and mobile-friendly controls." } },
  { path: "/recovery", Component: RecoveryTracker, seo: { title: "Ankle Surgery Recovery Tracker", description: "Track post-ankle surgery pain, incision notes, range-of-motion exercises, physical therapy goals, symptoms to discuss with a surgeon, and appointment questions.", noIndex: true } },
  { path: "/kelly", Component: Kelly, seo: { title: "Kelly Criterion Calculator — optimal bet sizing", description: "Interactive Kelly Criterion calculator: enter win probability, decimal odds, and bankroll to get optimal bet size, expected value, and full / half / quarter Kelly stakes. Powered by kelly-js." } },
  { path: "/consulting", Component: Consulting, seo: { title: "LLM Evaluation Consulting", description: "Ian Alloway — LLM evaluation consulting. Audit and calibrate your LLM-as-judge pipeline for position bias, verbosity bias, injection, and calibration drift. Backed by juryrig, a zero-dependency audit toolkit." } },
  { path: "/nba-api", Component: NbaApi, seo: { title: "NBA Edge API — 68.3% backtested accuracy, Kelly-sized", description: "NBA Edge API: an XGBoost classifier with 68.3% backtested accuracy, Kelly criterion bet sizing, and REST delivery. Starter, Pro, and Team tiers. API-first sports predictions." } },
  { path: "/life", Component: Life, seo: { title: "Game of Life — Conway's cellular automaton", description: "Play Conway's Game of Life in the browser: click to draw cells, drop in gliders, spaceships, pulsars, and a Gosper glider gun, then watch the B3/S23 rules evolve the colony. Adjustable speed and a wrap-around toroidal grid." } },
  { path: "/terminal", Component: Terminal, seo: { title: "Terminal — interactive shell", description: "An interactive in-browser terminal for ianalloway.xyz. Type commands like whoami, ls, projects, and open /life to explore Ian Alloway's work, links, and pages from a shell." } },
  { path: "/wpm", Component: Typing, seo: { title: "Typing Speed Test — words per minute", description: "A browser typing-speed test on ianalloway.xyz: type short lines and get live net/gross WPM, accuracy, a running timer, and per-character feedback. No backend, runs entirely client-side." } },
  { path: "/2048", Component: Game2048, seo: { title: "2048 — slide and merge puzzle", description: "Play 2048 on ianalloway.xyz: slide tiles with arrow keys, WASD, or swipe to merge matching numbers and reach 2048. Score and best-score tracking, runs entirely client-side." } },
  { path: "/minesweeper", Component: Minesweeper, seo: { title: "Minesweeper — clear the board", description: "Play Minesweeper on ianalloway.xyz: first-click-safe mine placement, flood-fill reveals, flagging, and beginner/intermediate/expert boards with a live timer. Runs entirely client-side." } },
  { path: "/playground", Component: Playground, seo: { title: "Playground — interactive browser toys", description: "A hub of client-side interactive demos on ianalloway.xyz: an interactive terminal, Minesweeper, 2048, a typing-speed test, Conway's Game of Life, and Snake. No backend — everything runs in your browser." } },
  { path: "/tetris", Component: Tetris, seo: { title: "Tetris — rotate and clear", description: "Play Tetris on ianalloway.xyz: rotate and place tetrominoes, hard-drop with Space, hold with C, and clear lines to level up. Score and level tracking, runs entirely client-side." } },
  { path: "/wordle", Component: Wordle, seo: { title: "Wordle — guess the tech word", description: "A tech-themed Wordle on ianalloway.xyz: 6 tries to guess a hidden 5-letter programming or CS word. Green = right spot, yellow = wrong spot. Runs entirely client-side." } },
  { path: "/sort", Component: Sort, seo: { title: "Sort Visualizer — bubble, merge, quick, and more", description: "Watch five classic sorting algorithms step through a shuffled array on ianalloway.xyz: bubble, insertion, selection, merge, and quicksort. Adjustable speed, step counter, comparison highlights. Runs entirely client-side." } },
  { path: "/breakout", Component: Breakout, seo: { title: "Breakout — clear the bricks", description: "Play Breakout on ianalloway.xyz: move the paddle with your mouse or arrow keys, keep the ball bouncing, and destroy 60 bricks across 6 color-coded rows. Canvas-based, runs entirely client-side." } },
  { path: "/pathfind", Component: Pathfind, seo: { title: "Pathfinding Visualizer — BFS and A★", description: "Interactive pathfinding visualizer on ianalloway.xyz: draw walls on a grid and watch BFS or A★ find the shortest path step by step. Runs entirely client-side." } },
  { path: "/boids", Component: Boids, seo: { title: "Boids — emergent flocking simulation", description: "Watch emergent flocking behaviour on ianalloway.xyz: 120 boids follow three local rules — separation, alignment, and cohesion — to produce lifelike swarms. Click to spawn more. Runs entirely client-side." } },
  { path: "/maze", Component: Maze, seo: { title: "Maze Generator — DFS carving and BFS solving", description: "Watch a recursive-backtracker DFS carve a perfect 18×24 maze passage by passage, then see BFS trace the shortest path from start to end. Runs entirely client-side." } },
  { path: "/piano", Component: Piano, seo: { title: "Piano Synthesizer — play two octaves in the browser", description: "A two-octave Web Audio piano synthesizer on ianalloway.xyz. Click keys or use keyboard shortcuts to play C3–B4. Switch between sine, triangle, square, and sawtooth waveforms. Runs entirely client-side." } },
  { path: "*", Component: NotFound, seo: { title: "Page not found", noIndex: true } },
] satisfies RouteConfig[];

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="font-mono text-primary text-lg animate-pulse">{"> loading..."}</div>
  </div>
);

function RoutedPage({ path, Component, seo }: RouteConfig) {
  return (
    <>
      <SEO path={path === "*" ? "" : path} {...seo} />
      <Component />
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {routes.map((route) => (
              <Route key={route.path} path={route.path} element={<RoutedPage {...route} />} />
            ))}
          </Routes>
        </Suspense>
      </BrowserRouter>
    </HelmetProvider>
  );
}
