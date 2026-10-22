import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/<>";
const TICK = 45;

type Props = {
  text: string;
  /** Milliseconds before the decode starts. */
  delay?: number;
  /** Milliseconds between one character locking and the next. */
  stagger?: number;
  className?: string;
};

/**
 * Text that resolves out of cycling glyph noise, left to right. The real text is rendered first and
 * each character's width is frozen before scrambling, so the line never reflows.
 */
export default function ScrambleText({ text, delay = 0, stagger = 22, className }: Props) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = Array.from(node.querySelectorAll<HTMLElement>("[data-char]"));
    const widths = chars.map((char) => char.getBoundingClientRect().width);
    chars.forEach((char, i) => (char.style.width = `${widths[i]}px`));
    const locks = chars.map((_, i) => delay + 180 + i * stagger + (Math.random() - 0.5) * 40);
    const done = chars.map(() => false);
    const cooled = chars.map(() => false);

    let raf = 0;
    let lastTick = -TICK;
    const started = performance.now();
    const frame = (now: number) => {
      const elapsed = now - started;
      const tick = elapsed - lastTick >= TICK;
      if (tick) lastTick = elapsed;
      let pending = 0;
      chars.forEach((char, i) => {
        if (done[i]) {
          // The lock flash holds for 140ms, then the colour transition eases it back.
          if (cooled[i]) return;
          if (elapsed >= locks[i] + 140) {
            cooled[i] = true;
            char.classList.remove("is-locked");
          } else pending++;
          return;
        }
        if (elapsed >= locks[i]) {
          pending++;
          done[i] = true;
          char.textContent = char.dataset.char!;
          char.classList.remove("is-noise");
          char.classList.add("is-locked");
        } else {
          pending++;
          if (tick && elapsed >= delay) {
            char.classList.add("is-noise");
            char.textContent = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
        }
      });
      if (pending > 0) raf = requestAnimationFrame(frame);
      else chars.forEach((char) => (char.style.width = ""));
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      chars.forEach((char) => {
        char.textContent = char.dataset.char!;
        char.classList.remove("is-noise", "is-locked");
        char.style.width = "";
      });
    };
  }, [text, delay, stagger]);

  return (
    <span ref={root} className={className} aria-label={text} role="text">
      {text.split(" ").map((word, w, words) => (
        <span key={`${word}-${w}`} aria-hidden="true">
          <span className="hx-word">
            {Array.from(word).map((char, c) => (
              <span key={c} className="hx-char" data-char={char}>
                {char}
              </span>
            ))}
          </span>
          {w < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
