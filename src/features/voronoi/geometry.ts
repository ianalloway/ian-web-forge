export interface Site {
  x: number;
  y: number;
  hue: number;
}

export interface Triangle {
  a: number; // index into points
  b: number;
  c: number;
}

export function randomSites(n: number, w: number, h: number): Site[] {
  const margin = 30;
  return Array.from({ length: n }, () => ({
    x: margin + Math.random() * (w - margin * 2),
    y: margin + Math.random() * (h - margin * 2),
    hue: Math.floor(Math.random() * 360),
  }));
}

interface Circumcircle {
  x: number;
  y: number;
  r2: number;
}

function circumcircle(p: Site, q: Site, r: Site): Circumcircle | null {
  const ax = p.x, ay = p.y;
  const bx = q.x, by = q.y;
  const cx = r.x, cy = r.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-9) return null; // collinear
  const a2 = ax * ax + ay * ay;
  const b2 = bx * bx + by * by;
  const c2 = cx * cx + cy * cy;
  const ux = (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d;
  const uy = (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d;
  const dx = ux - ax;
  const dy = uy - ay;
  return { x: ux, y: uy, r2: dx * dx + dy * dy };
}

/**
 * Bowyer-Watson Delaunay triangulation. Adds a super-triangle, inserts
 * each point, removes triangles whose circumcircle contains it, and
 * re-triangulates the resulting cavity. Returns triangles indexing the
 * original sites (super-triangle vertices stripped).
 */
export function delaunay(sites: Site[]): Triangle[] {
  const n = sites.length;
  if (n < 3) return [];

  // Super-triangle enclosing all points
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of sites) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }
  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;
  const dmax = Math.max(dx, dy) * 20;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  // Work on a points array = sites + 3 super vertices
  const pts: Site[] = [
    ...sites,
    { x: midX - dmax, y: midY - dmax, hue: 0 },
    { x: midX, y: midY + dmax, hue: 0 },
    { x: midX + dmax, y: midY - dmax, hue: 0 },
  ];
  const s0 = n, s1 = n + 1, s2 = n + 2;

  let tris: Triangle[] = [{ a: s0, b: s1, c: s2 }];

  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const bad: Triangle[] = [];
    for (const t of tris) {
      const cc = circumcircle(pts[t.a], pts[t.b], pts[t.c]);
      if (cc) {
        const ddx = p.x - cc.x;
        const ddy = p.y - cc.y;
        if (ddx * ddx + ddy * ddy < cc.r2) bad.push(t);
      }
    }

    // Find boundary of the polygonal hole (edges not shared by two bad tris)
    const edges: [number, number][] = [];
    for (const t of bad) {
      const te: [number, number][] = [[t.a, t.b], [t.b, t.c], [t.c, t.a]];
      for (const [u, v] of te) {
        let shared = false;
        for (const t2 of bad) {
          if (t2 === t) continue;
          const has =
            (t2.a === u || t2.b === u || t2.c === u) &&
            (t2.a === v || t2.b === v || t2.c === v);
          if (has) { shared = true; break; }
        }
        if (!shared) edges.push([u, v]);
      }
    }

    tris = tris.filter((t) => !bad.includes(t));
    for (const [u, v] of edges) {
      tris.push({ a: u, b: v, c: i });
    }
  }

  // Drop any triangle touching a super vertex
  return tris.filter(
    (t) => t.a < n && t.b < n && t.c < n
  );
}
