import { useState, useEffect, useCallback } from "react";
import type { PDFPageProxy } from "pdfjs-dist";
import { PDFPage } from "./PDFPage";
import { usePDF } from "@/hooks/usePDF";

interface PDFViewerProps {
  pdfState: ReturnType<typeof usePDF>["state"];
  getPage: ReturnType<typeof usePDF>["getPage"];
  onPageVisible?: (page: number) => void;
}

export function PDFViewer({ pdfState, getPage, onPageVisible }: PDFViewerProps) {
  const { document, currentPage, scale, rotation, invertColors, searchText } = pdfState;
  const [page, setPage] = useState<PDFPageProxy | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

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
    return () => { cancelled = true; };
  }, [document, currentPage, getPage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") onPageVisible?.(currentPage + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") onPageVisible?.(currentPage - 1);
    },
    [currentPage, onPageVisible]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (pageLoading || !page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/50">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-8">
      <PDFPage
        page={page}
        scale={scale}
        rotation={rotation}
        invertColors={invertColors}
        searchText={searchText}
      />
    </div>
  );
}
