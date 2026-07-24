// Diamond-square (midpoint displacement) terrain generation. On a
// (2^n + 1) square grid, seed the corners then repeatedly set the centre of
// every square (diamond step) and the midpoint of every edge (square step) to
// the average of their neighbors plus a random offset that shrinks by
// `persistence` each level — producing a fractal heightmap.

export interface Terrain {
  size: number;
  heights: Float32Array; // normalized to [0, 1]
}

/**
 * Generate a heightmap. `n` sets the grid size (2^n + 1). `persistence` in
 * (0,1) controls roughness: higher keeps more fine detail (rougher terrain).
 */
export function diamondSquare(n: number, persistence: number, rng: () => number = Math.random): Terrain {
  const size = (1 << n) + 1;
  const h = new Float32Array(size * size);
  const idx = (x: number, y: number) => y * size + x;
  const rand = (scale: number) => (rng() * 2 - 1) * scale;

  h[idx(0, 0)] = rng();
  h[idx(size - 1, 0)] = rng();
  h[idx(0, size - 1)] = rng();
  h[idx(size - 1, size - 1)] = rng();

  let step = size - 1;
  let scale = 1;
  while (step > 1) {
    const half = step >> 1;

    // Diamond step: centre of each square.
    for (let y = half; y < size; y += step) {
      for (let x = half; x < size; x += step) {
        const a = h[idx(x - half, y - half)];
        const b = h[idx(x + half, y - half)];
        const c = h[idx(x - half, y + half)];
        const d = h[idx(x + half, y + half)];
        h[idx(x, y)] = (a + b + c + d) / 4 + rand(scale);
      }
    }

    // Square step: midpoint of each edge (staggered rows).
    for (let y = 0; y < size; y += half) {
      for (let x = (y + half) % step; x < size; x += step) {
        let sum = 0;
        let count = 0;
        if (x - half >= 0) {
          sum += h[idx(x - half, y)];
          count++;
        }
        if (x + half < size) {
          sum += h[idx(x + half, y)];
          count++;
        }
        if (y - half >= 0) {
          sum += h[idx(x, y - half)];
          count++;
        }
        if (y + half < size) {
          sum += h[idx(x, y + half)];
          count++;
        }
        h[idx(x, y)] = sum / count + rand(scale);
      }
    }

    step = half;
    scale *= persistence;
  }

  // Normalize to [0, 1].
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < h.length; i++) {
    if (h[i] < min) min = h[i];
    if (h[i] > max) max = h[i];
  }
  const range = max - min || 1;
  for (let i = 0; i < h.length; i++) h[i] = (h[i] - min) / range;

  return { size, heights: h };
}
