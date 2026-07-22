export const MORSE_TABLE: Record<string, string> = {
  a: ".-", b: "-...", c: "-.-.", d: "-..", e: ".", f: "..-.",
  g: "--.", h: "....", i: "..", j: ".---", k: "-.-", l: ".-..",
  m: "--", n: "-.", o: "---", p: ".--.", q: "--.-", r: ".-.",
  s: "...", t: "-", u: "..-", v: "...-", w: ".--", x: "-..-",
  y: "-.--", z: "--..",
  "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
  "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
  ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.",
  "!": "-.-.--", "/": "-..-.", "(": "-.--.", ")": "-.--.-",
  "&": ".-...", ":": "---...", ";": "-.-.-.", "=": "-...-",
  "+": ".-.-.", "-": "-....-", "_": "..--.-", '"': ".-..-.",
  "$": "...-..-", "@": ".--.-.",
};

const REVERSE_TABLE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_TABLE).map(([ch, code]) => [code, ch])
);

/** Encode text to morse; unknown chars are dropped, words separated by " / ". */
export function encode(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("")
        .map((ch) => MORSE_TABLE[ch])
        .filter(Boolean)
        .join(" ")
    )
    .filter((w) => w.length > 0)
    .join(" / ");
}

/** Decode morse (dots/dashes, spaces between letters, / between words). */
export function decode(morse: string): string {
  return morse
    .trim()
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .map((code) => REVERSE_TABLE[code] ?? "")
        .join("")
    )
    .join(" ")
    .trim();
}

/** Does the string look like morse rather than plain text? */
export function looksLikeMorse(s: string): boolean {
  const trimmed = s.trim();
  if (trimmed.length === 0) return false;
  return /^[.\-/\s]+$/.test(trimmed);
}

export interface ToneEvent {
  startUnits: number; // offset in dit units
  durationUnits: number; // dit=1, dah=3
}

/**
 * Timing schedule in dit units following standard morse spacing:
 * intra-letter gap 1, letter gap 3, word gap 7.
 */
export function schedule(morse: string): { events: ToneEvent[]; totalUnits: number } {
  const events: ToneEvent[] = [];
  let t = 0;
  const words = morse.trim().split(/\s*\/\s*/);
  words.forEach((word, wi) => {
    if (wi > 0) t += 7;
    const letters = word.trim().split(/\s+/).filter((l) => l.length > 0);
    letters.forEach((letter, li) => {
      if (li > 0) t += 3;
      letter.split("").forEach((symbol, si) => {
        if (si > 0) t += 1;
        const dur = symbol === "-" ? 3 : 1;
        events.push({ startUnits: t, durationUnits: dur });
        t += dur;
      });
    });
  });
  return { events, totalUnits: t };
}

/** Dit length in seconds at a given WPM (PARIS standard: dit = 1.2 / wpm). */
export function ditSeconds(wpm: number): number {
  return 1.2 / wpm;
}

/** Plays a morse schedule through Web Audio. */
export class MorsePlayer {
  private ctx: AudioContext | null = null;
  private stopFns: (() => void)[] = [];

  private ensureCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /** Returns total duration in seconds. */
  play(morse: string, wpm: number, freq = 600): number {
    this.stop();
    const ctx = this.ensureCtx();
    const dit = ditSeconds(wpm);
    const { events, totalUnits } = schedule(morse);
    const t0 = ctx.currentTime + 0.05;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0;
    osc.connect(gain);
    gain.connect(ctx.destination);

    for (const ev of events) {
      const start = t0 + ev.startUnits * dit;
      const end = start + ev.durationUnits * dit;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.004);
      gain.gain.setValueAtTime(0.4, end - 0.004);
      gain.gain.linearRampToValueAtTime(0, end);
    }

    const total = totalUnits * dit + 0.1;
    osc.start(t0);
    osc.stop(t0 + total);
    this.stopFns.push(() => {
      try { osc.stop(); } catch { /* already stopped */ }
      try { osc.disconnect(); gain.disconnect(); } catch { /* detached */ }
    });
    return total;
  }

  stop(): void {
    for (const fn of this.stopFns) fn();
    this.stopFns = [];
  }

  dispose(): void {
    this.stop();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
