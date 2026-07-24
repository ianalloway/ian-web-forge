// Convex hull via Andrew's monotone chain, instrumented to emit a frame after
// every push/pop so the construction can be animated step by step.

export interface Pt {
  x: number;
  y: number;
}

/** Signed area × 2 of triangle (o,a,b). >0 = left turn (counter-clockwise). */
export function cross(o: Pt, a: Pt, b: Pt): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export type Phase = "lower" | "upper";

export interface Frame {
  processed: number; // index (in the sorted array) of the point being considered
  chain: number[]; // hull-in-progress as indices into the sorted array
  phase: Phase;
  popped: boolean; // true if this frame is the result of a pop (a rejected turn)
}

export interface HullResult {
  sorted: Pt[]; // points sorted by (x, y)
  frames: Frame[]; // animation trace
  hull: number[]; // final hull as indices into `sorted`, counter-clockwise
}

/**
 * Compute the convex hull and a full animation trace. Points are first sorted
 * by x (then y); the lower hull is swept left→right and the upper hull
 * right→left, discarding any point that would make a clockwise turn.
 */
export function monotoneChain(points: Pt[]): HullResult {
  const order = points.map((_, i) => i).sort((a, b) => points[a].x - points[b].x || points[a].y - points[b].y);
  const P = order.map((i) => points[i]);
  const n = P.length;
  const frames: Frame[] = [];

  if (n < 3) {
    return { sorted: P, frames, hull: P.map((_, i) => i) };
  }

  const build = (from: number, to: number, step: number, phase: Phase, base: number[]): number[] => {
    const stack: number[] = [];
    for (let i = from; i !== to; i += step) {
      while (
        stack.length >= 2 &&
        cross(P[stack[stack.length - 2]], P[stack[stack.length - 1]], P[i]) <= 0
      ) {
        stack.pop();
        frames.push({ processed: i, chain: [...base, ...stack], phase, popped: true });
      }
      stack.push(i);
      frames.push({ processed: i, chain: [...base, ...stack], phase, popped: false });
    }
    return stack;
  };

  const lower = build(0, n, 1, "lower", []);
  // The upper hull is drawn on top of the finished lower hull.
  const upper = build(n - 1, -1, -1, "upper", lower.slice(0, -1));
  const hull = lower.slice(0, -1).concat(upper.slice(0, -1));
  return { sorted: P, frames, hull };
}
