import { useEffect, useRef, useCallback } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

interface PDFPageProps {
  page: PDFPageProxy;
  scale: number;
  rotation: number;
  onLoad?: () => void;
}

export function PDFPage({ page, scale, rotation, onLoad }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cancel any ongoing render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const viewport = page.getViewport({ scale, rotation });
    const context = canvas.getContext("2d");
    if (!context) return;

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * devicePixelRatio);
    canvas.height = Math.floor(viewport.height * devicePixelRatio);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    context.scale(devicePixelRatio, devicePixelRatio);

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    try {
      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // Render text layer
      if (textLayerRef.current) {
        const textLayer = textLayerRef.current;
        textLayer.innerHTML = "";
        textLayer.style.width = `${Math.floor(viewport.width)}px`;
        textLayer.style.height = `${Math.floor(viewport.height)}px`;

        const textContent = await page.getTextContent();

        // Simple text layer rendering
        for (const item of textContent.items) {
          if (!("str" in item) || !item.str.trim()) continue;

          const tx = item.transform;
          const span = document.createElement("span");
          span.textContent = item.str;

          const [a, b, c, d, e, f] = tx;
          const angle = Math.atan2(b, a);
          const fontSize = Math.sqrt(a * a + b * b);

          span.style.cssText = `
            position: absolute;
            left: ${e}px;
            top: ${viewport.height - f - fontSize}px;
            font-size: ${fontSize}px;
            font-family: sans-serif;
            transform-origin: 0% 100%;
            transform: rotate(${angle}rad) scaleX(${item.width / (item.str.length * fontSize * 0.6 || 1)});
            white-space: pre;
            color: transparent;
            cursor: text;
            user-select: text;
          `;
          textLayer.appendChild(span);
        }
      }

      onLoad?.();
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "RenderingCancelledException") {
        console.error("Page render error:", err);
      }
    }
  }, [page, scale, rotation, onLoad]);

  useEffect(() => {
    render();
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [render]);

  const viewport = page.getViewport({ scale, rotation });

  return (
    <div
      className="relative shadow-lg bg-white"
      style={{
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
      }}
    >
      <canvas ref={canvasRef} className="block" />
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ position: "absolute", top: 0, left: 0 }}
      />
    </div>
  );
}
