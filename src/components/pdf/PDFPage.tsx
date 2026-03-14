import { useEffect, useRef, useCallback } from "react";
import type { PDFPageProxy } from "pdfjs-dist";

interface PDFPageProps {
  page: PDFPageProxy;
  scale: number;
  rotation: number;
  invertColors?: boolean;
  searchText?: string;
  onLoad?: () => void;
}

export function PDFPage({
  page,
  scale,
  rotation,
  invertColors,
  searchText,
  onLoad,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const viewport = page.getViewport({ scale, rotation });
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;
    context.scale(dpr, dpr);

    try {
      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;

      // Text layer
      const textLayer = textLayerRef.current;
      if (textLayer) {
        textLayer.innerHTML = "";
        textLayer.style.width = `${Math.floor(viewport.width)}px`;
        textLayer.style.height = `${Math.floor(viewport.height)}px`;

        const textContent = await page.getTextContent();

        for (const item of textContent.items) {
          if (!("str" in item) || !item.str.trim()) continue;

          const [a, b, , d, e, f] = item.transform;
          const angle = Math.atan2(b, a);
          const fontSize = Math.sqrt(a * a + b * b) * scale;
          const x = e * scale;
          const y = viewport.height - f * scale - fontSize;
          const width = item.width * scale;
          const charWidth = item.str.length * fontSize * 0.6 || 1;

          const span = document.createElement("span");

          // Highlight search matches
          if (searchText && item.str.toLowerCase().includes(searchText.toLowerCase())) {
            span.innerHTML = item.str.replace(
              new RegExp(`(${searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
              '<mark style="background:rgba(255,200,0,0.6);color:inherit">$1</mark>'
            );
          } else {
            span.textContent = item.str;
          }

          span.style.cssText = `
            position:absolute;
            left:${x}px;
            top:${y}px;
            font-size:${fontSize}px;
            font-family:sans-serif;
            transform-origin:0% 100%;
            transform:rotate(${angle}rad) scaleX(${width / charWidth});
            white-space:pre;
            color:transparent;
            cursor:text;
            user-select:text;
            pointer-events:auto;
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
  }, [page, scale, rotation, searchText, onLoad]);

  useEffect(() => {
    render();
    return () => {
      renderTaskRef.current?.cancel();
    };
  }, [render]);

  const viewport = page.getViewport({ scale, rotation });

  return (
    <div
      className="relative shadow-md bg-white select-text"
      style={{
        width: Math.floor(viewport.width),
        height: Math.floor(viewport.height),
        filter: invertColors ? "invert(1) hue-rotate(180deg)" : undefined,
      }}
    >
      <canvas ref={canvasRef} className="block" />
      <div
        ref={textLayerRef}
        className="absolute inset-0 overflow-hidden"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
