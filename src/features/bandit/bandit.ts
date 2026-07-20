export type StrategyId = "greedy" | "egreedy" | "ucb" | "thompson";

export const STRATEGIES: Record<StrategyId, { label: string; color: string; note: string }> = {
  greedy:   { label: "Greedy",   color: "#ff6b35", note: "always the current best — gets stuck" },
  egreedy:  { label: "ε-greedy", color: "#ffe066", note: "explore 10% of the time" },
  ucb:      { label: "UCB1",     color: "#00cfff", note: "optimism under uncertainty" },
  thompson: { label: "Thompson", color: "#00ff41", note: "sample from the posterior" },
};

export interface ArmStats {
  pulls: number;
  wins: number;
}

export interface Agent {
  strategy: StrategyId;
  arms: ArmStats[];
  totalPulls: number;
  totalReward: number;
}

export function newAgent(strategy: StrategyId, k: number): Agent {
  return {
    strategy,
    arms: Array.from({ length: k }, () => ({ pulls: 0, wins: 0 })),
    totalPulls: 0,
    totalReward: 0,
  };
}

/** Gamma(alpha,1) sampler (Marsaglia-Tsang) for Beta sampling. */
function randGamma(alpha: number): number {
  if (alpha < 1) {
    // boost then correct
    const u = Math.random();
    return randGamma(alpha + 1) * Math.pow(u, 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      // Box-Muller normal
      const u1 = Math.random() || 1e-9;
      const u2 = Math.random();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function betaSample(a: number, b: number): number {
  const x = randGamma(a);
  const y = randGamma(b);
  return x / (x + y);
}

/** Choose an arm per the agent's strategy. */
function chooseArm(agent: Agent): number {
  const { arms, strategy, totalPulls } = agent;
  const k = arms.length;

  // Ensure every arm is tried once first (for greedy/egreedy/ucb)
  if (strategy !== "thompson") {
    for (let i = 0; i < k; i++) if (arms[i].pulls === 0) return i;
  }

  if (strategy === "greedy") {
    return argmax(arms.map((a) => a.wins / a.pulls));
  }
  if (strategy === "egreedy") {
    if (Math.random() < 0.1) return Math.floor(Math.random() * k);
    return argmax(arms.map((a) => a.wins / a.pulls));
  }
  if (strategy === "ucb") {
    const t = Math.max(1, totalPulls);
    return argmax(
      arms.map((a) => a.wins / a.pulls + Math.sqrt((2 * Math.log(t)) / a.pulls))
    );
  }
  // thompson: sample Beta(wins+1, losses+1) per arm, pick the max draw
  return argmax(arms.map((a) => betaSample(a.wins + 1, a.pulls - a.wins + 1)));
}

function argmax(xs: number[]): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[best]) best = i;
  return best;
}

/** Pull one arm against the true win rates and record the Bernoulli reward. */
export function pull(agent: Agent, trueRates: number[]): number {
  const arm = chooseArm(agent);
  const reward = Math.random() < trueRates[arm] ? 1 : 0;
  agent.arms[arm].pulls++;
  agent.arms[arm].wins += reward;
  agent.totalPulls++;
  agent.totalReward += reward;
  return arm;
}

/** Regret vs always playing the best arm. */
export function regret(agent: Agent, trueRates: number[]): number {
  const best = Math.max(...trueRates);
  return best * agent.totalPulls - agent.totalReward;
}

export function randomRates(k: number): number[] {
  return Array.from({ length: k }, () => 0.15 + Math.random() * 0.65);
}
