// @vitest-environment jsdom
//
// Render-without-crash smoke test for every page. There were no page-level
// tests at all, so a typo'd import, a bad hook call, or a null-deref in initial
// render on any of the ~115 routes would ship silently (unit tests only cover
// the pure feature logic). This mounts each page in jsdom and fails if it
// throws during initial render/effects.
//
// jsdom has no 2D canvas, no ResizeObserver and no matchMedia, so we stub the
// browser surface the pages touch. requestAnimationFrame is a no-op: the mount
// is what we're testing, not the animation loop. WebGL can't be faked, so the
// one WebGL page (Monogram) is excluded here and covered by the Playwright
// smoke run instead.
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import type { ComponentType } from "react";

function stubContext2D(canvas: HTMLCanvasElement) {
  const noop = () => undefined;
  const base: Record<string, unknown> = {
    canvas,
    measureText: () => ({ width: 0 }),
    getImageData: (_x: number, _y: number, w = 1, h = 1) => ({
      data: new Uint8ClampedArray(Math.max(0, w * h * 4)),
      width: w,
      height: h,
    }),
    createImageData: (w = 1, h = 1) => ({ data: new Uint8ClampedArray(Math.max(0, w * h * 4)), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createConicGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({ setTransform: noop }),
    getContextAttributes: () => ({}),
  };
  // Any method we didn't name resolves to a no-op; any property reads/writes
  // (fillStyle, lineWidth, font, …) are stored on the object.
  return new Proxy(base, {
    get(target, prop: string) {
      if (prop in target) return target[prop];
      return noop;
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  });
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = RO as unknown as typeof ResizeObserver;
  window.IntersectionObserver = RO as unknown as typeof IntersectionObserver;

  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  window.scrollTo = () => {};

  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string) {
    // Only 2D is faked; WebGL can't be, so WebGL pages are excluded from this suite.
    return type === "2d" ? (stubContext2D(this) as unknown as CanvasRenderingContext2D) : null;
  } as typeof HTMLCanvasElement.prototype.getContext;
});

afterEach(() => cleanup());

// Every page module, keyed by file path. Vite resolves this glob at build time.
const modules = import.meta.glob<{ default: ComponentType }>("./*.tsx", { eager: false });

// Needs a real WebGL context, which jsdom cannot provide.
const EXCLUDE = new Set(["./Monogram.tsx"]);

const entries = Object.entries(modules).filter(([path]) => !EXCLUDE.has(path) && !path.endsWith(".test.tsx"));

describe("every page mounts without throwing", () => {
  it("discovered the page set", () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it.each(entries)("%s", async (_path, load) => {
    const mod = await load();
    const Page = mod.default;
    expect(Page, `${_path} has no default export`).toBeTruthy();
    const { unmount } = render(
      <HelmetProvider>
        <MemoryRouter>
          <Page />
        </MemoryRouter>
      </HelmetProvider>,
    );
    unmount();
  });
});
