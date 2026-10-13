import { Suspense, lazy, type ComponentProps, type ElementType } from "react";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import SEO from "./components/SEO";
import Index from "./pages/Index";
import { EXPERIMENTS, experimentSeo } from "./lib/experiments";

const Now = lazy(() => import("./pages/Now"));
const Lab = lazy(() => import("./pages/Lab"));
const Judge = lazy(() => import("./pages/Judge"));
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
const CyclicPage = lazy(() => import("./pages/Cyclic"));
const Turing = lazy(() => import("./pages/Turing"));
const Wfc = lazy(() => import("./pages/Wfc"));
const Mandelbrot = lazy(() => import("./pages/Mandelbrot"));
const Chaos = lazy(() => import("./pages/Chaos"));
const Hull = lazy(() => import("./pages/Hull"));
const Sandpile = lazy(() => import("./pages/Sandpile"));
const NeuralNet = lazy(() => import("./pages/NeuralNet"));
const IsingPage = lazy(() => import("./pages/Ising"));
const Huffman = lazy(() => import("./pages/Huffman"));
const WatorPage = lazy(() => import("./pages/Wator"));
const Collatz = lazy(() => import("./pages/Collatz"));
const TerrainPage = lazy(() => import("./pages/Terrain"));
const Sudoku = lazy(() => import("./pages/Sudoku"));
const Metaballs = lazy(() => import("./pages/Metaballs"));
const Poisson = lazy(() => import("./pages/Poisson"));
const Mst = lazy(() => import("./pages/Mst"));
const Cloth = lazy(() => import("./pages/Cloth"));
const KellySim = lazy(() => import("./pages/KellySim"));
const Clv = lazy(() => import("./pages/Clv"));
const Vig = lazy(() => import("./pages/Vig"));
const FluidPage = lazy(() => import("./pages/Fluid"));
const Rsa = lazy(() => import("./pages/Rsa"));
const Cube = lazy(() => import("./pages/Cube"));
const Raycast = lazy(() => import("./pages/Raycast"));
const Regex = lazy(() => import("./pages/Regex"));
const EditDistance = lazy(() => import("./pages/EditDistance"));
const Bloom = lazy(() => import("./pages/Bloom"));
const QLearning = lazy(() => import("./pages/QLearning"));
const Kalman = lazy(() => import("./pages/Kalman"));
const Traffic = lazy(() => import("./pages/Traffic"));
const Dilemma = lazy(() => import("./pages/Dilemma"));
const Mcmc = lazy(() => import("./pages/Mcmc"));
const PageRankPage = lazy(() => import("./pages/PageRank"));
const Avl = lazy(() => import("./pages/Avl"));
const Scoreline = lazy(() => import("./pages/Scoreline"));
const Gp = lazy(() => import("./pages/Gp"));
const Queue = lazy(() => import("./pages/Queue"));
const Lz77 = lazy(() => import("./pages/Lz77"));
const Kmp = lazy(() => import("./pages/Kmp"));
const Hashmap = lazy(() => import("./pages/Hashmap"));
const QuadtreePage = lazy(() => import("./pages/Quadtree"));
const Arithmetic = lazy(() => import("./pages/Arithmetic"));
const Hamming = lazy(() => import("./pages/Hamming"));
const Hyperloglog = lazy(() => import("./pages/Hyperloglog"));
const RingPage = lazy(() => import("./pages/Ring"));
const DiffPage = lazy(() => import("./pages/Diff"));
const Skiplist = lazy(() => import("./pages/Skiplist"));
const Bwt = lazy(() => import("./pages/Bwt"));
const Ratelimit = lazy(() => import("./pages/Ratelimit"));
const Topo = lazy(() => import("./pages/Topo"));
const ViterbiPage = lazy(() => import("./pages/Viterbi"));
const Lru = lazy(() => import("./pages/Lru"));
const Sat = lazy(() => import("./pages/Sat"));
const Monogram = lazy(() => import("./pages/Monogram"));
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
  { path: "/monogram", Component: Monogram, seo: { title: "Monogram — ASCII landing page", description: "Ian Alloway’s portfolio as a terminal: a 3D monogram rendered live as shape-aware ASCII, with work, lab sketches and a contact prompt." } },
  { path: "/toolkit", Component: Toolkit, seo: { title: "Toolkit — Sports analytics & OSS", description: "Public index of Ian Alloway’s sports ML stack, odds utilities, reporting tools, and GitHub repos — solvent-agent, ai-advantage, nba-ratings, kelly-js, juryrig, and more." } },
  { path: "/demos", Component: Demos, seo: { title: "Live Demos — SOLVENT, kelly-js, sports ML", description: "Working product demos: SOLVENT self-funding agent, kelly-js calculator, nba-edge Streamlit, sports-betting-ml, and AI Advantage." } },
  { path: "/bots", Component: Bots, seo: { title: "How to Start the Bots — SOLVENT, juryrig, OpenClaw skills", description: "Copy-paste commands to run SOLVENT, juryrig, and OpenClaw agent skills locally. No API keys needed for the SOLVENT demo." } },
  { path: "/lab", Component: Lab, seo: { title: `Lab — ${EXPERIMENTS.length} interactive experiments`, description: "Every interactive experiment on ianalloway.xyz in one index: an LLM-judge audit, Kelly and CLV tools, ML and statistics you can watch converge, algorithms, systems internals, physics simulations and generative systems. All client-side, all from scratch." } },
  { path: "/judge", Component: Judge, seo: experimentSeo("/judge") },
  { path: "/kelly", Component: Kelly, seo: experimentSeo("/kelly") },
  { path: "/dla", Component: Dla, seo: experimentSeo("/dla") },
  { path: "/lorenz", Component: Lorenz, seo: experimentSeo("/lorenz") },
  { path: "/gravity", Component: Gravity, seo: experimentSeo("/gravity") },
  { path: "/ascii", Component: Ascii, seo: experimentSeo("/ascii") },
  { path: "/type", Component: Type, seo: experimentSeo("/type") },
  { path: "/sort", Component: Sort, seo: experimentSeo("/sort") },
  { path: "/life", Component: Life, seo: experimentSeo("/life") },
  { path: "/boids", Component: Boids, seo: experimentSeo("/boids") },
  { path: "/path", Component: Path, seo: experimentSeo("/path") },
  { path: "/snake", Component: Snake, seo: experimentSeo("/snake") },
  { path: "/pendulum", Component: Pendulum, seo: experimentSeo("/pendulum") },
  { path: "/flow", Component: Flow, seo: experimentSeo("/flow") },
  { path: "/cipher", Component: Cipher, seo: experimentSeo("/cipher") },
  { path: "/regress", Component: Regress, seo: experimentSeo("/regress") },
  { path: "/cluster", Component: Cluster, seo: experimentSeo("/cluster") },
  { path: "/pi", Component: Pi, seo: experimentSeo("/pi") },
  { path: "/2048", Component: Game2048, seo: experimentSeo("/2048") },
  { path: "/waves", Component: Waves, seo: experimentSeo("/waves") },
  { path: "/markov", Component: Markov, seo: experimentSeo("/markov") },
  { path: "/mines", Component: Mines, seo: experimentSeo("/mines") },
  { path: "/lissajous", Component: Lissajous, seo: experimentSeo("/lissajous") },
  { path: "/elo", Component: Elo, seo: experimentSeo("/elo") },
  { path: "/fireworks", Component: Fireworks, seo: experimentSeo("/fireworks") },
  { path: "/dice", Component: Dice, seo: experimentSeo("/dice") },
  { path: "/maze", Component: Maze, seo: experimentSeo("/maze") },
  { path: "/fourier", Component: Fourier, seo: experimentSeo("/fourier") },
  { path: "/morse", Component: Morse, seo: experimentSeo("/morse") },
  { path: "/galton", Component: Galton, seo: experimentSeo("/galton") },
  { path: "/lsystem", Component: Lsystem, seo: experimentSeo("/lsystem") },
  { path: "/bezier", Component: Bezier, seo: experimentSeo("/bezier") },
  { path: "/percolation", Component: Percolation, seo: experimentSeo("/percolation") },
  { path: "/epidemic", Component: Epidemic, seo: experimentSeo("/epidemic") },
  { path: "/descent", Component: Descent, seo: experimentSeo("/descent") },
  { path: "/tsp", Component: Tsp, seo: experimentSeo("/tsp") },
  { path: "/slime", Component: Slime, seo: experimentSeo("/slime") },
  { path: "/reaction", Component: Reaction, seo: experimentSeo("/reaction") },
  { path: "/voronoi", Component: Voronoi, seo: experimentSeo("/voronoi") },
  { path: "/eca", Component: Eca, seo: experimentSeo("/eca") },
  { path: "/spectrum", Component: Spectrum, seo: experimentSeo("/spectrum") },
  { path: "/bandit", Component: Bandit, seo: experimentSeo("/bandit") },
  { path: "/newton", Component: Newton, seo: experimentSeo("/newton") },
  { path: "/langton", Component: Langton, seo: experimentSeo("/langton") },
  { path: "/cyclic", Component: CyclicPage, seo: experimentSeo("/cyclic") },
  { path: "/turing", Component: Turing, seo: experimentSeo("/turing") },
  { path: "/wfc", Component: Wfc, seo: experimentSeo("/wfc") },
  { path: "/mandelbrot", Component: Mandelbrot, seo: experimentSeo("/mandelbrot") },
  { path: "/chaos", Component: Chaos, seo: experimentSeo("/chaos") },
  { path: "/hull", Component: Hull, seo: experimentSeo("/hull") },
  { path: "/sandpile", Component: Sandpile, seo: experimentSeo("/sandpile") },
  { path: "/neuralnet", Component: NeuralNet, seo: experimentSeo("/neuralnet") },
  { path: "/ising", Component: IsingPage, seo: experimentSeo("/ising") },
  { path: "/huffman", Component: Huffman, seo: experimentSeo("/huffman") },
  { path: "/wator", Component: WatorPage, seo: experimentSeo("/wator") },
  { path: "/collatz", Component: Collatz, seo: experimentSeo("/collatz") },
  { path: "/terrain", Component: TerrainPage, seo: experimentSeo("/terrain") },
  { path: "/sudoku", Component: Sudoku, seo: experimentSeo("/sudoku") },
  { path: "/metaballs", Component: Metaballs, seo: experimentSeo("/metaballs") },
  { path: "/poisson", Component: Poisson, seo: experimentSeo("/poisson") },
  { path: "/mst", Component: Mst, seo: experimentSeo("/mst") },
  { path: "/cloth", Component: Cloth, seo: experimentSeo("/cloth") },
  { path: "/kellysim", Component: KellySim, seo: experimentSeo("/kellysim") },
  { path: "/clv", Component: Clv, seo: experimentSeo("/clv") },
  { path: "/vig", Component: Vig, seo: experimentSeo("/vig") },
  { path: "/fluid", Component: FluidPage, seo: experimentSeo("/fluid") },
  { path: "/rsa", Component: Rsa, seo: experimentSeo("/rsa") },
  { path: "/cube", Component: Cube, seo: experimentSeo("/cube") },
  { path: "/raycast", Component: Raycast, seo: experimentSeo("/raycast") },
  { path: "/regex", Component: Regex, seo: experimentSeo("/regex") },
  { path: "/editdistance", Component: EditDistance, seo: experimentSeo("/editdistance") },
  { path: "/bloom", Component: Bloom, seo: experimentSeo("/bloom") },
  { path: "/qlearning", Component: QLearning, seo: experimentSeo("/qlearning") },
  { path: "/kalman", Component: Kalman, seo: experimentSeo("/kalman") },
  { path: "/traffic", Component: Traffic, seo: experimentSeo("/traffic") },
  { path: "/dilemma", Component: Dilemma, seo: experimentSeo("/dilemma") },
  { path: "/mcmc", Component: Mcmc, seo: experimentSeo("/mcmc") },
  { path: "/pagerank", Component: PageRankPage, seo: experimentSeo("/pagerank") },
  { path: "/avl", Component: Avl, seo: experimentSeo("/avl") },
  { path: "/scoreline", Component: Scoreline, seo: experimentSeo("/scoreline") },
  { path: "/gp", Component: Gp, seo: experimentSeo("/gp") },
  { path: "/queue", Component: Queue, seo: experimentSeo("/queue") },
  { path: "/lz77", Component: Lz77, seo: experimentSeo("/lz77") },
  { path: "/kmp", Component: Kmp, seo: experimentSeo("/kmp") },
  { path: "/hashmap", Component: Hashmap, seo: experimentSeo("/hashmap") },
  { path: "/quadtree", Component: QuadtreePage, seo: experimentSeo("/quadtree") },
  { path: "/arithmetic", Component: Arithmetic, seo: experimentSeo("/arithmetic") },
  { path: "/hamming", Component: Hamming, seo: experimentSeo("/hamming") },
  { path: "/hyperloglog", Component: Hyperloglog, seo: experimentSeo("/hyperloglog") },
  { path: "/ring", Component: RingPage, seo: experimentSeo("/ring") },
  { path: "/diff", Component: DiffPage, seo: experimentSeo("/diff") },
  { path: "/skiplist", Component: Skiplist, seo: experimentSeo("/skiplist") },
  { path: "/bwt", Component: Bwt, seo: experimentSeo("/bwt") },
  { path: "/ratelimit", Component: Ratelimit, seo: experimentSeo("/ratelimit") },
  { path: "/topo", Component: Topo, seo: experimentSeo("/topo") },
  { path: "/viterbi", Component: ViterbiPage, seo: experimentSeo("/viterbi") },
  { path: "/lru", Component: Lru, seo: experimentSeo("/lru") },
  { path: "/sat", Component: Sat, seo: experimentSeo("/sat") },
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
