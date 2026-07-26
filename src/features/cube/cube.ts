// 2×2×2 Pocket Cube with an optimal solver.
//
// The 24 stickers are derived from 3D geometry rather than hand-written cycle
// lists: each sticker is a (cubie position, outward normal) pair, and a face
// turn is a 90° rotation applied to both. Building the permutations this way
// makes them correct by construction.
//
// Scrambles and solutions both use only U, R and F. That is the standard
// convention for 2×2 (the opposite corner acts as a fixed reference), and it
// keeps the branching factor at 9 so bidirectional BFS finds a provably
// optimal solution.

export type Face = "U" | "R" | "F" | "D" | "L" | "B";
export const FACES: Face[] = ["U", "R", "F", "D", "L", "B"];

/** Sticker colors are stored as indices into FACES. */
export type State = Uint8Array; // length 24

type Vec = [number, number, number];

interface Sticker {
  pos: Vec; // cubie center, components ±1
  normal: Vec; // outward face direction
}

const NORMALS: Record<Face, Vec> = {
  R: [1, 0, 0],
  L: [-1, 0, 0],
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

/** Clockwise rotation (viewed from outside that face) for each face's layer. */
const ROTATE: Record<Face, (v: Vec) => Vec> = {
  U: ([x, y, z]) => [-z, y, x],
  D: ([x, y, z]) => [z, y, -x],
  R: ([x, y, z]) => [x, z, -y],
  L: ([x, y, z]) => [x, -z, y],
  F: ([x, y, z]) => [y, -x, z],
  B: ([x, y, z]) => [-y, x, z],
};

/** The 24 stickers, ordered face-major so the net renders in reading order. */
const STICKERS: Sticker[] = (() => {
  const out: Sticker[] = [];
  for (const f of FACES) {
    const n = NORMALS[f];
    for (const pos of cubiesOnFace(n)) out.push({ pos, normal: n });
  }
  return out;
})();

/** The four cubie positions touching the face with the given normal, ordered
 *  row-major as the face is seen from outside. */
function cubiesOnFace(n: Vec): Vec[] {
  const out: Vec[] = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      out.push(cubieAt(n, row, col));
    }
  }
  return out;
}

/** Inverse of the net layout: which cubie sits at (row, col) of a face. */
function cubieAt(n: Vec, row: number, col: number): Vec {
  const a = col === 0 ? -1 : 1; // left→right
  const b = row === 0 ? -1 : 1; // top→bottom (before per-face fixups)
  if (n[1] === 1) return [a, 1, b]; // U: cols by x, rows by z (back→front)
  if (n[1] === -1) return [a, -1, -b]; // D: rows front→back
  if (n[2] === 1) return [a, -b, 1]; // F: rows top→bottom
  if (n[2] === -1) return [-a, -b, -1]; // B: mirrored horizontally
  if (n[0] === 1) return [1, -b, -a]; // R: cols front→back
  return [-1, -b, a]; // L: cols back→front
}

const key = (v: Vec) => `${v[0]},${v[1]},${v[2]}`;
const STICKER_INDEX = new Map<string, number>(
  STICKERS.map((s, i) => [`${key(s.pos)}|${key(s.normal)}`, i])
);

/** Permutation for one clockwise quarter turn: `perm[i]` is the sticker whose
 *  color ends up at slot `i`. */
function buildPermutation(face: Face): Uint8Array {
  const n = NORMALS[face];
  const axis = n[0] !== 0 ? 0 : n[1] !== 0 ? 1 : 2;
  const sign = n[axis];
  const rot = ROTATE[face];
  const perm = new Uint8Array(24);
  for (let i = 0; i < 24; i++) perm[i] = i;
  for (let i = 0; i < 24; i++) {
    const s = STICKERS[i];
    if (s.pos[axis] !== sign) continue;
    const dest = STICKER_INDEX.get(`${key(rot(s.pos))}|${key(rot(s.normal))}`);
    if (dest === undefined) throw new Error(`unmapped sticker for ${face}`);
    perm[dest] = i; // the color at i moves to dest
  }
  return perm;
}

const PERMS: Record<Face, Uint8Array> = {
  U: buildPermutation("U"),
  R: buildPermutation("R"),
  F: buildPermutation("F"),
  D: buildPermutation("D"),
  L: buildPermutation("L"),
  B: buildPermutation("B"),
};

export type Move = string; // e.g. "U", "R'", "F2"

/** Moves the solver and scrambler are allowed to use. */
export const MOVES: Move[] = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2"];

export function solvedState(): State {
  const s = new Uint8Array(24);
  for (let i = 0; i < 24; i++) s[i] = Math.floor(i / 4);
  return s;
}

export const isSolved = (s: State): boolean => {
  for (let f = 0; f < 6; f++) {
    const c = s[f * 4];
    for (let i = 1; i < 4; i++) if (s[f * 4 + i] !== c) return false;
  }
  return true;
};

function applyPerm(s: State, perm: Uint8Array): State {
  const out = new Uint8Array(24);
  for (let i = 0; i < 24; i++) out[i] = s[perm[i]];
  return out;
}

/** Apply a single move like "R'" or "U2". */
export function applyMove(s: State, move: Move): State {
  const face = move[0] as Face;
  const perm = PERMS[face];
  const times = move.endsWith("2") ? 2 : move.endsWith("'") ? 3 : 1;
  let out = s;
  for (let i = 0; i < times; i++) out = applyPerm(out, perm);
  return out;
}

export function applySequence(s: State, moves: Move[]): State {
  let out = s;
  for (const m of moves) out = applyMove(out, m);
  return out;
}

export function invertMove(m: Move): Move {
  if (m.endsWith("2")) return m;
  return m.endsWith("'") ? m[0] : `${m}'`;
}

export const invertSequence = (moves: Move[]): Move[] => moves.slice().reverse().map(invertMove);

const encode = (s: State): string => String.fromCharCode(...s);

export function scramble(n = 11, rng: () => number = Math.random): { state: State; moves: Move[] } {
  let s = solvedState();
  const moves: Move[] = [];
  let lastFace = "";
  while (moves.length < n) {
    const m = MOVES[(rng() * MOVES.length) | 0];
    if (m[0] === lastFace) continue; // avoid trivially redundant turns
    lastFace = m[0];
    moves.push(m);
    s = applyMove(s, m);
  }
  return { state: s, moves };
}

/**
 * Optimal solution via bidirectional BFS. Searching from both the scrambled
 * state and the solved state halves the depth each side has to reach, which is
 * what makes an exhaustive (and therefore optimal) search tractable here.
 * Returns null only if the cap is exceeded, which cannot happen for reachable
 * states since 2×2 needs at most 11 turns.
 */
export function solve(start: State, maxDepth = 12): Move[] | null {
  if (isSolved(start)) return [];
  const goal = solvedState();

  let fwd = new Map<string, Move[]>([[encode(start), []]]);
  let bwd = new Map<string, Move[]>([[encode(goal), []]]);
  const fwdStates = new Map<string, State>([[encode(start), start]]);
  const bwdStates = new Map<string, State>([[encode(goal), goal]]);

  const stitch = (f: Move[], b: Move[]): Move[] => f.concat(invertSequence(b));

  for (let depth = 0; depth < maxDepth; depth++) {
    // Always expand the smaller frontier.
    const expandForward = fwd.size <= bwd.size;
    const frontier = expandForward ? fwd : bwd;
    const states = expandForward ? fwdStates : bwdStates;
    const other = expandForward ? bwd : fwd;

    const next = new Map<string, Move[]>();
    const nextStates = new Map<string, State>();
    for (const [k, path] of frontier) {
      const s = states.get(k)!;
      for (const m of MOVES) {
        const ns = applyMove(s, m);
        const nk = encode(ns);
        if (frontier.has(nk) || next.has(nk)) continue;
        const npath = path.concat(m);
        const hit = other.get(nk);
        if (hit) {
          return expandForward ? stitch(npath, hit) : stitch(hit, npath);
        }
        next.set(nk, npath);
        nextStates.set(nk, ns);
      }
    }
    if (next.size === 0) return null;
    if (expandForward) {
      fwd = next;
      fwdStates.clear();
      for (const [k, v] of nextStates) fwdStates.set(k, v);
    } else {
      bwd = next;
      bwdStates.clear();
      for (const [k, v] of nextStates) bwdStates.set(k, v);
    }
  }
  return null;
}

/** Face index (0-5) and (row, col) for a sticker slot, for rendering the net. */
export function slotLayout(i: number): { face: Face; row: number; col: number } {
  const f = Math.floor(i / 4);
  const within = i % 4;
  return { face: FACES[f], row: Math.floor(within / 2), col: within % 2 };
}
