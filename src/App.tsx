import { Suspense, lazy } from "react";

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="font-mono text-primary text-lg animate-pulse">{'> loading...'}</div>
  </div>
);
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import SEO from "./components/SEO";
import Index from "./pages/Index";

const queryClient = new QueryClient();
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
const Fractal = lazy(() => import("./pages/Fractal"));
const Piano = lazy(() => import("./pages/Piano"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route 
                path="/" 
                element={
                  <>
                    <SEO />
                    <Index />
                  </>
                } 
              />
              <Route 
                path="/now" 
                element={
                  <>
                    <SEO title="Now" path="/now" />
                    <Now />
                  </>
                } 
              />
              <Route 
                path="/hireme" 
                element={
                  <>
                    <SEO title="Hire Me" path="/hireme" />
                    <HireMe />
                  </>
                } 
              />
              <Route
                path="/toolkit"
                element={
                  <>
                    <SEO
                      title="Toolkit — Sports analytics & OSS"
                      path="/toolkit"
                      description="Public index of Ian Alloway’s sports ML stack, odds utilities, reporting tools, and GitHub repos — solvent-agent, ai-advantage, nba-ratings, kelly-js, juryrig, and more."
                    />
                    <Toolkit />
                  </>
                }
              />
              <Route
                path="/demos"
                element={
                  <>
                    <SEO
                      title="Live Demos — SOLVENT, kelly-js, sports ML"
                      path="/demos"
                      description="Working product demos: SOLVENT self-funding agent, kelly-js calculator, nba-edge Streamlit, sports-betting-ml, and AI Advantage."
                    />
                    <Demos />
                  </>
                }
              />
              <Route
                path="/bots"
                element={
                  <>
                    <SEO
                      title="How to Start the Bots — SOLVENT, juryrig, OpenClaw skills"
                      path="/bots"
                      description="Copy-paste commands to run SOLVENT, juryrig, and OpenClaw agent skills locally. No API keys needed for the SOLVENT demo."
                    />
                    <Bots />
                  </>
                }
              />
              <Route
                path="/snake"
                element={
                  <>
                    <SEO
                      title="Snake"
                      path="/snake"
                      description="Play a classic Snake game on Ian Alloway's site: keyboard controls, score tracking, food spawn, restart, and mobile-friendly controls."
                    />
                    <Snake />
                  </>
                }
              />
              <Route
                path="/recovery"
                element={
                  <>
                    <SEO
                      title="Ankle Surgery Recovery Tracker"
                      path="/recovery"
                      description="Track post-ankle surgery pain, incision notes, range-of-motion exercises, physical therapy goals, symptoms to discuss with a surgeon, and appointment questions."
                      noIndex
                    />
                    <RecoveryTracker />
                  </>
                }
              />
              <Route
                path="/kelly"
                element={
                  <>
                    <SEO
                      title="Kelly Criterion Calculator — optimal bet sizing"
                      path="/kelly"
                      description="Interactive Kelly Criterion calculator: enter win probability, decimal odds, and bankroll to get optimal bet size, expected value, and full / half / quarter Kelly stakes. Powered by kelly-js."
                    />
                    <Kelly />
                  </>
                }
              />
              <Route
                path="/consulting"
                element={
                  <>
                    <SEO
                      title="LLM Evaluation Consulting"
                      path="/consulting"
                      description="Ian Alloway — LLM evaluation consulting. Audit and calibrate your LLM-as-judge pipeline for position bias, verbosity bias, injection, and calibration drift. Backed by juryrig, a zero-dependency audit toolkit."
                    />
                    <Consulting />
                  </>
                }
              />
              <Route
                path="/nba-api"
                element={
                  <>
                    <SEO
                      title="NBA Edge API — 68.3% backtested accuracy, Kelly-sized"
                      path="/nba-api"
                      description="NBA Edge API: an XGBoost classifier with 68.3% backtested accuracy, Kelly criterion bet sizing, and REST delivery. Starter, Pro, and Team tiers. API-first sports predictions."
                    />
                    <NbaApi />
                  </>
                }
              />
              <Route
                path="/life"
                element={
                  <>
                    <SEO
                      title="Game of Life — Conway's cellular automaton"
                      path="/life"
                      description="Play Conway's Game of Life in the browser: click to draw cells, drop in gliders, spaceships, pulsars, and a Gosper glider gun, then watch the B3/S23 rules evolve the colony. Adjustable speed and a wrap-around toroidal grid."
                    />
                    <Life />
                  </>
                }
              />
              <Route
                path="/terminal"
                element={
                  <>
                    <SEO
                      title="Terminal — interactive shell"
                      path="/terminal"
                      description="An interactive in-browser terminal for ianalloway.xyz. Type commands like whoami, ls, projects, and open /life to explore Ian Alloway's work, links, and pages from a shell."
                    />
                    <Terminal />
                  </>
                }
              />
              <Route
                path="/wpm"
                element={
                  <>
                    <SEO
                      title="Typing Speed Test — words per minute"
                      path="/wpm"
                      description="A browser typing-speed test on ianalloway.xyz: type short lines and get live net/gross WPM, accuracy, a running timer, and per-character feedback. No backend, runs entirely client-side."
                    />
                    <Typing />
                  </>
                }
              />
              <Route
                path="/2048"
                element={
                  <>
                    <SEO
                      title="2048 — slide and merge puzzle"
                      path="/2048"
                      description="Play 2048 on ianalloway.xyz: slide tiles with arrow keys, WASD, or swipe to merge matching numbers and reach 2048. Score and best-score tracking, runs entirely client-side."
                    />
                    <Game2048 />
                  </>
                }
              />
              <Route
                path="/minesweeper"
                element={
                  <>
                    <SEO
                      title="Minesweeper — clear the board"
                      path="/minesweeper"
                      description="Play Minesweeper on ianalloway.xyz: first-click-safe mine placement, flood-fill reveals, flagging, and beginner/intermediate/expert boards with a live timer. Runs entirely client-side."
                    />
                    <Minesweeper />
                  </>
                }
              />
              <Route
                path="/playground"
                element={
                  <>
                    <SEO
                      title="Playground — interactive browser toys"
                      path="/playground"
                      description="A hub of client-side interactive demos on ianalloway.xyz: an interactive terminal, Minesweeper, 2048, a typing-speed test, Conway's Game of Life, and Snake. No backend — everything runs in your browser."
                    />
                    <Playground />
                  </>
                }
              />
              <Route
                path="/tetris"
                element={
                  <>
                    <SEO
                      title="Tetris — rotate and clear"
                      path="/tetris"
                      description="Play Tetris on ianalloway.xyz: rotate and place tetrominoes, hard-drop with Space, hold with C, and clear lines to level up. Score and level tracking, runs entirely client-side."
                    />
                    <Tetris />
                  </>
                }
              />
              <Route
                path="/wordle"
                element={
                  <>
                    <SEO
                      title="Wordle — guess the tech word"
                      path="/wordle"
                      description="A tech-themed Wordle on ianalloway.xyz: 6 tries to guess a hidden 5-letter programming or CS word. Green = right spot, yellow = wrong spot. Runs entirely client-side."
                    />
                    <Wordle />
                  </>
                }
              />
              <Route
                path="/sort"
                element={
                  <>
                    <SEO
                      title="Sort Visualizer — bubble, merge, quick, and more"
                      path="/sort"
                      description="Watch five classic sorting algorithms step through a shuffled array on ianalloway.xyz: bubble, insertion, selection, merge, and quicksort. Adjustable speed, step counter, comparison highlights. Runs entirely client-side."
                    />
                    <Sort />
                  </>
                }
              />
              <Route
                path="/breakout"
                element={
                  <>
                    <SEO
                      title="Breakout — clear the bricks"
                      path="/breakout"
                      description="Play Breakout on ianalloway.xyz: move the paddle with your mouse or arrow keys, keep the ball bouncing, and destroy 60 bricks across 6 color-coded rows. Canvas-based, runs entirely client-side."
                    />
                    <Breakout />
                  </>
                }
              />
              <Route
                path="/pathfind"
                element={
                  <>
                    <SEO
                      title="Pathfinding Visualizer — BFS and A★"
                      path="/pathfind"
                      description="Interactive pathfinding visualizer on ianalloway.xyz: draw walls on a grid and watch BFS or A★ find the shortest path step by step. Runs entirely client-side."
                    />
                    <Pathfind />
                  </>
                }
              />
              <Route
                path="/boids"
                element={
                  <>
                    <SEO
                      title="Boids — emergent flocking simulation"
                      path="/boids"
                      description="Watch emergent flocking behaviour on ianalloway.xyz: 120 boids follow three local rules — separation, alignment, and cohesion — to produce lifelike swarms. Click to spawn more. Runs entirely client-side."
                    />
                    <Boids />
                  </>
                }
              />
              <Route
                path="/maze"
                element={
                  <>
                    <SEO
                      title="Maze Generator — DFS carving and BFS solving"
                      path="/maze"
                      description="Watch a recursive-backtracker DFS carve a perfect 18×24 maze passage by passage, then see BFS trace the shortest path from start to end. Runs entirely client-side."
                    />
                    <Maze />
                  </>
                }
              />
              <Route
                path="/piano"
                element={
                  <>
                    <SEO
                      title="Piano Synthesizer — play two octaves in the browser"
                      path="/piano"
                      description="A two-octave Web Audio piano synthesizer on ianalloway.xyz. Click keys or use keyboard shortcuts to play C3–B4. Switch between sine, triangle, square, and sawtooth waveforms. Runs entirely client-side."
                    />
                    <Piano />
                  </>
                }
              />
              <Route
                path="/fractal"
                element={
                  <>
                    <SEO
                      title="Fractal Explorer — Mandelbrot set in the browser"
                      path="/fractal"
                      description="Explore the Mandelbrot set on ianalloway.xyz: scroll or click to zoom, drag to pan, right-click to zoom out. Three color palettes and adjustable iteration depth. Runs entirely client-side."
                    />
                    <Fractal />
                  </>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route
                path="*"
                element={
                  <>
                    <SEO title="Page not found" path="" />
                    <NotFound />
                  </>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
