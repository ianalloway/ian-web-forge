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
const Lissajous = lazy(() => import("./pages/Lissajous"));
const Elo = lazy(() => import("./pages/Elo"));
const Fireworks = lazy(() => import("./pages/Fireworks"));
const Dice = lazy(() => import("./pages/Dice"));
const Maze = lazy(() => import("./pages/Maze"));
const Fourier = lazy(() => import("./pages/Fourier"));
const Morse = lazy(() => import("./pages/Morse"));
const Galton = lazy(() => import("./pages/Galton"));
const Lsystem = lazy(() => import("./pages/Lsystem"));
const Bezier = lazy(() => import("./pages/Bezier"));
const Percolation = lazy(() => import("./pages/Percolation"));
const Epidemic = lazy(() => import("./pages/Epidemic"));
const Descent = lazy(() => import("./pages/Descent"));
const Tsp = lazy(() => import("./pages/Tsp"));
const Slime = lazy(() => import("./pages/Slime"));
const Reaction = lazy(() => import("./pages/Reaction"));
const Voronoi = lazy(() => import("./pages/Voronoi"));
const Eca = lazy(() => import("./pages/Eca"));
const Spectrum = lazy(() => import("./pages/Spectrum"));
const Bandit = lazy(() => import("./pages/Bandit"));
const Newton = lazy(() => import("./pages/Newton"));
const Langton = lazy(() => import("./pages/Langton"));
const IsingPage = lazy(() => import("./pages/Ising"));
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
  { path: "/toolkit", Component: Toolkit, seo: { title: "Toolkit — Sports analytics & OSS", description: "Public index of Ian Alloway’s sports ML stack, odds utilities, reporting tools, and GitHub repos — solvent-agent, ai-advantage, nba-ratings, kelly-js, juryrig, and more." } },
  { path: "/demos", Component: Demos, seo: { title: "Live Demos — SOLVENT, kelly-js, sports ML", description: "Working product demos: SOLVENT self-funding agent, kelly-js calculator, nba-edge Streamlit, sports-betting-ml, and AI Advantage." } },
  { path: "/bots", Component: Bots, seo: { title: "How to Start the Bots — SOLVENT, juryrig, OpenClaw skills", description: "Copy-paste commands to run SOLVENT, juryrig, and OpenClaw agent skills locally. No API keys needed for the SOLVENT demo." } },
  { path: "/kelly", Component: Kelly, seo: { title: "Kelly Criterion Calculator — optimal bet sizing", description: "Interactive Kelly Criterion calculator: enter win probability, decimal odds, and bankroll to get optimal bet size, expected value, and full / half / quarter Kelly stakes. Powered by kelly-js." } },
  { path: "/dla", Component: Dla, seo: { title: "Diffusion-Limited Aggregation — grow fractal crystals", description: "Random-walking particles freeze on contact to grow dendritic fractals — the process behind frost, coral, mineral deposits, and lightning. Seed from a center or a floor." } },
  { path: "/lorenz", Component: Lorenz, seo: { title: "Lorenz Attractor — the butterfly of chaos", description: "Integrate the Lorenz equations with RK4 and watch three trajectories starting 0.001 apart trace the butterfly yet diverge — deterministic chaos in a rotating 3D orbit." } },
  { path: "/gravity", Component: Gravity, seo: { title: "Gravity Sandbox — N-body simulator", description: "Interactive N-body gravity sandbox: launch bodies, watch orbits form, and simulate binary stars, solar systems, and figure-8 choreographies." } },
  { path: "/ascii", Component: Ascii, seo: { title: "ASCII Art Generator", description: "Type text and watch it rendered as ASCII art in real time. Multiple character sets: classic ASCII, Unicode blocks, matrix glyphs, and binary." } },
  { path: "/type", Component: Type, seo: { title: "Typing Speed Test — WPM & accuracy", description: "Measure your typing speed and accuracy with tech and programming quotes. Get instant WPM, accuracy, and time results." } },
  { path: "/sort", Component: Sort, seo: { title: "Sorting Algorithm Visualizer", description: "Watch bubble, insertion, selection, quick, and merge sort race through a bar chart in real time. Adjustable speed, step counter, and color-coded comparisons." } },
  { path: "/life", Component: Life, seo: { title: "Game of Life — Conway's cellular automaton", description: "Interactive Conway's Game of Life: paint cells, drop classic patterns like the Gosper glider gun and pulsar, and watch generations evolve on a wrap-around grid." } },
  { path: "/boids", Component: Boids, seo: { title: "Boids — flocking simulation", description: "Classic Reynolds boids flocking simulation: tune cohesion, alignment, and separation live, scatter the flock with your cursor, and watch emergent murmurations." } },
  { path: "/path", Component: Path, seo: { title: "Pathfinding Visualizer — A*, BFS, DFS, Greedy", description: "Draw walls, move the start and end points, and watch A*, BFS, DFS, and greedy best-first search explore the grid to find a path." } },
  { path: "/snake", Component: Snake, seo: { title: "Snake — classic arcade game", description: "Play classic snake in the terminal aesthetic: arrows or WASD to steer, speed ramps up as you grow, best score saved locally." } },
  { path: "/pendulum", Component: Pendulum, seo: { title: "Double Pendulum — deterministic chaos", description: "Interactive double pendulum with RK4 physics: drag the bobs, spawn a ghost twin 0.001 radians apart, and watch chaos tear the trajectories apart." } },
  { path: "/flow", Component: Flow, seo: { title: "Flow Field — perlin noise particles", description: "Thousands of particles trace an evolving Perlin-noise vector field into silky generative streams. Tune zoom, speed, palette, and density live." } },
  { path: "/cipher", Component: Cipher, seo: { title: "Cipher Playground — Caesar, Vigenère, ROT13, Atbash", description: "Encode and decode text with classic ciphers: Caesar with adjustable shift, Vigenère with a keyword, ROT13, and Atbash — plus a live letter-frequency histogram." } },
  { path: "/regress", Component: Regress, seo: { title: "Regression Playground — polynomial fitting & overfitting", description: "Click to place data points and watch least-squares polynomial fits update live. Crank the degree to see overfitting happen, with R², RMSE, and residual lines." } },
  { path: "/cluster", Component: Cluster, seo: { title: "K-Means Playground — watch clustering converge", description: "Interactive k-means clustering: scatter points, seed centroids with k-means++, and step through Lloyd iterations watching assignments and inertia converge." } },
  { path: "/pi", Component: Pi, seo: { title: "Monte Carlo π — estimate pi by throwing darts", description: "Watch π emerge from random darts: uniform samples on a quarter circle, a live estimate, and a log-log convergence chart tracking the 1/√n error law." } },
  { path: "/2048", Component: Game2048, seo: { title: "2048 — terminal edition", description: "Play 2048 in the terminal aesthetic: arrows, WASD, or swipe to slide tiles, merge to 2048 and beyond, best score saved locally." } },
  { path: "/waves", Component: Waves, seo: { title: "Wave Interference — ripple tank simulator", description: "A digital ripple tank: place and drag wave sources, tune wavelength and speed, and watch constructive and destructive interference paint the classic fringe patterns." } },
  { path: "/markov", Component: Markov, seo: { title: "Markov Text Generator — n-gram remix machine", description: "Paste any text and generate new sentences from a word-level Markov chain. Adjustable order shows the coherence spectrum from word salad to near-quotes." } },
  { path: "/mines", Component: Mines, seo: { title: "Minesweeper — terminal edition", description: "Classic minesweeper with first-click safety, flood-fill reveals, flags, chording, three difficulties, and a timer — in the terminal aesthetic." } },
  { path: "/lissajous", Component: Lissajous, seo: { title: "Harmonograph — Lissajous curve drawer", description: "Watch a virtual harmonograph draw damped Lissajous figures line by line. Tune frequency ratio, detune, phase, and damping, or roll a random figure." } },
  { path: "/elo", Component: Elo, seo: { title: "Elo Simulator — watch ratings converge", description: "A simulated league where Elo ratings chase hidden true skill: tune the K-factor and watch the convergence/noise tradeoff, with rank agreement and error metrics." } },
  { path: "/fireworks", Component: Fireworks, seo: { title: "Fireworks — particle show", description: "Click to launch rockets and watch physics-based firework bursts — spheres, rings, and golden willows with glitter, gravity, and additive glow." } },
  { path: "/dice", Component: Dice, seo: { title: "Dice & the Bell Curve — central limit theorem demo", description: "Roll handfuls of dice and watch the sum histogram converge to the normal curve — the central limit theorem live, with theoretical overlay and running mean." } },
  { path: "/maze", Component: Maze, seo: { title: "Maze Carver — watch a maze build and solve itself", description: "A recursive backtracker carves a perfect maze live on canvas, then BFS floods it to find the shortest path from entrance to exit." } },
  { path: "/fourier", Component: Fourier, seo: { title: "Fourier Epicycles — waves from circles", description: "Watch rotating circles stack harmonics into square, sawtooth, and triangle waves — Fourier series drawn live, complete with Gibbs ringing at the corners." } },
  { path: "/morse", Component: Morse, seo: { title: "Morse Code — translate and listen", description: "Translate text to morse (and back — direction auto-detected) and hear it played with proper PARIS timing at adjustable WPM and tone." } },
  { path: "/galton", Component: Galton, seo: { title: "Galton Board — the bell curve from bouncing balls", description: "Watch balls cascade through pegs into bins, piling up into the binomial distribution — with a bias slider to skew it and a live theoretical overlay." } },
  { path: "/lsystem", Component: Lsystem, seo: { title: "L-System Garden — fractal plants from rewrite rules", description: "Grow ferns, dragon curves, and Koch snowflakes from L-system rewrite rules with turtle graphics — tune depth and branching angle live." } },
  { path: "/bezier", Component: Bezier, seo: { title: "Bézier Playground — De Casteljau construction live", description: "Drag control points and watch De Casteljau's algorithm sweep out Bézier curves — nested interpolation levels animated from linear to septic." } },
  { path: "/percolation", Component: Percolation, seo: { title: "Percolation — watch a phase transition", description: "Sweep site probability across the percolation threshold and watch a spanning cluster snap into existence — a phase transition on a random lattice." } },
  { path: "/epidemic", Component: Epidemic, seo: { title: "Epidemic Simulator — agent-based SIR model", description: "Watch an outbreak spread through a wandering population: tune transmission and social distancing, flatten the curve, and read the live S/I/R chart." } },
  { path: "/descent", Component: Descent, seo: { title: "Gradient Descent Arena — SGD vs Momentum vs Adam", description: "Drop three optimizers on a bumpy loss surface and watch SGD, momentum, and Adam race downhill — local minima, overshoot, and adaptive steps made visible." } },
  { path: "/tsp", Component: Tsp, seo: { title: "Traveling Salesman — greedy + 2-opt live", description: "Watch a nearest-neighbor tour get built city by city, then 2-opt swaps untangle the crossings — tour length dropping in real time." } },
  { path: "/slime", Component: Slime, seo: { title: "Slime Mold — physarum vein networks", description: "Thousands of agents deposit and chase pheromone trails, self-organizing into living vein networks — the classic Physarum simulation." } },
  { path: "/reaction", Component: Reaction, seo: { title: "Reaction-Diffusion — Turing patterns live", description: "The Gray-Scott model: two diffusing chemicals react into spots, stripes, coral, and mazes — the math behind how a leopard gets its spots, running in your browser." } },
  { path: "/voronoi", Component: Voronoi, seo: { title: "Voronoi + Delaunay Explorer", description: "Drop sites and watch Voronoi cells and their dual Delaunay triangulation update live — Bowyer-Watson triangulation in the browser." } },
  { path: "/eca", Component: Eca, seo: { title: "Elementary Cellular Automata — all 256 Wolfram rules", description: "Explore Wolfram's elementary cellular automata: scrub through all 256 rules and watch Rule 30's chaos, Rule 90's Sierpiński triangle, and Rule 110's complexity evolve." } },
  { path: "/spectrum", Component: Spectrum, seo: { title: "Spectrogram — live audio frequency analyzer", description: "Turn your microphone into a scrolling spectrogram and live bar spectrum via the Web Audio FFT — whistle, hum, or play music and watch the harmonics. Audio stays on-device." } },
  { path: "/bandit", Component: Bandit, seo: { title: "Multi-Armed Bandit — exploration vs exploitation", description: "Watch greedy, ε-greedy, UCB1, and Thompson sampling race to find the best arm, with cumulative regret plotted live — the math behind A/B testing and ad allocation." } },
  { path: "/newton", Component: Newton, seo: { title: "Newton Fractal — basins of attraction", description: "Newton's method for finding polynomial roots draws a fractal: each point is colored by which root it converges to. Scroll to zoom into the infinitely detailed basin boundaries." } },
  { path: "/langton", Component: Langton, seo: { title: "Langton's Ant — emergence from one rule", description: "Watch Langton's Ant and generalized turmites build order from a single deterministic rule: chaos for thousands of steps, then a spontaneous highway. Pick a rule string over {L,R,U,N} and see wildly different attractors emerge — no randomness." } },
  { path: "/ising", Component: IsingPage, seo: { title: "Ising Model — magnetism & the phase transition", description: "A lattice of spins evolved by Metropolis Monte Carlo. Drag the temperature across the critical point Tc≈2.27 and watch magnetic domains freeze out of thermal noise — a phase transition you can feel in the slider." } },
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
