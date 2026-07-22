export interface Pt {
  x: number;
  y: number;
}

export interface KMeansState {
  centroids: Pt[];
  assignments: number[]; // index into centroids, parallel to points
  iteration: number;
  converged: boolean;
  inertia: number; // sum of squared distances to assigned centroid
}

export const CLUSTER_COLORS = [
  "#00ff41",
  "#00cfff",
  "#ff6b35",
  "#ffe066",
  "#b97eff",
  "#ff4da6",
  "#4dffdb",
  "#ff8fa3",
];

function dist2(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/** k-means++ seeding: spread initial centroids apart probabilistically. */
export function initCentroids(points: Pt[], k: number): Pt[] {
  if (points.length === 0) return [];
  const centroids: Pt[] = [points[Math.floor(Math.random() * points.length)]];
  while (centroids.length < k) {
    const d2s = points.map((p) => Math.min(...centroids.map((c) => dist2(p, c))));
    const total = d2s.reduce((s, d) => s + d, 0);
    if (total === 0) {
      centroids.push(points[Math.floor(Math.random() * points.length)]);
      continue;
    }
    let r = Math.random() * total;
    let idx = 0;
    while (r > d2s[idx] && idx < points.length - 1) {
      r -= d2s[idx];
      idx++;
    }
    centroids.push(points[idx]);
  }
  return centroids.map((c) => ({ ...c }));
}

export function assign(points: Pt[], centroids: Pt[]): number[] {
  return points.map((p) => {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const d = dist2(p, centroids[i]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  });
}

/** One Lloyd iteration: assign, then move centroids to cluster means. */
export function step(points: Pt[], state: KMeansState): KMeansState {
  const k = state.centroids.length;
  const assignments = assign(points, state.centroids);

  const sums: { x: number; y: number; n: number }[] = Array.from({ length: k }, () => ({
    x: 0,
    y: 0,
    n: 0,
  }));
  points.forEach((p, i) => {
    const a = assignments[i];
    sums[a].x += p.x;
    sums[a].y += p.y;
    sums[a].n++;
  });

  const centroids = state.centroids.map((c, i) =>
    // Empty clusters keep their position rather than jumping to NaN
    sums[i].n > 0 ? { x: sums[i].x / sums[i].n, y: sums[i].y / sums[i].n } : { ...c }
  );

  const moved = centroids.some((c, i) => dist2(c, state.centroids[i]) > 0.01);
  let inertia = 0;
  points.forEach((p, i) => {
    inertia += dist2(p, centroids[assignments[i]]);
  });

  return {
    centroids,
    assignments,
    iteration: state.iteration + 1,
    converged: !moved,
    inertia,
  };
}

export type ScatterId = "blobs" | "ring" | "bands" | "uniform";

export const SCATTERS: Record<ScatterId, string> = {
  blobs: "3 blobs",
  ring: "Ring + core",
  bands: "Diagonal bands",
  uniform: "Uniform",
};

export function makeScatter(id: ScatterId, w: number, h: number): Pt[] {
  const pts: Pt[] = [];
  const gauss = () => {
    // Box-Muller
    const u = Math.random() || 1e-9;
    const v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  const clamp = (p: Pt): Pt => ({
    x: Math.max(15, Math.min(w - 15, p.x)),
    y: Math.max(15, Math.min(h - 15, p.y)),
  });

  if (id === "blobs") {
    const centers = [
      { x: w * 0.25, y: h * 0.3 },
      { x: w * 0.7, y: h * 0.25 },
      { x: w * 0.5, y: h * 0.72 },
    ];
    for (const c of centers) {
      for (let i = 0; i < 40; i++) {
        pts.push(clamp({ x: c.x + gauss() * w * 0.05, y: c.y + gauss() * h * 0.07 }));
      }
    }
  } else if (id === "ring") {
    const cx = w / 2, cy = h / 2;
    const R = Math.min(w, h) * 0.32;
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = R + gauss() * R * 0.08;
      pts.push(clamp({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }));
    }
    for (let i = 0; i < 40; i++) {
      pts.push(clamp({ x: cx + gauss() * R * 0.2, y: cy + gauss() * R * 0.2 }));
    }
  } else if (id === "bands") {
    for (let b = 0; b < 3; b++) {
      for (let i = 0; i < 40; i++) {
        const t = Math.random();
        const x = w * 0.1 + t * w * 0.8;
        const y = h * (0.2 + b * 0.25) + t * h * 0.1 + gauss() * h * 0.03;
        pts.push(clamp({ x, y }));
      }
    }
  } else {
    for (let i = 0; i < 120; i++) {
      pts.push({ x: 15 + Math.random() * (w - 30), y: 15 + Math.random() * (h - 30) });
    }
  }
  return pts;
}
