export const CRITICAL_P = 0.5927; // site percolation threshold, square lattice

export interface PercField {
  cols: number;
  rows: number;
  noise: Float32Array; // per-site uniform [0,1); site open iff noise < p
}

export function newField(cols: number, rows: number): PercField {
  const noise = new Float32Array(cols * rows);
  for (let i = 0; i < noise.length; i++) noise[i] = Math.random();
  return { cols, rows, noise };
}

export interface PercResult {
  open: Uint8Array; // 1 = open site
  cluster: Int32Array; // cluster id per site, -1 for closed
  spanningId: number; // id of a cluster touching top and bottom, or -1
  openCount: number;
  largestSize: number;
}

/**
 * Threshold the field at p and label clusters with BFS.
 * The spanning cluster (touching both top and bottom rows) is identified
 * if one exists — its appearance is the percolation phase transition.
 */
export function analyze(field: PercField, p: number): PercResult {
  const { cols, rows, noise } = field;
  const n = cols * rows;
  const open = new Uint8Array(n);
  let openCount = 0;
  for (let i = 0; i < n; i++) {
    if (noise[i] < p) { open[i] = 1; openCount++; }
  }

  const cluster = new Int32Array(n).fill(-1);
  let nextId = 0;
  let spanningId = -1;
  let largestSize = 0;
  const queue = new Int32Array(n);

  for (let start = 0; start < n; start++) {
    if (!open[start] || cluster[start] !== -1) continue;
    const id = nextId++;
    let head = 0, tail = 0;
    queue[tail++] = start;
    cluster[start] = id;
    let size = 0;
    let touchesTop = false;
    let touchesBottom = false;

    while (head < tail) {
      const cur = queue[head++];
      size++;
      const x = cur % cols;
      const y = (cur / cols) | 0;
      if (y === 0) touchesTop = true;
      if (y === rows - 1) touchesBottom = true;

      // 4-neighbors
      if (x > 0 && open[cur - 1] && cluster[cur - 1] === -1) { cluster[cur - 1] = id; queue[tail++] = cur - 1; }
      if (x < cols - 1 && open[cur + 1] && cluster[cur + 1] === -1) { cluster[cur + 1] = id; queue[tail++] = cur + 1; }
      if (y > 0 && open[cur - cols] && cluster[cur - cols] === -1) { cluster[cur - cols] = id; queue[tail++] = cur - cols; }
      if (y < rows - 1 && open[cur + cols] && cluster[cur + cols] === -1) { cluster[cur + cols] = id; queue[tail++] = cur + cols; }
    }

    if (size > largestSize) largestSize = size;
    if (touchesTop && touchesBottom && spanningId === -1) spanningId = id;
  }

  return { open, cluster, spanningId, openCount, largestSize };
}
