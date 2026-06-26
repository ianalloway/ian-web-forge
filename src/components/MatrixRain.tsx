import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

interface Column {
  y: number;
  speed: number;
  opacity: number;
  length: number;
}

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (prefersReducedMotion()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 13;
    let columns: Column[] = [];
    let animId: number;
    let lastTime = 0;

    let cssWidth = window.innerWidth;
    let cssHeight = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.floor(cssWidth / fontSize);
      columns = Array.from({ length: cols }, () => ({
        y: Math.random() * -cssHeight,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.4 + Math.random() * 0.6,
        length: 8 + Math.floor(Math.random() * 20),
      }));
    };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    function onVisibilityChange() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
        animId = 0;
      } else if (!animId) {
        lastTime = 0;
        animId = requestAnimationFrame(draw);
      }
    }

    const draw = (time: number) => {
      const delta = time - lastTime;
      if (delta < 28) { // ~35fps cap
        animId = requestAnimationFrame(draw);
        return;
      }
      lastTime = time;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      columns.forEach((col, i) => {
        const x = i * fontSize;

        // Lead character — bright
        if (col.y > 0 && col.y < cssHeight) {
          ctx.fillStyle = `rgba(200, 255, 200, ${col.opacity})`;
          ctx.font = `bold ${fontSize}px "Fira Code", monospace`;
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, col.y);
        }

        // Trail characters
        for (let t = 1; t < col.length; t++) {
          const ty = col.y - t * fontSize;
          if (ty < 0 || ty > cssHeight) continue;
          const fade = 1 - t / col.length;
          // 3% chance of cyan accent
          const isCyan = Math.random() < 0.03;
          if (isCyan) {
            ctx.fillStyle = `rgba(0, 210, 210, ${fade * col.opacity * 0.7})`;
          } else {
            ctx.fillStyle = `rgba(0, 200, 70, ${fade * col.opacity * 0.6})`;
          }
          ctx.font = `${fontSize}px "Fira Code", monospace`;
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, ty);
        }

        col.y += fontSize * col.speed;
        if (col.y > cssHeight + col.length * fontSize && Math.random() > 0.97) {
          col.y = -col.length * fontSize;
          col.speed = 0.5 + Math.random() * 1.5;
          col.opacity = 0.4 + Math.random() * 0.6;
          col.length = 8 + Math.floor(Math.random() * 20);
        }
      });

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.16 }}
    />
  );
};

export default MatrixRain;
