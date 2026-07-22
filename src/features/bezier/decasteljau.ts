export interface Pt {
  x: number;
  y: number;
}

/**
 * All interpolation levels of De Casteljau's algorithm at parameter t.
 * levels[0] is the control polygon; each next level lerps adjacent
 * pairs; the final level has a single point — the curve point at t.
 */
export function deCasteljauLevels(points: Pt[], t: number): Pt[][] {
  const levels: Pt[][] = [points];
  let cur = points;
  while (cur.length > 1) {
    const next: Pt[] = [];
    for (let i = 0; i < cur.length - 1; i++) {
      next.push({
        x: cur[i].x + (cur[i + 1].x - cur[i].x) * t,
        y: cur[i].y + (cur[i + 1].y - cur[i].y) * t,
      });
    }
    levels.push(next);
    cur = next;
  }
  return levels;
}

/** Curve point at t (the tip of the De Casteljau pyramid). */
export function bezierPoint(points: Pt[], t: number): Pt {
  const levels = deCasteljauLevels(points, t);
  return levels[levels.length - 1][0];
}

/** Sample the full curve as a polyline. */
export function sampleCurve(points: Pt[], samples = 120): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= samples; i++) {
    out.push(bezierPoint(points, i / samples));
  }
  return out;
}

export function defaultPoints(w: number, h: number): Pt[] {
  return [
    { x: w * 0.15, y: h * 0.75 },
    { x: w * 0.35, y: h * 0.2 },
    { x: w * 0.65, y: h * 0.2 },
    { x: w * 0.85, y: h * 0.75 },
  ];
}

export const MAX_POINTS = 8;
export const MIN_POINTS = 2;
