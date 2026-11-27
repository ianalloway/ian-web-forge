import { describe, expect, it } from "vitest";
import { height, inOrder, insertAVL, insertBST, isValidAVL, size, type Node } from "./tree";

function buildAVL(keys: number[]): Node | null {
  let root: Node | null = null;
  for (const k of keys) root = insertAVL(root, k).root;
  return root;
}
function buildBST(keys: number[]): Node | null {
  let root: Node | null = null;
  for (const k of keys) root = insertBST(root, k).root;
  return root;
}

const sorted = Array.from({ length: 31 }, (_, i) => i + 1);

describe("insertAVL", () => {
  it("stays a valid, balanced AVL tree for pathological sorted input", () => {
    const root = buildAVL(sorted);
    expect(isValidAVL(root)).toBe(true);
    expect(size(root)).toBe(sorted.length);
  });

  it("keeps keys in sorted order under in-order traversal", () => {
    const root = buildAVL([8, 3, 1, 5, 9, 2, 7, 4, 6]);
    expect(inOrder(root)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("bounds height near 1.44·log2(n)", () => {
    const root = buildAVL(sorted);
    expect(height(root)).toBeLessThanOrEqual(Math.ceil(1.44 * Math.log2(sorted.length + 1)));
  });

  it("ignores duplicate keys", () => {
    const root = buildAVL([5, 5, 5, 3, 3, 8]);
    expect(inOrder(root)).toEqual([3, 5, 8]);
    expect(insertAVL(root, 5).inserted).toBe(false);
  });
});

describe("insertBST vs insertAVL", () => {
  it("a plain BST degenerates to a list on sorted input while AVL stays shallow", () => {
    const bst = buildBST(sorted);
    const avl = buildAVL(sorted);
    expect(height(bst)).toBe(sorted.length); // one node per level — a linked list
    expect(height(avl)).toBeLessThan(height(bst));
    expect(inOrder(bst)).toEqual(inOrder(avl)); // same keys, different shape
  });
});
