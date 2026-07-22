export type CipherId = "caesar" | "rot13" | "atbash" | "vigenere";

export const CIPHERS: Record<CipherId, { label: string; note: string; needsKey?: boolean; needsShift?: boolean }> = {
  caesar: { label: "Caesar", note: "shift each letter by n", needsShift: true },
  rot13: { label: "ROT13", note: "caesar with shift 13 — self-inverse" },
  atbash: { label: "Atbash", note: "mirror the alphabet — self-inverse" },
  vigenere: { label: "Vigenère", note: "repeating-key caesar", needsKey: true },
};

const A = 65; // "A"
const a = 97; // "a"

function shiftChar(code: number, shift: number): number {
  if (code >= A && code < A + 26) {
    return A + ((((code - A) + shift) % 26) + 26) % 26;
  }
  if (code >= a && code < a + 26) {
    return a + ((((code - a) + shift) % 26) + 26) % 26;
  }
  return code;
}

export function caesar(text: string, shift: number): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    out += String.fromCharCode(shiftChar(text.charCodeAt(i), shift));
  }
  return out;
}

export function atbash(text: string): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= A && code < A + 26) out += String.fromCharCode(A + (25 - (code - A)));
    else if (code >= a && code < a + 26) out += String.fromCharCode(a + (25 - (code - a)));
    else out += text[i];
  }
  return out;
}

/** Vigenère; non-letter key chars are stripped, empty key returns text unchanged. */
export function vigenere(text: string, key: string, decode: boolean): string {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, "");
  if (cleanKey.length === 0) return text;
  let out = "";
  let k = 0; // key index advances only on letters
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const isUpper = code >= A && code < A + 26;
    const isLower = code >= a && code < a + 26;
    if (isUpper || isLower) {
      const shift = cleanKey.charCodeAt(k % cleanKey.length) - A;
      out += String.fromCharCode(shiftChar(code, decode ? -shift : shift));
      k++;
    } else {
      out += text[i];
    }
  }
  return out;
}

export interface CipherOptions {
  shift: number;
  key: string;
  decode: boolean;
}

export function applyCipher(id: CipherId, text: string, opts: CipherOptions): string {
  switch (id) {
    case "caesar":
      return caesar(text, opts.decode ? -opts.shift : opts.shift);
    case "rot13":
      return caesar(text, 13);
    case "atbash":
      return atbash(text);
    case "vigenere":
      return vigenere(text, opts.key, opts.decode);
  }
}

/** Frequency of A–Z (case-insensitive) as counts, index 0 = A. */
export function letterFrequency(text: string): number[] {
  const counts = new Array<number>(26).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= A && code < A + 26) counts[code - A]++;
    else if (code >= a && code < a + 26) counts[code - a]++;
  }
  return counts;
}
