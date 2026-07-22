export type WaveId = "square" | "sawtooth" | "triangle";

export interface Harmonic {
  n: number; // harmonic number
  amp: number; // amplitude
}

export const WAVES: Record<WaveId, { label: string; formula: string }> = {
  square: { label: "Square", formula: "Σ 4/(nπ)·sin(nθ), odd n" },
  sawtooth: { label: "Sawtooth", formula: "Σ 2/(nπ)·(−1)ⁿ⁺¹·sin(nθ)" },
  triangle: { label: "Triangle", formula: "Σ 8/(n²π²)·(−1)^((n−1)/2)·sin(nθ), odd n" },
};

/** First `count` non-zero harmonics of the chosen wave. */
export function harmonics(wave: WaveId, count: number): Harmonic[] {
  const out: Harmonic[] = [];
  if (wave === "square") {
    for (let k = 0; k < count; k++) {
      const n = 2 * k + 1;
      out.push({ n, amp: 4 / (n * Math.PI) });
    }
  } else if (wave === "sawtooth") {
    for (let k = 0; k < count; k++) {
      const n = k + 1;
      out.push({ n, amp: (2 / (n * Math.PI)) * (k % 2 === 0 ? 1 : -1) });
    }
  } else {
    for (let k = 0; k < count; k++) {
      const n = 2 * k + 1;
      const sign = k % 2 === 0 ? 1 : -1;
      out.push({ n, amp: (8 / (n * n * Math.PI * Math.PI)) * sign });
    }
  }
  return out;
}

/**
 * Chained epicycle positions at phase t. Returns the joint positions
 * starting at the origin — the last element is the pen tip.
 */
export function epicyclePoints(hs: Harmonic[], t: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let x = 0, y = 0;
  for (const h of hs) {
    x += h.amp * Math.cos(h.n * t - Math.PI / 2);
    y += h.amp * Math.sin(h.n * t - Math.PI / 2);
    pts.push({ x, y });
  }
  return pts;
}

/** Sum of the series at phase t (the y of the pen tip). */
export function seriesValue(hs: Harmonic[], t: number): number {
  let y = 0;
  for (const h of hs) y += h.amp * Math.sin(h.n * t);
  return y;
}
