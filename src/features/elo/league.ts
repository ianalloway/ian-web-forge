export interface Team {
  id: number;
  name: string;
  trueSkill: number; // hidden rating that drives results
  elo: number; // estimated rating, starts at 1500
  wins: number;
  losses: number;
  color: string;
}

export interface League {
  teams: Team[];
  history: number[][]; // per team, elo after each round
  gamesPlayed: number;
}

const TEAM_NAMES = [
  "Nulls", "Vectors", "Tensors", "Kernels", "Lambdas",
  "Daemons", "Ciphers", "Sockets", "Threads", "Stacks",
];

const TEAM_COLORS = [
  "#00ff41", "#00cfff", "#ff6b35", "#ffe066", "#b97eff",
  "#ff4da6", "#4dffdb", "#ff8fa3", "#9dff00", "#ffb84d",
];

export const START_ELO = 1500;

/** Logistic expected score for a vs b given rating difference. */
export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

export function newLeague(teamCount: number): League {
  const idxs = Array.from({ length: TEAM_NAMES.length }, (_, i) => i);
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
  }
  const chosen = idxs.slice(0, teamCount);
  const teams: Team[] = chosen.map((nameIdx, i) => ({
    id: i,
    name: TEAM_NAMES[nameIdx],
    // True skills spread across ~600 Elo points
    trueSkill: START_ELO + (Math.random() - 0.5) * 600,
    elo: START_ELO,
    wins: 0,
    losses: 0,
    color: TEAM_COLORS[nameIdx],
  }));
  return {
    teams,
    history: teams.map(() => [START_ELO]),
    gamesPlayed: 0,
  };
}

/**
 * Play one full round-robin round (every pair plays once) and update
 * Elo from observed results with the given K factor. Mutates the league.
 */
export function playRound(league: League, k: number): void {
  const { teams } = league;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const a = teams[i];
      const b = teams[j];
      // True win probability from hidden skill
      const pTrue = expectedScore(a.trueSkill, b.trueSkill);
      const aWins = Math.random() < pTrue;

      const ea = expectedScore(a.elo, b.elo);
      const sa = aWins ? 1 : 0;
      const delta = k * (sa - ea);
      a.elo += delta;
      b.elo -= delta;

      if (aWins) { a.wins++; b.losses++; }
      else { b.wins++; a.losses++; }
      league.gamesPlayed++;
    }
  }
  teams.forEach((t, idx) => league.history[idx].push(t.elo));
}

/** Spearman-style agreement: fraction of team pairs ordered the same by elo and trueSkill. */
export function rankAgreement(league: League): number {
  const { teams } = league;
  let agree = 0;
  let total = 0;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      total++;
      const eloOrder = Math.sign(teams[i].elo - teams[j].elo);
      const trueOrder = Math.sign(teams[i].trueSkill - teams[j].trueSkill);
      if (eloOrder === trueOrder) agree++;
    }
  }
  return total === 0 ? 1 : agree / total;
}

/** Mean absolute error between elo and (recentered) true skill. */
export function meanAbsError(league: League): number {
  const { teams } = league;
  // Elo is zero-sum around START_ELO; recenter true skills the same way
  const meanTrue = teams.reduce((s, t) => s + t.trueSkill, 0) / teams.length;
  let sum = 0;
  for (const t of teams) {
    sum += Math.abs(t.elo - (t.trueSkill - meanTrue + START_ELO));
  }
  return sum / teams.length;
}
