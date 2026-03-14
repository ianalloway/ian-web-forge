import { useState, useEffect, useRef, useCallback } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { PDFPage } from "./PDFPage";
import { Loader2 } from "lucide-react";
import { usePDF } from "@/hooks/usePDF";

interface PDFViewerProps {
  pdfState: ReturnType<typeof usePDF>["state"];
  getPage: ReturnType<typeof usePDF>["getPage"];
  onPageVisible?: (page: number) => void;
}

export function PDFViewer({ pdfState, getPage, onPageVisible }: PDFViewerProps) {
  const { document, currentPage, scale, rotation, isLoading } = pdfState;
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setPageLoading(true);
    setPage(null);
    getPage(currentPage).then((p) => {
      if (!cancelled) {
        setPage(p);
        setPageLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [document, currentPage, getPage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        onPageVisible?.(currentPage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        onPageVisible?.(currentPage - 1);
      }
    },
    [currentPage, onPageVisible]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading || pageLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (!document || !page) return null;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-6"
      tabIndex={0}
      style={{ outline: "none" }}
    >
      <PDFPage
        page={page}
        scale={scale}
        rotation={rotation}
        onLoad={() => {}}
      />
    </div>
  );
}
