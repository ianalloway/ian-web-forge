// Metaballs via marching squares. Each ball contributes an inverse-square
// scalar field; the surface is the iso-line where the summed field equals a
// threshold. Marching squares walks a sample grid and, per cell, emits linearly
// interpolated line segments along the iso-contour — so the blobs merge and
// split smoothly.

export interface Ball {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
}

/** Summed inverse-square field at (px, py). */
export function fieldAt(px: number, py: number, balls: Ball[]): number {
  let sum = 0;
  for (const b of balls) {
    const dx = px - b.x;
    const dy = py - b.y;
    const d2 = dx * dx + dy * dy;
    sum += (b.r * b.r) / (d2 + 1e-6);
  }
  return sum;
}

// Per case (bit 8=TL,4=TR,2=BR,1=BL over iso), the edge pairs to connect.
// Edges: 0=top, 1=right, 2=bottom, 3=left.
const CASES: number[][][] = [
  [], // 0
  [[3, 2]], // 1  BL
  [[2, 1]], // 2  BR
  [[3, 1]], // 3  BL+BR
  [[0, 1]], // 4  TR
  [[0, 3], [2, 1]], // 5  TR+BL (ambiguous)
  [[0, 2]], // 6  TR+BR
  [[0, 3]], // 7  TR+BR+BL
  [[0, 3]], // 8  TL
  [[0, 2]], // 9  TL+BL
  [[0, 1], [3, 2]], // 10 TL+BR (ambiguous)
  [[0, 1]], // 11 TL+BR+BL
  [[3, 1]], // 12 TL+TR
  [[2, 1]], // 13 TL+TR+BL
  [[3, 2]], // 14 TL+TR+BR
  [], // 15
];

/**
 * Marching squares over a grid of node samples. `values[gy*cols+gx]` holds the
 * field at grid node (gx, gy). Returns a flat list [x0,y0,x1,y1,...] of segment
 * endpoints in pixel space, given the grid origin (ox,oy) and cell size (cw,ch).
 */
export function marchingSquares(
  values: Float32Array,
  cols: number,
  rows: number,
  iso: number,
  ox: number,
  oy: number,
  cw: number,
  ch: number
): number[] {
  const segs: number[] = [];
  // Interpolate the crossing fraction on an edge from value a to b.
  const t = (a: number, b: number) => {
    const denom = b - a;
    return Math.abs(denom) < 1e-9 ? 0.5 : (iso - a) / denom;
  };

  for (let gy = 0; gy < rows - 1; gy++) {
    for (let gx = 0; gx < cols - 1; gx++) {
      const tl = values[gy * cols + gx];
      const tr = values[gy * cols + gx + 1];
      const bl = values[(gy + 1) * cols + gx];
      const br = values[(gy + 1) * cols + gx + 1];
      let c = 0;
      if (tl > iso) c |= 8;
      if (tr > iso) c |= 4;
      if (br > iso) c |= 2;
      if (bl > iso) c |= 1;
      const segList = CASES[c];
      if (segList.length === 0) continue;

      const x0 = ox + gx * cw;
      const y0 = oy + gy * ch;
      // Edge midpoints (interpolated).
      const pt = (edge: number): [number, number] => {
        switch (edge) {
          case 0:
            return [x0 + t(tl, tr) * cw, y0];
          case 1:
            return [x0 + cw, y0 + t(tr, br) * ch];
          case 2:
            return [x0 + t(bl, br) * cw, y0 + ch];
          default:
            return [x0, y0 + t(tl, bl) * ch];
        }
      };

      for (const [e1, e2] of segList) {
        const a = pt(e1);
        const b = pt(e2);
        segs.push(a[0], a[1], b[0], b[1]);
      }
    }
  }
  return segs;
}
