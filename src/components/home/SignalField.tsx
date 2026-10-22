import { useEffect, useRef, type RefObject } from "react";

type Props = {
  /** The heading whose letterforms the samples settle into. Its lines are `[data-signal-line]` children. */
  target: RefObject<HTMLElement | null>;
  /** 0 = clean signal, 1 = all noise. */
  noise: number;
  /** Called once the field is drawing, with the number of samples. */
  onReady?: (samples: number) => void;
};

const INK = "243, 241, 232";
const SIGNAL = "215, 255, 95";
const LENS = 120;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Signal over the first few seconds: the name is there, drowns in noise, then locks back in. */
function intro(seconds: number) {
  if (seconds < 0.15) return 1;
  if (seconds < 0.7) return 1 - 0.92 * easeInOut((seconds - 0.15) / 0.55);
  if (seconds < 2.8) return 0.08 + 0.92 * (1 - (1 - (seconds - 0.7) / 2.1) ** 3);
  return 1;
}

/**
 * The hero name as a point cloud: every dot is a sample that settles onto the letterforms as the
 * signal rises and scatters as noise is added. The pointer is a lens that knocks samples loose.
 */
export default function SignalField({ target, noise, onReady }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef(noise);
  const redraw = useRef<() => void>(() => {});
  const ready = useRef(onReady);

  useEffect(() => {
    ready.current = onReady;
  }, [onReady]);

  useEffect(() => {
    noiseRef.current = noise;
    redraw.current();
  }, [noise]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const heading = target.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !heading || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const listeners = new AbortController();
    const { signal } = listeners;

    let width = 0;
    let height = 0;
    let count = 0;
    let dots = 0; // samples belonging to the accent full stop are stored last
    let floor = 0; // samples that never resolve: the noise floor
    let tx = new Float32Array(0);
    let ty = new Float32Array(0);
    let nx = new Float32Array(0);
    let ny = new Float32Array(0);
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let delay = new Float32Array(0);
    let seed = new Float32Array(0);
    const pointer = { x: -9999, y: -9999 };

    const build = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      // Draw the heading off-screen exactly where the DOM lays it out, then sample its pixels.
      const stencil = document.createElement("canvas");
      stencil.width = width;
      stencil.height = height;
      const pen = stencil.getContext("2d", { willReadFrequently: true });
      if (!pen) return;
      const style = getComputedStyle(heading);
      const fontSize = parseFloat(style.fontSize);
      pen.font = `${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      pen.textBaseline = "alphabetic";
      if ("letterSpacing" in pen) (pen as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = style.letterSpacing;
      heading.querySelectorAll<HTMLElement>("[data-signal-line]").forEach((line) => {
        const box = line.getBoundingClientRect();
        const text = line.dataset.signalLine ?? "";
        const accent = line.dataset.signalAccent ?? "";
        const metrics = pen.measureText(text + accent);
        const ascent = metrics.fontBoundingBoxAscent ?? fontSize * 0.8;
        const descent = metrics.fontBoundingBoxDescent ?? fontSize * 0.2;
        const x = box.left - bounds.left;
        const baseline = box.top - bounds.top + (box.height - (ascent + descent)) / 2 + ascent;
        pen.fillStyle = "#fff";
        pen.fillText(text, x, baseline);
        pen.fillStyle = "#f00";
        pen.fillText(accent, x + pen.measureText(text).width, baseline);
      });

      const pixels = pen.getImageData(0, 0, width, height).data;
      const budget = width < 768 ? 5000 : 9000;
      let step = 1.7;
      let ink: number[] = [];
      let accent: number[] = [];
      for (let attempt = 0; attempt < 6; attempt++) {
        ink = [];
        accent = [];
        for (let y = 0; y < height; y += step) {
          for (let x = 0; x < width; x += step) {
            const i = (Math.floor(y) * width + Math.floor(x)) * 4;
            if (pixels[i + 3] < 128) continue;
            (pixels[i + 1] < 128 ? accent : ink).push(x, y);
          }
        }
        if ((ink.length + accent.length) / 2 <= budget) break;
        step *= 1.18;
      }

      const lettered = (ink.length + accent.length) / 2;
      floor = Math.round(lettered * 0.07) + 120;
      count = lettered + floor;
      dots = accent.length / 2;
      const all = [...ink, ...accent];
      tx = new Float32Array(count);
      ty = new Float32Array(count);
      nx = new Float32Array(count);
      ny = new Float32Array(count);
      ox = new Float32Array(count);
      oy = new Float32Array(count);
      vx = new Float32Array(count);
      vy = new Float32Array(count);
      delay = new Float32Array(count);
      seed = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        nx[i] = Math.random() * width;
        ny[i] = Math.random() * height;
        seed[i] = Math.random();
        delay[i] = Math.random() * 0.55;
        // Floor samples target their own scattered position.
        tx[i] = i < floor ? nx[i] : all[(i - floor) * 2] + (Math.random() - 0.5) * step * 0.6;
        ty[i] = i < floor ? ny[i] : all[(i - floor) * 2 + 1] + (Math.random() - 0.5) * step * 0.6;
      }
      heading.dataset.signalLive = "true";
      ready.current?.(lettered);
    };

    let started = performance.now();
    const draw = (now: number) => {
      const seconds = reduced ? 99 : (now - started) / 1000;
      const sigma = noiseRef.current;
      const lock = intro(seconds);
      const shimmer = reduced ? 0 : 0.45 + sigma * 5;
      ctx.clearRect(0, 0, width, height);

      for (let pass = 0; pass < 3; pass++) {
        const from = pass === 0 ? 0 : pass === 1 ? floor : count - dots;
        const to = pass === 0 ? floor : pass === 1 ? count - dots : count;
        ctx.fillStyle = pass === 0 ? `rgba(${INK}, 0.26)` : pass === 1 ? `rgba(${INK}, 0.92)` : `rgb(${SIGNAL})`;
        const size = pass === 0 ? 1.2 : 1.45;
        for (let i = from; i < to; i++) {
          const drift = seconds * (0.25 + seed[i] * 0.5) + seed[i] * 40;
          const homeX = nx[i] + Math.sin(drift) * 14;
          const homeY = ny[i] + Math.cos(drift * 0.8) * 14;
          let mix = clamp01(lock - delay[i] * (1 - lock) * 1.6);
          mix *= 1 - clamp01(sigma * (0.55 + seed[i] * 0.9));
          mix = mix * mix * (3 - 2 * mix);
          let x = homeX + (tx[i] - homeX) * mix;
          let y = homeY + (ty[i] - homeY) * mix;

          if (!reduced) {
            const dx = x + ox[i] - pointer.x;
            const dy = y + oy[i] - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < LENS && distance > 0.01) {
              const push = (1 - distance / LENS) ** 2 * 2.4;
              vx[i] += (dx / distance) * push + (Math.random() - 0.5) * push;
              vy[i] += (dy / distance) * push + (Math.random() - 0.5) * push;
            }
            vx[i] = (vx[i] - ox[i] * 0.06) * 0.86;
            vy[i] = (vy[i] - oy[i] * 0.06) * 0.86;
            ox[i] += vx[i];
            oy[i] += vy[i];
            x += ox[i] + (Math.random() - 0.5) * shimmer;
            y += oy[i] + (Math.random() - 0.5) * shimmer;
          }
          ctx.fillRect(x, y, size, size);
        }
      }
    };

    let raf = 0;
    let visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      draw(now);
    };
    const sync = () => {
      cancelAnimationFrame(raf);
      if (reduced) draw(performance.now());
      else if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    redraw.current = () => {
      if (reduced) draw(performance.now());
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(canvas);
    document.addEventListener("visibilitychange", sync, { signal });

    const track = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
    };
    window.addEventListener("pointermove", track, { passive: true, signal });
    window.addEventListener("pointerdown", track, { passive: true, signal });

    let resizeTimer = 0;
    let lastWidth = 0;
    const resize = new ResizeObserver(() => {
      // Mobile browsers resize on every toolbar show/hide; only a width change moves the letters.
      const next = Math.round(canvas.getBoundingClientRect().width);
      if (next === lastWidth) return;
      lastWidth = next;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        build();
        sync();
      }, 120);
    });

    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      lastWidth = Math.round(canvas.getBoundingClientRect().width);
      build();
      started = performance.now();
      sync();
      resize.observe(canvas);
    };
    // Sample the real webfont, not the fallback, or the dots land beside the letters.
    const fonts = document.fonts;
    if (fonts?.load) {
      const style = getComputedStyle(heading);
      Promise.race([
        fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`),
        new Promise((done) => window.setTimeout(done, 1500)),
      ]).then(start, start);
    } else start();

    return () => {
      cancelled = true;
      listeners.abort();
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      observer.disconnect();
      resize.disconnect();
      redraw.current = () => {};
      delete heading.dataset.signalLive;
    };
  }, [target]);

  return <canvas ref={canvasRef} className="hx-field" aria-hidden="true" />;
}
