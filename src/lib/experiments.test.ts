import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "./experimentCategories";
import { EXPERIMENTS, experimentSeo } from "./experiments";

const app = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");
const sitemap = readFileSync(new URL("../../public/sitemap.xml", import.meta.url), "utf8");
const routed = new Set([...app.matchAll(/\{ path: "([^"]+)"/g)].map((m) => m[1]));

describe("the experiment catalog", () => {
  it("lists every path once", () => {
    const paths = EXPERIMENTS.map((e) => e.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("only lists experiments that are actually routed", () => {
    for (const e of EXPERIMENTS) expect(routed, e.path).toContain(e.path);
  });

  it("lists every routed demo, so nothing is reachable only by URL", () => {
    const pages = new Set(["/", "/now", "/hireme", "/toolkit", "/demos", "/bots", "/lab", "/monogram", "*"]);
    const listed = new Set(EXPERIMENTS.map((e) => e.path));
    for (const path of routed) if (!pages.has(path)) expect(listed, path).toContain(path);
  });

  it("puts every experiment in a known category, and every category in use", () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const e of EXPERIMENTS) expect(ids).toContain(e.category);
    for (const c of CATEGORIES) expect(EXPERIMENTS.some((e) => e.category === c.id)).toBe(true);
  });

  it("is in the sitemap", () => {
    for (const e of EXPERIMENTS) expect(sitemap).toContain(`<loc>https://ianalloway.xyz${e.path}</loc>`);
    expect(sitemap).toContain("<loc>https://ianalloway.xyz/lab</loc>");
  });

  it("refuses to hand out SEO for an uncatalogued path", () => {
    expect(() => experimentSeo("/nope")).toThrow(/missing/);
    expect(experimentSeo("/judge").title).toMatch(/Judge/);
  });
});
