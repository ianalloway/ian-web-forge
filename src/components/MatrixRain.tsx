import { useEffect, useRef } from 'react';

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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 13;
    let columns: Column[] = [];
    let animId: number;
    let lastTime = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: cols }, () => ({
        y: Math.random() * -canvas.height,
        speed: 0.5 + Math.random() * 1.5,
        opacity: 0.4 + Math.random() * 0.6,
        length: 8 + Math.floor(Math.random() * 20),
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = (time: number) => {
      const delta = time - lastTime;
      if (delta < 28) { // ~35fps cap
        animId = requestAnimationFrame(draw);
        return;
      }
      lastTime = time;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      columns.forEach((col, i) => {
        const x = i * fontSize;

        // Lead character — bright
        if (col.y > 0 && col.y < canvas.height) {
          ctx.fillStyle = `rgba(200, 255, 200, ${col.opacity})`;
          ctx.font = `bold ${fontSize}px "Fira Code", monospace`;
          ctx.fillText(CHARS[Math.floor(Math.random() * CHARS.length)], x, col.y);
        }

        // Trail characters
        for (let t = 1; t < col.length; t++) {
          const ty = col.y - t * fontSize;
          if (ty < 0 || ty > canvas.height) continue;
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
        if (col.y > canvas.height + col.length * fontSize && Math.random() > 0.97) {
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
