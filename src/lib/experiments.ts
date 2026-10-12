import type { ExperimentCategory } from "./experimentCategories";

/**
 * Every interactive experiment on the site, in one place.
 *
 * App.tsx reads titles and descriptions from here for each route's SEO tags,
 * and /lab renders the same list, so a demo cannot be routed but unlisted.
 * Order within a category is the order /lab shows them.
 */
export type Experiment = {
  path: string;
  title: string;
  description: string;
  category: ExperimentCategory;
};

export const EXPERIMENTS: Experiment[] = [
  {
    path: "/judge",
    title: "Audit the Judge — LLM-as-judge bias, live",
    description: "A simulated LLM judge grades a candidate model against a baseline while the ground truth stays visible. Dial in position bias, verbosity bias and noise, watch the leaderboard win rate drift from the truth, and see which juryrig audit — order flips, padding lift, re-run consistency, panel κ, calibration — catches it.",
    category: "decisions",
  },
  {
    path: "/kelly",
    title: "Kelly Criterion Calculator — optimal bet sizing",
    description: "Interactive Kelly Criterion calculator: enter win probability, decimal odds, and bankroll to get optimal bet size, expected value, and full / half / quarter Kelly stakes. Powered by kelly-js.",
    category: "decisions",
  },
  {
    path: "/kellysim",
    title: "Kelly Bankroll Simulator — full vs fractional Kelly",
    description: "Monte Carlo hundreds of bankrolls betting the same edge at quarter, half, full, and double Kelly. See the whole distribution on a log scale — median growth, percentiles, risk of ruin, and worst drawdown.",
    category: "decisions",
  },
  {
    path: "/clv",
    title: "CLV Playground — closing line value calculator",
    description: "Interactive Closing Line Value playground: enter American entry and closing odds, see CLV in probability points, beat/lost/push verdict, implied probs, and a rolling bet-log summary with mean CLV and beat rate.",
    category: "decisions",
  },
  {
    path: "/vig",
    title: "No-Vig Playground — fair odds & overround calculator",
    description: "Interactive no-vig / fair-odds playground: enter a two-way or multi-way market in American, decimal, or implied-probability odds, compare multiplicative / additive / power / Shin de-vig methods, read overround and hold, and size a quarter-Kelly stake against your probability.",
    category: "decisions",
  },
  {
    path: "/scoreline",
    title: "Poisson Scoreline Heatmap — independent λ home / away",
    description: "Interactive sports scoreline model: tune independent Poisson λ for home and away goals, see the full P(i,j) heatmap, the mode scoreline, 1X2 probabilities, and over/under 2.5.",
    category: "decisions",
  },
  {
    path: "/elo",
    title: "Elo Simulator — watch ratings converge",
    description: "A simulated league where Elo ratings chase hidden true skill: tune the K-factor and watch the convergence/noise tradeoff, with rank agreement and error metrics.",
    category: "decisions",
  },
  {
    path: "/bandit",
    title: "Multi-Armed Bandit — exploration vs exploitation",
    description: "Watch greedy, ε-greedy, UCB1, and Thompson sampling race to find the best arm, with cumulative regret plotted live — the math behind A/B testing and ad allocation.",
    category: "decisions",
  },
  {
    path: "/dilemma",
    title: "Prisoner’s Dilemma — Axelrod’s tournament, evolved",
    description: "Ten strategies play a round-robin iterated prisoner’s dilemma, then a population evolves under replicator dynamics. See why nice, retaliatory, forgiving strategies beat pure defection over repeated play — and how noise rewards forgiveness.",
    category: "decisions",
  },
  {
    path: "/regress",
    title: "Regression Playground — polynomial fitting & overfitting",
    description: "Click to place data points and watch least-squares polynomial fits update live. Crank the degree to see overfitting happen, with R², RMSE, and residual lines.",
    category: "ml",
  },
  {
    path: "/cluster",
    title: "K-Means Playground — watch clustering converge",
    description: "Interactive k-means clustering: scatter points, seed centroids with k-means++, and step through Lloyd iterations watching assignments and inertia converge.",
    category: "ml",
  },
  {
    path: "/descent",
    title: "Gradient Descent Arena — SGD vs Momentum vs Adam",
    description: "Drop three optimizers on a bumpy loss surface and watch SGD, momentum, and Adam race downhill — local minima, overshoot, and adaptive steps made visible.",
    category: "ml",
  },
  {
    path: "/neuralnet",
    title: "Neural Network — watch a decision boundary learn",
    description: "A tiny 2·8·8·1 neural network trains by backpropagation on 2D toy datasets — blobs, circles, XOR, and spirals. Watch the decision boundary bend to fit the data in real time.",
    category: "ml",
  },
  {
    path: "/gp",
    title: "Gaussian Processes — fitting a distribution over functions",
    description: "Click to place observations and watch a Gaussian process condition every plausible function on them. The posterior mean is one curve, but the band around it is the point: it pinches shut at the data and flares wherever nothing was measured, because the variance never looks at y at all. Swap kernels, tune the lengthscale and noise, and draw sample functions.",
    category: "ml",
  },
  {
    path: "/mcmc",
    title: "Metropolis-Hastings — sampling a distribution you can only score",
    description: "Watch a Markov chain sample a distribution it can never solve: propose a nearby point, accept it in proportion to how much better it is, repeat. The sample histogram converges onto the true marginal while the proposal width decides everything — too small and the chain crawls, too large and it stands still, and effective sample size tells you which is happening.",
    category: "ml",
  },
  {
    path: "/kalman",
    title: "Kalman Filter — tracking a target through noise",
    description: "A constant-velocity Kalman filter tracking a maneuvering target from noisy position fixes alone. Watch it recover a velocity it never measures, grow its uncertainty ellipse through sensor dropouts, and beat the raw sensor by several times — then detune the process noise and watch it lag every hard turn.",
    category: "ml",
  },
  {
    path: "/qlearning",
    title: "Q-Learning — watch an agent solve a gridworld",
    description: "Tabular reinforcement learning live: an agent learns to reach the goal and dodge pits from reward alone, with no map. Watch the value function fill in as a heatmap, the ε-greedy policy arrows align, and the greedy route lock onto the goal — tune the learning rate, discount, exploration, and environment slip.",
    category: "ml",
  },
  {
    path: "/markov",
    title: "Markov Text Generator — n-gram remix machine",
    description: "Paste any text and generate new sentences from a word-level Markov chain. Adjustable order shows the coherence spectrum from word salad to near-quotes.",
    category: "ml",
  },
  {
    path: "/pagerank",
    title: "PageRank — power iteration and the bored surfer",
    description: "PageRank computed two ways at once: power iteration on the link graph, and a random surfer whose visit counts drift onto the same numbers. Tune the damping factor, watch rank pool in dead ends without teleportation, and see why a link farm cannot manufacture rank out of nothing.",
    category: "ml",
  },
  {
    path: "/pi",
    title: "Monte Carlo π — estimate pi by throwing darts",
    description: "Watch π emerge from random darts: uniform samples on a quarter circle, a live estimate, and a log-log convergence chart tracking the 1/√n error law.",
    category: "ml",
  },
  {
    path: "/dice",
    title: "Dice & the Bell Curve — central limit theorem demo",
    description: "Roll handfuls of dice and watch the sum histogram converge to the normal curve — the central limit theorem live, with theoretical overlay and running mean.",
    category: "ml",
  },
  {
    path: "/galton",
    title: "Galton Board — the bell curve from bouncing balls",
    description: "Watch balls cascade through pegs into bins, piling up into the binomial distribution — with a bias slider to skew it and a live theoretical overlay.",
    category: "ml",
  },
  {
    path: "/sort",
    title: "Sorting Algorithm Visualizer",
    description: "Watch bubble, insertion, selection, quick, and merge sort race through a bar chart in real time. Adjustable speed, step counter, and color-coded comparisons.",
    category: "algorithms",
  },
  {
    path: "/path",
    title: "Pathfinding Visualizer — A*, BFS, DFS, Greedy",
    description: "Draw walls, move the start and end points, and watch A*, BFS, DFS, and greedy best-first search explore the grid to find a path.",
    category: "algorithms",
  },
  {
    path: "/maze",
    title: "Maze Carver — watch a maze build and solve itself",
    description: "A recursive backtracker carves a perfect maze live on canvas, then BFS floods it to find the shortest path from entrance to exit.",
    category: "algorithms",
  },
  {
    path: "/tsp",
    title: "Traveling Salesman — greedy + 2-opt live",
    description: "Watch a nearest-neighbor tour get built city by city, then 2-opt swaps untangle the crossings — tour length dropping in real time.",
    category: "algorithms",
  },
  {
    path: "/hull",
    title: "Convex Hull — watch the monotone chain build",
    description: "Click to drop points and watch Andrew's monotone chain algorithm wrap them in a convex hull step by step — sorting, sweeping, and popping points that would dent the boundary inward.",
    category: "algorithms",
  },
  {
    path: "/mst",
    title: "Minimum Spanning Tree — Prim vs Kruskal",
    description: "Watch Prim's and Kruskal's algorithms build the minimum spanning tree — the cheapest cycle-free web connecting every point. Two very different paths to the same optimal tree.",
    category: "algorithms",
  },
  {
    path: "/sudoku",
    title: "Sudoku Solver — watch backtracking search",
    description: "Watch a backtracking Sudoku solver think: it places digits that fit, hits dead ends, and backtracks (in red) to try again. Generate easy/medium/hard puzzles and step through the search.",
    category: "algorithms",
  },
  {
    path: "/cube",
    title: "Pocket Cube Solver — provably optimal 2×2 solutions",
    description: "Scramble a 2×2×2 Rubik's cube and watch a bidirectional breadth-first search find the shortest solution that exists. No 2×2 position ever needs more than 11 turns.",
    category: "algorithms",
  },
  {
    path: "/regex",
    title: "Regex Engine — pattern to NFA to DFA",
    description: "Watch a regular expression compile the textbook way: parsed into a syntax tree, converted to an NFA by Thompson's construction, then determinised by subset construction. Step through the DFA character by character — no backtracking, linear time.",
    category: "algorithms",
  },
  {
    path: "/editdistance",
    title: "Edit Distance — the dynamic programming table",
    description: "See Levenshtein distance computed by the Wagner-Fischer dynamic program: every cell asks whether substituting, inserting, or deleting is cheaper, and the traceback reveals the cheapest edit script turning one word into another.",
    category: "algorithms",
  },
  {
    path: "/kmp",
    title: "KMP — string search that never looks back",
    description: "Naive search and Knuth-Morris-Pratt hunt the same text side by side at the same rate. On a mismatch naive slides one character and rereads what it already saw; KMP consults a failure table built from the pattern’s own prefixes and never examines a text character twice. Watch the comparison counters diverge on the adversarial case.",
    category: "algorithms",
  },
  {
    path: "/diff",
    title: "Myers Diff — the algorithm behind git diff",
    description: "A diff is a shortest path. Lay the old file along one axis and the new along the other: right deletes, down inserts, and a diagonal is a shared line that costs nothing. Myers explores the graph in order of edit distance, and the first wavefront to reach the far corner is the minimal diff — without ever filling an N×M table.",
    category: "algorithms",
  },
  {
    path: "/avl",
    title: "AVL Tree — the same keys, kept shallow",
    description: "An AVL tree and a plain binary search tree receive the same keys in the same order. Insert them sorted and the plain BST degenerates into a linked list while the AVL tree rotates itself back to logarithmic depth. Watch the LL, RR, LR and RL rotations fire and compare the worst-case lookup in each.",
    category: "algorithms",
  },
  {
    path: "/skiplist",
    title: "Skip Lists — a balanced structure that never balances",
    description: "An AVL tree stays shallow by measuring its height and rotating. A skip list reaches the same O(log n) by flipping a coin: each node is promoted to the next express lane with probability p, and a search runs along the top lane and drops a level whenever the next hop would overshoot. No rotations, no rebalancing — just a probabilistic guarantee.",
    category: "algorithms",
  },
  {
    path: "/quadtree",
    title: "Quadtree — not checking what you don’t need to check",
    description: "A quadtree over thousands of moving points, rebuilt every frame. Steer a search box with your cursor and watch whole subtrees get dismissed by a single rectangle test: the query examines a few dozen points where brute force would examine every one. Includes pruned nearest-neighbour search and four point distributions.",
    category: "algorithms",
  },
  {
    path: "/voronoi",
    title: "Voronoi + Delaunay Explorer",
    description: "Drop sites and watch Voronoi cells and their dual Delaunay triangulation update live — Bowyer-Watson triangulation in the browser.",
    category: "algorithms",
  },
  {
    path: "/poisson",
    title: "Poisson-Disk Sampling — blue noise, no clumping",
    description: "Watch Bridson's algorithm fill space with blue noise: points placed so none are closer than a set radius, yet with no large gaps — the even spacing behind stippling and dithering.",
    category: "algorithms",
  },
  {
    path: "/bezier",
    title: "Bézier Playground — De Casteljau construction live",
    description: "Drag control points and watch De Casteljau's algorithm sweep out Bézier curves — nested interpolation levels animated from linear to septic.",
    category: "algorithms",
  },
  {
    path: "/topo",
    title: "Build Scheduling — topological order, waves and the critical path",
    description: "Kahn’s algorithm on a build graph, taken a wave at a time: everything in a wave can run at once, so the number of waves is the depth of the graph and the longest dependency chain is the floor on build time no amount of hardware gets under. Cycles are detected without a separate pass, because nothing is ever ready.",
    category: "algorithms",
  },
  {
    path: "/turing",
    title: "Turing Machine — watch computation from first principles",
    description: "A single-tape Turing machine with a genuinely two-way infinite tape: step through binary increment, a unary doubler, a palindrome checker, and the 3- and 4-state busy beaver champions, watching the head read, write, and move one transition at a time.",
    category: "algorithms",
  },
  {
    path: "/hashmap",
    title: "Hash Tables — collisions, clustering and load factor",
    description: "Watch a hash table fill and measure what collisions actually cost. Chaining, linear probing, quadratic probing and double hashing each degrade differently as the load factor climbs, with the measured probe count drawn against Knuth’s theoretical curve — and linear probing running away from it past α ≈ 0.8 as clusters merge.",
    category: "systems",
  },
  {
    path: "/bloom",
    title: "Bloom Filter — a set that can only lie one way",
    description: "An interactive Bloom filter: adding a word sets k bits, checking reads the same k. One clear bit proves absence, so false negatives are impossible — but collisions cause false positives. Measure the real rate against the theoretical formula.",
    category: "systems",
  },
  {
    path: "/hyperloglog",
    title: "HyperLogLog — counting distinct things without remembering any",
    description: "Counting unique visitors exactly means storing every id. HyperLogLog answers the same question in a fixed few kilobytes by keeping only the longest run of leading zeros each register has seen, with error settling at 1.04/√m regardless of the count. Watch the estimate track the truth while an exact set runs out of room.",
    category: "systems",
  },
  {
    path: "/ring",
    title: "Consistent Hashing — adding a server without moving everything",
    description: "`hash(key) % n` works until n changes: add a fifth server and four fifths of the cache is suddenly in the wrong place. Consistent hashing puts keys and servers on the same circle so only the arc behind a new server moves — about 1/n of keys. Add and remove servers and watch the measured remap percentage against what the modulus would have cost.",
    category: "systems",
  },
  {
    path: "/ratelimit",
    title: "Rate Limiting — four algorithms that disagree under a burst",
    description: "Fixed window, sliding log, sliding counter and token bucket all promise N requests per minute, and they mean different things. Run the boundary burst and watch the fixed window pass twice its own limit while the sliding log never does, with each algorithm’s worst observed window measured live.",
    category: "systems",
  },
  {
    path: "/queue",
    title: "Queueing Theory — why the line explodes before the servers are full",
    description: "An event-driven M/M/c queue running against Erlang C. The wait grows like 1/(1−ρ), so going from 90% to 95% busy doubles it and 95% to 98% doubles it again — and past ρ = 1 nothing crashes, the line simply never stops growing. Tune arrival and service rates, add servers, and see why pooling beats speed.",
    category: "systems",
  },
  {
    path: "/huffman",
    title: "Huffman Coding — build an optimal compression code",
    description: "Type text and watch Huffman coding build the optimal prefix-free binary code: merge the two rarest symbols, repeat. See the code tree, the per-character bit codes, and the live compression ratio.",
    category: "systems",
  },
  {
    path: "/lz77",
    title: "LZ77 — compression by pointing backwards",
    description: "Watch LZ77 slide a window over text, find the longest run it has already seen, and emit a pointer instead of the characters. A match may run past the cursor and copy what it is still producing, which is how one pointer swallows a long run. LZ77 removes the repetition, Huffman shortens what is left, and together they are DEFLATE.",
    category: "systems",
  },
  {
    path: "/arithmetic",
    title: "Arithmetic Coding — a whole message as one number",
    description: "Huffman must spend a whole bit on a symbol worth 0.15 bits. Arithmetic coding never names a symbol: it narrows the interval [0,1) once per symbol and transmits any number left inside, landing within two bits of the entropy however the probabilities fall. Watch the interval shrink, and the single number decode back to the message exactly.",
    category: "systems",
  },
  {
    path: "/bwt",
    title: "Burrows-Wheeler — sorting a string into something compressible",
    description: "The Burrows-Wheeler transform compresses nothing by itself: it is a reversible permutation. What it does is gather repetition into runs, by sorting every rotation of the text and reading the last column. Watch the runs form, the move-to-front codes collapse to zeros, and the whole thing invert back to the original exactly — the first stage of bzip2.",
    category: "systems",
  },
  {
    path: "/hamming",
    title: "Hamming Codes — finding the broken bit by asking the right questions",
    description: "Put parity bits at the powers of two and the checks that fail spell out, in binary, the address of the bit that flipped. Click any bit to break it and watch the syndrome point straight at it. Flip two on the plain code and watch it confidently fix the wrong one — which is exactly why ECC memory adds the extra parity bit.",
    category: "systems",
  },
  {
    path: "/rsa",
    title: "RSA Playground — build a key and break it",
    description: "Pick two primes, watch RSA build a keypair, encrypt and decrypt by modular exponentiation with the square-and-multiply ladder shown step by step — then factor the modulus to recover the private key. Textbook RSA, for learning only.",
    category: "systems",
  },
  {
    path: "/cipher",
    title: "Cipher Playground — Caesar, Vigenère, ROT13, Atbash",
    description: "Encode and decode text with classic ciphers: Caesar with adjustable shift, Vigenère with a keyword, ROT13, and Atbash — plus a live letter-frequency histogram.",
    category: "systems",
  },
  {
    path: "/morse",
    title: "Morse Code — translate and listen",
    description: "Translate text to morse (and back — direction auto-detected) and hear it played with proper PARIS timing at adjustable WPM and tone.",
    category: "systems",
  },
  {
    path: "/gravity",
    title: "Gravity Sandbox — N-body simulator",
    description: "Interactive N-body gravity sandbox: launch bodies, watch orbits form, and simulate binary stars, solar systems, and figure-8 choreographies.",
    category: "simulation",
  },
  {
    path: "/pendulum",
    title: "Double Pendulum — deterministic chaos",
    description: "Interactive double pendulum with RK4 physics: drag the bobs, spawn a ghost twin 0.001 radians apart, and watch chaos tear the trajectories apart.",
    category: "simulation",
  },
  {
    path: "/lorenz",
    title: "Lorenz Attractor — the butterfly of chaos",
    description: "Integrate the Lorenz equations with RK4 and watch three trajectories starting 0.001 apart trace the butterfly yet diverge — deterministic chaos in a rotating 3D orbit.",
    category: "simulation",
  },
  {
    path: "/waves",
    title: "Wave Interference — ripple tank simulator",
    description: "A digital ripple tank: place and drag wave sources, tune wavelength and speed, and watch constructive and destructive interference paint the classic fringe patterns.",
    category: "simulation",
  },
  {
    path: "/cloth",
    title: "Verlet Cloth — position-based physics you can tear",
    description: "A cloth of point masses held together by distance constraints and integrated with Verlet: drag it, pin corners, crank gravity, and tear the fabric apart.",
    category: "simulation",
  },
  {
    path: "/fluid",
    title: "Stable Fluids — stir a Navier-Stokes simulation",
    description: "An interactive real-time fluid solver using Jos Stam's Stable Fluids method: each frame the velocity field is diffused, self-advected, then projected divergence-free. Drag to stir the dye.",
    category: "simulation",
  },
  {
    path: "/ising",
    title: "Ising Model — magnetism & the phase transition",
    description: "A lattice of spins evolved by Metropolis Monte Carlo. Drag the temperature across the critical point Tc≈2.27 and watch magnetic domains freeze out of thermal noise.",
    category: "simulation",
  },
  {
    path: "/percolation",
    title: "Percolation — watch a phase transition",
    description: "Sweep site probability across the percolation threshold and watch a spanning cluster snap into existence — a phase transition on a random lattice.",
    category: "simulation",
  },
  {
    path: "/sandpile",
    title: "Abelian Sandpile — fractals & self-organized criticality",
    description: "Drop grains of sand: a cell with 4 or more topples one to each neighbor. The same trivial rule builds a fractal from a single pile and, under steady rain, self-organizes to a critical state.",
    category: "simulation",
  },
  {
    path: "/traffic",
    title: "Phantom Traffic Jams — the Nagel-Schreckenberg model",
    description: "Traffic jams with no cause: four simple rules on a ring road, one of them a random moment of inattention. Watch jams nucleate from nothing and crawl backwards through the space-time diagram, and trace the flow-versus-density curve that explains why a busy road collapses.",
    category: "simulation",
  },
  {
    path: "/epidemic",
    title: "Epidemic Simulator — agent-based SIR model",
    description: "Watch an outbreak spread through a wandering population: tune transmission and social distancing, flatten the curve, and read the live S/I/R chart.",
    category: "simulation",
  },
  {
    path: "/wator",
    title: "Wa-Tor — predator-prey population cycles",
    description: "The classic Wa-Tor simulation: fish wander and breed while sharks hunt, breed, and starve without food. Watch the two populations chase each other in Lotka-Volterra boom-and-bust cycles.",
    category: "simulation",
  },
  {
    path: "/boids",
    title: "Boids — flocking simulation",
    description: "Classic Reynolds boids flocking simulation: tune cohesion, alignment, and separation live, scatter the flock with your cursor, and watch emergent murmurations.",
    category: "simulation",
  },
  {
    path: "/dla",
    title: "Diffusion-Limited Aggregation — grow fractal crystals",
    description: "Random-walking particles freeze on contact to grow dendritic fractals — the process behind frost, coral, mineral deposits, and lightning. Seed from a center or a floor.",
    category: "generative",
  },
  {
    path: "/flow",
    title: "Flow Field — perlin noise particles",
    description: "Thousands of particles trace an evolving Perlin-noise vector field into silky generative streams. Tune zoom, speed, palette, and density live.",
    category: "generative",
  },
  {
    path: "/life",
    title: "Game of Life — Conway's cellular automaton",
    description: "Interactive Conway's Game of Life: paint cells, drop classic patterns like the Gosper glider gun and pulsar, and watch generations evolve on a wrap-around grid.",
    category: "generative",
  },
  {
    path: "/eca",
    title: "Elementary Cellular Automata — all 256 Wolfram rules",
    description: "Explore Wolfram's elementary cellular automata: scrub through all 256 rules and watch Rule 30's chaos, Rule 90's Sierpiński triangle, and Rule 110's complexity evolve.",
    category: "generative",
  },
  {
    path: "/langton",
    title: "Langton's Ant — emergence from one rule",
    description: "Watch Langton's Ant and generalized turmites build order from a single deterministic rule: chaos for thousands of steps, then a spontaneous highway. Pick a rule string over {L,R,U,N} and see wildly different attractors emerge — no randomness.",
    category: "generative",
  },
  {
    path: "/cyclic",
    title: "Cyclic Automaton — spirals from rock-paper-scissors",
    description: "Griffeath's cyclic cellular automaton: each color is beaten by the next in the cycle and advances when enough neighbors already hold it. From pure noise, the rock-paper-scissors rule self-organizes into rotating spiral waves. Tune states and threshold live.",
    category: "generative",
  },
  {
    path: "/slime",
    title: "Slime Mold — physarum vein networks",
    description: "Thousands of agents deposit and chase pheromone trails, self-organizing into living vein networks — the classic Physarum simulation.",
    category: "generative",
  },
  {
    path: "/reaction",
    title: "Reaction-Diffusion — Turing patterns live",
    description: "The Gray-Scott model: two diffusing chemicals react into spots, stripes, coral, and mazes — the math behind how a leopard gets its spots, running in your browser.",
    category: "generative",
  },
  {
    path: "/wfc",
    title: "Wave Function Collapse — constraint-based circuit generator",
    description: "Watch Wave Function Collapse solve a tiled circuit board from local adjacency rules alone: the lowest-entropy cell collapses, constraints propagate, and a coherent matrix-green pattern emerges from pure logic.",
    category: "generative",
  },
  {
    path: "/mandelbrot",
    title: "Mandelbrot Set — infinite zoom explorer",
    description: "Explore the Mandelbrot set: z ↦ z² + c iterated, with smooth escape-time coloring and click-to-zoom into the infinitely detailed boundary.",
    category: "generative",
  },
  {
    path: "/newton",
    title: "Newton Fractal — basins of attraction",
    description: "Newton's method for finding polynomial roots draws a fractal: each point is colored by which root it converges to. Scroll to zoom into the infinitely detailed basin boundaries.",
    category: "generative",
  },
  {
    path: "/chaos",
    title: "Chaos Game — fractals from random jumps",
    description: "Watch a single point hop under randomly chosen affine maps and converge to exact fractals — the Sierpiński triangle, Barnsley fern, Heighway dragon, Lévy C curve, and a fractal spiral.",
    category: "generative",
  },
  {
    path: "/lsystem",
    title: "L-System Garden — fractal plants from rewrite rules",
    description: "Grow ferns, dragon curves, and Koch snowflakes from L-system rewrite rules with turtle graphics — tune depth and branching angle live.",
    category: "generative",
  },
  {
    path: "/fourier",
    title: "Fourier Epicycles — waves from circles",
    description: "Watch rotating circles stack harmonics into square, sawtooth, and triangle waves — Fourier series drawn live, complete with Gibbs ringing at the corners.",
    category: "generative",
  },
  {
    path: "/lissajous",
    title: "Harmonograph — Lissajous curve drawer",
    description: "Watch a virtual harmonograph draw damped Lissajous figures line by line. Tune frequency ratio, detune, phase, and damping, or roll a random figure.",
    category: "generative",
  },
  {
    path: "/collatz",
    title: "Collatz Coral — the 3n+1 conjecture as a growing tree",
    description: "Draw thousands of Collatz (3n+1) trajectories from a shared root, bending one way at each even step and the other at each odd. The paths merge on their common tails into an organic coral.",
    category: "generative",
  },
  {
    path: "/terrain",
    title: "Fractal Terrain — diamond-square heightmaps",
    description: "Generate procedural terrain with the diamond-square algorithm: seed four corners, set each midpoint to its neighbors' average plus a shrinking random nudge, repeat.",
    category: "generative",
  },
  {
    path: "/metaballs",
    title: "Metaballs — marching-squares iso-contours",
    description: "Watch organic blobs merge and split as marching squares traces the iso-contour of their combined inverse-square field. Tune the ball count, threshold, and speed.",
    category: "generative",
  },
  {
    path: "/fireworks",
    title: "Fireworks — particle show",
    description: "Click to launch rockets and watch physics-based firework bursts — spheres, rings, and golden willows with glitter, gravity, and additive glow.",
    category: "generative",
  },
  {
    path: "/ascii",
    title: "ASCII Art Generator",
    description: "Type text and watch it rendered as ASCII art in real time. Multiple character sets: classic ASCII, Unicode blocks, matrix glyphs, and binary.",
    category: "generative",
  },
  {
    path: "/spectrum",
    title: "Spectrogram — live audio frequency analyzer",
    description: "Turn your microphone into a scrolling spectrogram and live bar spectrum via the Web Audio FFT — whistle, hum, or play music and watch the harmonics. Audio stays on-device.",
    category: "generative",
  },
  {
    path: "/snake",
    title: "Snake — classic arcade game",
    description: "Play classic snake in the terminal aesthetic: arrows or WASD to steer, speed ramps up as you grow, best score saved locally.",
    category: "play",
  },
  {
    path: "/2048",
    title: "2048 — terminal edition",
    description: "Play 2048 in the terminal aesthetic: arrows, WASD, or swipe to slide tiles, merge to 2048 and beyond, best score saved locally.",
    category: "play",
  },
  {
    path: "/mines",
    title: "Minesweeper — terminal edition",
    description: "Classic minesweeper with first-click safety, flood-fill reveals, flags, chording, three difficulties, and a timer — in the terminal aesthetic.",
    category: "play",
  },
  {
    path: "/type",
    title: "Typing Speed Test — WPM & accuracy",
    description: "Measure your typing speed and accuracy with tech and programming quotes. Get instant WPM, accuracy, and time results.",
    category: "play",
  },
  {
    path: "/raycast",
    title: "Raycaster — pseudo-3D from a flat grid",
    description: "Walk a maze rendered the Wolfenstein way: one ray per screen column, walked cell by cell through a 2D grid with a digital differential analyser. No 3D geometry involved.",
    category: "play",
  },
];

const BY_PATH = new Map(EXPERIMENTS.map((e) => [e.path, e]));

/** SEO props for an experiment route. Throws at startup if the path is not catalogued. */
export function experimentSeo(path: string): { title: string; description: string } {
  const e = BY_PATH.get(path);
  if (!e) throw new Error(`Experiment ${path} is routed but missing from src/lib/experiments.ts`);
  return { title: e.title, description: e.description };
}
