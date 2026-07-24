// Wa-Tor: a predator-prey ecosystem on a toroidal grid (Dewdney, 1984). Fish
// wander and breed; sharks hunt fish, breed, and starve without food. The two
// populations chase each other in Lotka-Volterra-style oscillations.

export const EMPTY = 0;
export const FISH = 1;
export const SHARK = 2;

export interface WatorParams {
  fishBreed: number; // chronons a fish must survive before it spawns
  sharkBreed: number; // chronons a shark must survive before it spawns
  sharkStarve: number; // starting/refill energy; a shark dies at 0
  fishEnergy: number; // energy a shark gains per fish eaten
}

export const DEFAULT_PARAMS: WatorParams = {
  fishBreed: 3,
  sharkBreed: 10,
  sharkStarve: 12,
  fishEnergy: 4,
};

export class Wator {
  readonly w: number;
  readonly h: number;
  type: Int8Array;
  age: Int16Array;
  energy: Int16Array;
  params: WatorParams;
  private moved: Uint8Array;
  private order: Int32Array;
  chronon = 0;

  constructor(w: number, h: number, params: WatorParams = DEFAULT_PARAMS) {
    this.w = w;
    this.h = h;
    this.type = new Int8Array(w * h);
    this.age = new Int16Array(w * h);
    this.energy = new Int16Array(w * h);
    this.moved = new Uint8Array(w * h);
    this.order = new Int32Array(w * h);
    for (let i = 0; i < this.order.length; i++) this.order[i] = i;
    this.params = { ...params };
  }

  seed(fishFrac = 0.32, sharkFrac = 0.08) {
    const { type, age, energy } = this;
    for (let i = 0; i < type.length; i++) {
      const r = Math.random();
      if (r < sharkFrac) {
        type[i] = SHARK;
        energy[i] = this.params.sharkStarve;
        age[i] = (Math.random() * this.params.sharkBreed) | 0;
      } else if (r < sharkFrac + fishFrac) {
        type[i] = FISH;
        age[i] = (Math.random() * this.params.fishBreed) | 0;
      } else {
        type[i] = EMPTY;
      }
    }
    this.chronon = 0;
  }

  private neighbors(i: number, out: Int32Array): number {
    const { w, h } = this;
    const x = i % w;
    const y = (i / w) | 0;
    out[0] = y * w + ((x + 1) % w);
    out[1] = y * w + ((x + w - 1) % w);
    out[2] = ((y + 1) % h) * w + x;
    out[3] = ((y + h - 1) % h) * w + x;
    return 4;
  }

  /** Advance one chronon: every creature acts once, in randomized order. */
  step() {
    const { type, age, energy, moved, order, params } = this;
    moved.fill(0);
    // Fisher-Yates shuffle of the processing order.
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    const nb = new Int32Array(4);
    const cand = new Int32Array(4);

    for (let o = 0; o < order.length; o++) {
      const i = order[o];
      if (moved[i]) continue;
      const t = type[i];
      if (t === EMPTY) continue;
      this.neighbors(i, nb);

      if (t === FISH) {
        // Move to a random empty neighbor; breed on reaching maturity.
        let n = 0;
        for (let k = 0; k < 4; k++) if (type[nb[k]] === EMPTY) cand[n++] = nb[k];
        const a = age[i] + 1;
        if (n === 0) {
          age[i] = a;
          moved[i] = 1;
          continue;
        }
        const j = cand[(Math.random() * n) | 0];
        type[j] = FISH;
        moved[j] = 1;
        if (a >= params.fishBreed) {
          age[j] = 0;
          type[i] = FISH;
          age[i] = 0;
          moved[i] = 1;
        } else {
          age[j] = a;
          type[i] = EMPTY;
        }
      } else {
        // Shark: pay the metabolic cost, maybe starve.
        const e = energy[i] - 1;
        if (e <= 0) {
          type[i] = EMPTY;
          continue;
        }
        const a = age[i] + 1;
        // Prefer a fish neighbor; otherwise an empty one.
        let nf = 0;
        for (let k = 0; k < 4; k++) if (type[nb[k]] === FISH) cand[nf++] = nb[k];
        let target = -1;
        let gained = e;
        if (nf > 0) {
          target = cand[(Math.random() * nf) | 0];
          gained = e + params.fishEnergy;
        } else {
          let ne = 0;
          for (let k = 0; k < 4; k++) if (type[nb[k]] === EMPTY) cand[ne++] = nb[k];
          if (ne > 0) target = cand[(Math.random() * ne) | 0];
        }
        if (target < 0) {
          energy[i] = e;
          age[i] = a;
          moved[i] = 1;
          continue;
        }
        type[target] = SHARK;
        moved[target] = 1;
        // Breeding splits the parent's energy with the offspring (energy is
        // conserved, so sharks can't reproduce their way out of starvation).
        if (a >= params.sharkBreed && gained >= 2) {
          const half = gained >> 1;
          energy[target] = gained - half;
          age[target] = 0;
          type[i] = SHARK;
          age[i] = 0;
          energy[i] = half;
          moved[i] = 1;
        } else {
          energy[target] = gained;
          age[target] = a;
          type[i] = EMPTY;
        }
      }
    }
    this.chronon++;
  }

  counts(): { fish: number; sharks: number } {
    const t = this.type;
    let fish = 0;
    let sharks = 0;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === FISH) fish++;
      else if (t[i] === SHARK) sharks++;
    }
    return { fish, sharks };
  }
}
