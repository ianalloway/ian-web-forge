import { useEffect, useRef } from 'react';

const CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';

const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 14;
    let columns: number[] = [];
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: cols }, () => Math.random() * -canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      columns.forEach((y, i) => {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;

        // Lead character — bright white-green
        if (y > 0 && y < canvas.height) {
          ctx.fillStyle = 'rgba(180, 255, 180, 0.95)';
          ctx.font = `bold ${fontSize}px "Fira Code", monospace`;
          ctx.fillText(char, x, y);
        }

        // Trail character — standard green, occasional cyan accent
        const trailChar = CHARS[Math.floor(Math.random() * CHARS.length)];
        const trailY = y - fontSize;
        if (trailY > 0 && trailY < canvas.height) {
          const isCyan = Math.random() < 0.04;
          ctx.fillStyle = isCyan
            ? 'rgba(0, 220, 220, 0.7)'
            : 'rgba(0, 200, 80, 0.55)';
          ctx.font = `${fontSize}px "Fira Code", monospace`;
          ctx.fillText(trailChar, x, trailY);
        }

        if (y > canvas.height && Math.random() > 0.975) {
          columns[i] = 0;
        } else {
          columns[i] = y + fontSize;
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
      style={{ opacity: 0.18 }}
    />
  );
};

export default MatrixRain;