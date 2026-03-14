import { useEffect, useRef, useCallback } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { cn } from "@/lib/utils";

interface PDFThumbnailProps {
  page: PDFPageProxy;
  pageNumber: number;
  isActive: boolean;
  onClick: (pageNumber: number) => void;
}

export function PDFThumbnail({
  page,
  pageNumber,
  isActive,
  onClick,
}: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewport = page.getViewport({ scale: 0.2 });
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    try {
      await page.render({ canvasContext: context, viewport }).promise;
    } catch {
      // Ignore cancelled renders
    }
  }, [page]);

  useEffect(() => {
    render();
  }, [render]);

  const viewport = page.getViewport({ scale: 0.2 });

  return (
    <button
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-md w-full transition-colors cursor-pointer",
        "hover:bg-muted",
        isActive && "bg-primary/10 ring-2 ring-primary"
      )}
      onClick={() => onClick(pageNumber)}
    >
      <div className="shadow-sm overflow-hidden rounded">
        <canvas
          ref={canvasRef}
          style={{
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height),
          }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{pageNumber}</span>
    </button>
  );
}
