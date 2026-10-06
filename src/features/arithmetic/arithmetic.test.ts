import { describe, expect, it } from "vitest";
import {
  SAMPLES,
  buildModel,
  decode,
  encode,
  entropyBits,
  huffmanBits,
  huffmanLengths,
  log2Big,
  chooseCode,
} from "./arithmetic";

describe("the model", () => {
  it("counts symbols and builds cumulative ranges that tile the total", () => {
    const model = buildModel("aaabbc");
    expect(model.total).toBe(6);
    expect(model.symbols.map((s) => `${s.ch}${s.count}`)).toEqual(["a3", "b2", "c1"]);
    expect(model.cum).toEqual([0, 3, 5, 6]);
  });
});

describe("round trip", () => {
  it.each(SAMPLES)("decodes $id back to exactly what was encoded", (sample) => {
    const model = buildModel(sample.text);
    const encoded = encode(sample.text, model);
    expect(decode(encoded.code, encoded.bits, model, sample.text.length)).toBe(sample.text);
  });

  it("round-trips awkward inputs", () => {
    for (const text of ["a", "ab", "aaaa", "zyxwv", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaab"]) {
      const model = buildModel(text);
      const encoded = encode(text, model);
      expect(decode(encoded.code, encoded.bits, model, text.length)).toBe(text);
    }
  });

  it("rejects a symbol the model has never seen", () => {
    expect(() => encode("abc", buildModel("ab"))).toThrow();
  });
});

describe("the interval", () => {
  it("only ever narrows, and stays inside the previous step", () => {
    const text = SAMPLES[2].text;
    const model = buildModel(text);
    const { steps } = encode(text, model);
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1];
      const step = steps[i];
      // Rescale the previous interval to this step's denominator to compare.
      const scale = step.den / prev.den;
      expect(step.low >= prev.low * scale).toBe(true);
      expect(step.high <= prev.high * scale).toBe(true);
      expect(step.widthBits).toBeGreaterThanOrEqual(prev.widthBits);
    }
  });

  it("spends exactly the information content of each symbol", () => {
    const text = "aaab";
    const model = buildModel(text);
    const { steps } = encode(text, model);
    // After one 'a' (p = 3/4) the interval should be 0.415 bits narrower.
    expect(steps[0].widthBits).toBeCloseTo(-Math.log2(3 / 4), 9);
    // After "aaab" the width is the product of the probabilities.
    const expected = -Math.log2((3 / 4) ** 3 * (1 / 4));
    expect(steps[3].widthBits).toBeCloseTo(expected, 9);
  });

  it("picks a code that lands strictly inside the final interval", () => {
    for (const sample of SAMPLES) {
      const model = buildModel(sample.text);
      const { low, high, den, bits, code } = encode(sample.text, model);
      const scale = 1n << BigInt(bits);
      // low/den <= code/scale < high/den
      expect(code * den >= low * scale).toBe(true);
      expect(code * den < high * scale).toBe(true);
    }
  });
});

describe("against the alternatives", () => {
  it("comes within two bits of the entropy", () => {
    for (const sample of SAMPLES) {
      const model = buildModel(sample.text);
      const encoded = encode(sample.text, model);
      const entropy = entropyBits(sample.text, model);
      expect(encoded.bits).toBeGreaterThanOrEqual(Math.floor(entropy));
      expect(encoded.bits).toBeLessThanOrEqual(entropy + 2);
    }
  });

  it("beats Huffman badly on a skewed source", () => {
    // 1 in 32: Huffman cannot spend less than one bit per symbol.
    const text = SAMPLES[4].text;
    const model = buildModel(text);
    const arithmetic = encode(text, model).bits;
    const huffman = huffmanBits(text, model);
    expect(huffman).toBe(text.length); // one whole bit each, as predicted
    expect(arithmetic).toBeLessThan(huffman / 2);
  });

  it("ties with Huffman when the probabilities are exact powers of two", () => {
    // Four equally likely symbols: 2 bits each is already optimal.
    const text = SAMPLES[1].text;
    const model = buildModel(text);
    expect(huffmanBits(text, model)).toBe(2 * text.length);
    expect(encode(text, model).bits).toBeLessThanOrEqual(2 * text.length + 2);
  });

  it("never beats the entropy, on any message or on average", () => {
    for (const sample of SAMPLES) {
      const model = buildModel(sample.text);
      const encoded = encode(sample.text, model);
      expect(encoded.bits).toBeGreaterThan(entropyBits(sample.text, model) - 1);
    }
  });

  it("builds a prefix-free Huffman code satisfying Kraft's inequality", () => {
    for (const sample of SAMPLES) {
      const model = buildModel(sample.text);
      const lengths = huffmanLengths(model);
      let kraft = 0;
      for (const symbol of model.symbols) kraft += 2 ** -(lengths.get(symbol.ch) ?? 0);
      expect(kraft).toBeLessThanOrEqual(1.0000001);
    }
  });
});

describe("big-number helpers", () => {
  it("takes logs of numbers far beyond a double", () => {
    expect(log2Big(1n << 10n)).toBeCloseTo(10, 9);
    expect(log2Big(1n << 500n)).toBeCloseTo(500, 6);
    expect(log2Big(3n ** 400n)).toBeCloseTo(400 * Math.log2(3), 4);
  });

  it("sizes the code from the interval width, not from a lucky alignment", () => {
    // A whole-line interval costs one bit; a 1/1024 slice costs about eleven,
    // even when it starts at zero and a one-bit code would decode fine for a
    // receiver who already knew the length.
    expect(chooseCode(0n, 1n, 1n).bits).toBe(1);
    expect(chooseCode(0n, 1n, 1024n).bits).toBeGreaterThanOrEqual(10);
    expect(chooseCode(341n, 342n, 1024n).bits).toBeGreaterThanOrEqual(10);
  });
});
