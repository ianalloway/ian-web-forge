import { describe, expect, it } from "vitest";
import {
  START_ELO,
  expectedScore,
  newLeague,
  playRound,
  rankAgreement,
  type League,
  type Team,
} from "./league";

describe("expectedScore", () => {
  it("is 0.5 for equal ratings", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 12);
  });

  it("is symmetric: the two sides sum to 1", () => {
    expect(expectedScore(1700, 1400) + expectedScore(1400, 1700)).toBeCloseTo(1, 12);
  });

  it("gives a 400-point favorite the classic ~10/11", () => {
    expect(expectedScore(1900, 1500)).toBeCloseTo(10 / 11, 12);
  });

  it("rises monotonically with rating advantage and stays in (0,1)", () => {
    const s = [0, 100, 200, 400, 800].map((d) => expectedScore(1500 + d, 1500));
    for (let i = 1; i < s.length; i++) expect(s[i]).toBeGreaterThan(s[i - 1]);
    expect(s[0]).toBeGreaterThan(0);
    expect(s[s.length - 1]).toBeLessThan(1);
  });
});

function team(id: number, elo: number, trueSkill: number): Team {
  return { id, name: `T${id}`, trueSkill, elo, wins: 0, losses: 0, color: "#000" };
}

describe("playRound", () => {
  it("conserves total Elo (zero-sum updates) and plays a full round robin", () => {
    const teams = [
      team(0, 1500, 1600),
      team(1, 1500, 1500),
      team(2, 1500, 1400),
      team(3, 1500, 1550),
    ];
    const league: League = { teams, history: teams.map((t) => [t.elo]), gamesPlayed: 0 };
    const before = teams.reduce((s, t) => s + t.elo, 0);

    playRound(league, 32);

    const after = league.teams.reduce((s, t) => s + t.elo, 0);
    expect(after).toBeCloseTo(before, 6); // Elo transfers are zero-sum
    const pairs = (teams.length * (teams.length - 1)) / 2;
    expect(league.gamesPlayed).toBe(pairs);
    for (const t of league.teams) expect(t.wins + t.losses).toBe(teams.length - 1);
    for (const h of league.history) expect(h).toHaveLength(2); // seed + one round appended
  });
});

describe("newLeague", () => {
  it("starts every team at START_ELO with an empty record", () => {
    const league = newLeague(4);
    expect(league.teams).toHaveLength(4);
    expect(league.gamesPlayed).toBe(0);
    for (const t of league.teams) {
      expect(t.elo).toBe(START_ELO);
      expect(t.wins).toBe(0);
      expect(t.losses).toBe(0);
    }
    expect(new Set(league.teams.map((t) => t.name)).size).toBe(4); // distinct teams
  });
});

describe("rankAgreement", () => {
  it("is 1 when Elo order matches true-skill order", () => {
    const teams = [team(0, 1600, 1600), team(1, 1500, 1500), team(2, 1400, 1400)];
    expect(rankAgreement({ teams, history: [], gamesPlayed: 0 })).toBe(1);
  });

  it("is 0 when Elo order fully inverts true skill", () => {
    const teams = [team(0, 1400, 1600), team(1, 1500, 1500), team(2, 1600, 1400)];
    expect(rankAgreement({ teams, history: [], gamesPlayed: 0 })).toBe(0);
  });
});
