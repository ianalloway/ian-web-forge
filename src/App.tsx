import { Suspense, lazy } from "react";

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="font-mono text-primary text-lg animate-pulse">{'> loading...'}</div>
  </div>
);
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import SEO from "./components/SEO";
import Index from "./pages/Index";

const Now = lazy(() => import("./pages/Now"));
const HireMe = lazy(() => import("./pages/HireMe"));
const Toolkit = lazy(() => import("./pages/Toolkit"));
const Demos = lazy(() => import("./pages/Demos"));
const Bots = lazy(() => import("./pages/Bots"));
const Kelly = lazy(() => import("./pages/Kelly"));
const Dla = lazy(() => import("./pages/Dla"));
const Lorenz = lazy(() => import("./pages/Lorenz"));
const Gravity = lazy(() => import("./pages/Gravity"));
const Ascii = lazy(() => import("./pages/Ascii"));
const Type = lazy(() => import("./pages/Type"));
const Sort = lazy(() => import("./pages/Sort"));
const Life = lazy(() => import("./pages/Life"));
const Boids = lazy(() => import("./pages/Boids"));
const Path = lazy(() => import("./pages/Path"));
const Snake = lazy(() => import("./pages/Snake"));
const Pendulum = lazy(() => import("./pages/Pendulum"));
const Flow = lazy(() => import("./pages/Flow"));
const Cipher = lazy(() => import("./pages/Cipher"));
const Regress = lazy(() => import("./pages/Regress"));
const Cluster = lazy(() => import("./pages/Cluster"));
const Pi = lazy(() => import("./pages/Pi"));
const Game2048 = lazy(() => import("./pages/Game2048"));
const Waves = lazy(() => import("./pages/Waves"));
const Markov = lazy(() => import("./pages/Markov"));
const Mines = lazy(() => import("./pages/Mines"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <HelmetProvider>
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
            path="/dla"
            element={
              <>
                <SEO
                  title="Diffusion-Limited Aggregation — grow fractal crystals"
                  path="/dla"
                  description="Random-walking particles freeze on contact to grow dendritic fractals — the process behind frost, coral, mineral deposits, and lightning. Seed from a center or a floor."
                />
                <Dla />
              </>
            }
          />
          <Route
            path="/lorenz"
            element={
              <>
                <SEO
                  title="Lorenz Attractor — the butterfly of chaos"
                  path="/lorenz"
                  description="Integrate the Lorenz equations with RK4 and watch three trajectories starting 0.001 apart trace the butterfly yet diverge — deterministic chaos in a rotating 3D orbit."
                />
                <Lorenz />
              </>
            }
          />
          <Route
            path="/gravity"
            element={
              <>
                <SEO
                  title="Gravity Sandbox — N-body simulator"
                  path="/gravity"
                  description="Interactive N-body gravity sandbox: launch bodies, watch orbits form, and simulate binary stars, solar systems, and figure-8 choreographies."
                />
                <Gravity />
              </>
            }
          />
          <Route
            path="/ascii"
            element={
              <>
                <SEO
                  title="ASCII Art Generator"
                  path="/ascii"
                  description="Type text and watch it rendered as ASCII art in real time. Multiple character sets: classic ASCII, Unicode blocks, matrix glyphs, and binary."
                />
                <Ascii />
              </>
            }
          />
          <Route
            path="/type"
            element={
              <>
                <SEO
                  title="Typing Speed Test — WPM & accuracy"
                  path="/type"
                  description="Measure your typing speed and accuracy with tech and programming quotes. Get instant WPM, accuracy, and time results."
                />
                <Type />
              </>
            }
          />
          <Route
            path="/sort"
            element={
              <>
                <SEO
                  title="Sorting Algorithm Visualizer"
                  path="/sort"
                  description="Watch bubble, insertion, selection, quick, and merge sort race through a bar chart in real time. Adjustable speed, step counter, and color-coded comparisons."
                />
                <Sort />
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
                  description="Interactive Conway's Game of Life: paint cells, drop classic patterns like the Gosper glider gun and pulsar, and watch generations evolve on a wrap-around grid."
                />
                <Life />
              </>
            }
          />
          <Route
            path="/boids"
            element={
              <>
                <SEO
                  title="Boids — flocking simulation"
                  path="/boids"
                  description="Classic Reynolds boids flocking simulation: tune cohesion, alignment, and separation live, scatter the flock with your cursor, and watch emergent murmurations."
                />
                <Boids />
              </>
            }
          />
          <Route
            path="/path"
            element={
              <>
                <SEO
                  title="Pathfinding Visualizer — A*, BFS, DFS, Greedy"
                  path="/path"
                  description="Draw walls, move the start and end points, and watch A*, BFS, DFS, and greedy best-first search explore the grid to find a path."
                />
                <Path />
              </>
            }
          />
          <Route
            path="/snake"
            element={
              <>
                <SEO
                  title="Snake — classic arcade game"
                  path="/snake"
                  description="Play classic snake in the terminal aesthetic: arrows or WASD to steer, speed ramps up as you grow, best score saved locally."
                />
                <Snake />
              </>
            }
          />
          <Route
            path="/pendulum"
            element={
              <>
                <SEO
                  title="Double Pendulum — deterministic chaos"
                  path="/pendulum"
                  description="Interactive double pendulum with RK4 physics: drag the bobs, spawn a ghost twin 0.001 radians apart, and watch chaos tear the trajectories apart."
                />
                <Pendulum />
              </>
            }
          />
          <Route
            path="/flow"
            element={
              <>
                <SEO
                  title="Flow Field — perlin noise particles"
                  path="/flow"
                  description="Thousands of particles trace an evolving Perlin-noise vector field into silky generative streams. Tune zoom, speed, palette, and density live."
                />
                <Flow />
              </>
            }
          />
          <Route
            path="/cipher"
            element={
              <>
                <SEO
                  title="Cipher Playground — Caesar, Vigenère, ROT13, Atbash"
                  path="/cipher"
                  description="Encode and decode text with classic ciphers: Caesar with adjustable shift, Vigenère with a keyword, ROT13, and Atbash — plus a live letter-frequency histogram."
                />
                <Cipher />
              </>
            }
          />
          <Route
            path="/regress"
            element={
              <>
                <SEO
                  title="Regression Playground — polynomial fitting & overfitting"
                  path="/regress"
                  description="Click to place data points and watch least-squares polynomial fits update live. Crank the degree to see overfitting happen, with R², RMSE, and residual lines."
                />
                <Regress />
              </>
            }
          />
          <Route
            path="/cluster"
            element={
              <>
                <SEO
                  title="K-Means Playground — watch clustering converge"
                  path="/cluster"
                  description="Interactive k-means clustering: scatter points, seed centroids with k-means++, and step through Lloyd iterations watching assignments and inertia converge."
                />
                <Cluster />
              </>
            }
          />
          <Route
            path="/pi"
            element={
              <>
                <SEO
                  title="Monte Carlo π — estimate pi by throwing darts"
                  path="/pi"
                  description="Watch π emerge from random darts: uniform samples on a quarter circle, a live estimate, and a log-log convergence chart tracking the 1/√n error law."
                />
                <Pi />
              </>
            }
          />
          <Route
            path="/2048"
            element={
              <>
                <SEO
                  title="2048 — terminal edition"
                  path="/2048"
                  description="Play 2048 in the terminal aesthetic: arrows, WASD, or swipe to slide tiles, merge to 2048 and beyond, best score saved locally."
                />
                <Game2048 />
              </>
            }
          />
          <Route
            path="/waves"
            element={
              <>
                <SEO
                  title="Wave Interference — ripple tank simulator"
                  path="/waves"
                  description="A digital ripple tank: place and drag wave sources, tune wavelength and speed, and watch constructive and destructive interference paint the classic fringe patterns."
                />
                <Waves />
              </>
            }
          />
          <Route
            path="/markov"
            element={
              <>
                <SEO
                  title="Markov Text Generator — n-gram remix machine"
                  path="/markov"
                  description="Paste any text and generate new sentences from a word-level Markov chain. Adjustable order shows the coherence spectrum from word salad to near-quotes."
                />
                <Markov />
              </>
            }
          />
          <Route
            path="/mines"
            element={
              <>
                <SEO
                  title="Minesweeper — terminal edition"
                  path="/mines"
                  description="Classic minesweeper with first-click safety, flood-fill reveals, flags, chording, three difficulties, and a timer — in the terminal aesthetic."
                />
                <Mines />
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
  </HelmetProvider>
);

export default App;
