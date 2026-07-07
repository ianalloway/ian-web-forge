export interface NoteSpec {
  label: string;
  freq: number;
  isBlack: boolean;
  key: string;
  /** White key index to the left (black) or own white key position (white) */
  idx: number;
}

export const WHITE_W = 42;
export const BLACK_W = 28;
export const WHITE_H = 128;
export const BLACK_H = 76;
export const NUM_WHITE = 14;

export const NOTES: NoteSpec[] = [
  { label: "C3",  freq: 130.81, isBlack: false, key: "z", idx: 0 },
  { label: "C#3", freq: 138.59, isBlack: true,  key: "s", idx: 0 },
  { label: "D3",  freq: 146.83, isBlack: false, key: "x", idx: 1 },
  { label: "D#3", freq: 155.56, isBlack: true,  key: "d", idx: 1 },
  { label: "E3",  freq: 164.81, isBlack: false, key: "c", idx: 2 },
  { label: "F3",  freq: 174.61, isBlack: false, key: "v", idx: 3 },
  { label: "F#3", freq: 185.00, isBlack: true,  key: "g", idx: 3 },
  { label: "G3",  freq: 196.00, isBlack: false, key: "b", idx: 4 },
  { label: "G#3", freq: 207.65, isBlack: true,  key: "h", idx: 4 },
  { label: "A3",  freq: 220.00, isBlack: false, key: "n", idx: 5 },
  { label: "A#3", freq: 233.08, isBlack: true,  key: "j", idx: 5 },
  { label: "B3",  freq: 246.94, isBlack: false, key: "m", idx: 6 },
  { label: "C4",  freq: 261.63, isBlack: false, key: "q", idx: 7 },
  { label: "C#4", freq: 277.18, isBlack: true,  key: "2", idx: 7 },
  { label: "D4",  freq: 293.66, isBlack: false, key: "w", idx: 8 },
  { label: "D#4", freq: 311.13, isBlack: true,  key: "3", idx: 8 },
  { label: "E4",  freq: 329.63, isBlack: false, key: "e", idx: 9 },
  { label: "F4",  freq: 349.23, isBlack: false, key: "r", idx: 10 },
  { label: "F#4", freq: 369.99, isBlack: true,  key: "5", idx: 10 },
  { label: "G4",  freq: 392.00, isBlack: false, key: "t", idx: 11 },
  { label: "G#4", freq: 415.30, isBlack: true,  key: "6", idx: 11 },
  { label: "A4",  freq: 440.00, isBlack: false, key: "y", idx: 12 },
  { label: "A#4", freq: 466.16, isBlack: true,  key: "7", idx: 12 },
  { label: "B4",  freq: 493.88, isBlack: false, key: "u", idx: 13 },
];

export const KEY_MAP: Record<string, NoteSpec> = {};
for (const n of NOTES) KEY_MAP[n.key] = n;

export type Waveform = "sine" | "triangle" | "square" | "sawtooth";

export class PianoSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private active = new Map<string, { osc: OscillatorNode; env: GainNode; stopAt: number }>();

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  noteOn(label: string, freq: number, waveform: Waveform) {
    const ctx = this.ensureCtx();
    if (this.active.has(label)) return;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.015);
    env.connect(this.masterGain!);

    const osc = ctx.createOscillator();
    osc.type = waveform;
    osc.frequency.value = freq;
    osc.connect(env);
    osc.start();

    this.active.set(label, { osc, env, stopAt: 0 });
  }

  noteOff(label: string) {
    const node = this.active.get(label);
    if (!node || !this.ctx) return;
    const { osc, env } = node;
    const t = this.ctx.currentTime;
    env.gain.cancelScheduledValues(t);
    env.gain.setValueAtTime(env.gain.value, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    osc.stop(t + 0.26);
    this.active.delete(label);
  }

  allNotesOff() {
    for (const label of [...this.active.keys()]) this.noteOff(label);
  }

  destroy() {
    this.allNotesOff();
    this.ctx?.close();
    this.ctx = null;
    this.masterGain = null;
  }
}
