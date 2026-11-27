import { describe, expect, it } from "vitest";
import { analyze, buildCodes, buildTree, decode, encode, frequencies } from "./huffman";

describe("frequencies", () => {
  it("counts each character", () => {
    const f = frequencies("abracadabra");
    expect(f.get("a")).toBe(5);
    expect(f.get("b")).toBe(2);
    expect(f.get("r")).toBe(2);
    expect(f.get("c")).toBe(1);
    expect(f.get("d")).toBe(1);
  });
});

describe("encode/decode round-trip", () => {
  for (const text of ["abracadabra", "mississippi", "the quick brown fox", "aaaaaa", "a"]) {
    it(`recovers ${JSON.stringify(text)}`, () => {
      const freqs = frequencies(text);
      const codes = buildCodes(buildTree(freqs));
      const tree = buildTree(freqs);
      const bits = encode(text, codes);
      expect(/^[01]*$/.test(bits)).toBe(true);
      expect(decode(bits, tree)).toBe(text);
    });
  }

  it("returns empty structures for empty input", () => {
    expect(buildTree(frequencies(""))).toBeNull();
    expect(decode("", null)).toBe("");
  });
});

describe("buildCodes", () => {
  it("produces a prefix-free code (no code is a prefix of another)", () => {
    const codes = [...buildCodes(buildTree(frequencies("abracadabra"))).values()];
    for (let i = 0; i < codes.length; i++) {
      for (let j = 0; j < codes.length; j++) {
        if (i !== j) expect(codes[i].startsWith(codes[j])).toBe(false);
      }
    }
  });

  it("gives more frequent symbols codes no longer than rarer ones", () => {
    const codes = buildCodes(buildTree(frequencies("aaaaaaaabbbbccd")));
    expect(codes.get("a")!.length).toBeLessThanOrEqual(codes.get("c")!.length);
    expect(codes.get("a")!.length).toBeLessThanOrEqual(codes.get("d")!.length);
  });
});

describe("analyze", () => {
  it("never expands repetitive text and reports a consistent ratio", () => {
    const stats = analyze("aaaaaaaabbbbccd");
    expect(stats.encodedBits).toBeLessThanOrEqual(stats.originalBits);
    expect(stats.ratio).toBeCloseTo(stats.encodedBits / stats.originalBits, 12);
    expect(stats.avgBitsPerChar).toBeGreaterThan(0);
  });

  it("codes a single repeated symbol at one bit per char", () => {
    const stats = analyze("zzzz");
    expect(stats.avgBitsPerChar).toBe(1);
    expect(stats.codes.get("z")).toBe("0");
  });
});
