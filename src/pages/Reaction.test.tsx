// @vitest-environment jsdom
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import * as reaction from "../features/reaction/grayscott";
import Reaction from "./Reaction";

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
    new DOMRect(10, 20, 300, 240),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    setTransform: () => {},
    createImageData: (w: number, h: number) => ({
      data: new Uint8ClampedArray(w * h * 4), width: w, height: h,
    }),
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function canvas() {
  return render(<MemoryRouter><Reaction /></MemoryRouter>).getByRole("img");
}

describe("reaction-diffusion painting", () => {
  it.each(["mouse", "touch", "pen"])("paints immediately on %s press", (pointerType) => {
    const seed = vi.spyOn(reaction, "seed");
    const surface = canvas();
    fireEvent.pointerDown(surface, { pointerType, clientX: 160, clientY: 140 });
    expect(seed).toHaveBeenCalledOnce();
    expect(seed).toHaveBeenCalledWith(expect.objectContaining({ w: 100, h: 80 }), 50, 40, 5);
    const [grid] = seed.mock.calls[0];
    expect(grid.b[40 * grid.w + 50]).toBe(1);
    // Compatibility mouse events must not seed the same press a second time.
    fireEvent.mouseDown(surface, { clientX: 160, clientY: 140 });
    expect(seed).toHaveBeenCalledOnce();
  });

  it.each(["pointerUp", "pointerLeave", "pointerCancel"] as const)(
    "stops painting after %s and allows another stroke",
    (end) => {
      const seed = vi.spyOn(reaction, "seed");
      const surface = canvas();
      const pointer = { pointerType: "touch", clientX: 160, clientY: 140 };
      fireEvent.pointerMove(surface, pointer);
      expect(seed).not.toHaveBeenCalled();
      fireEvent.pointerDown(surface, pointer);
      fireEvent.pointerMove(surface, pointer);
      expect(seed).toHaveBeenCalledTimes(2);
      fireEvent[end](surface, pointer);
      fireEvent.pointerMove(surface, pointer);
      expect(seed).toHaveBeenCalledTimes(2);
      fireEvent.pointerDown(surface, pointer);
      expect(seed).toHaveBeenCalledTimes(3);
    },
  );
});
