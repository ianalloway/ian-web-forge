import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { PDFPage } from "./PDFPage";
import { Loader2 } from "lucide-react";

interface PDFContinuousViewerProps {
  document: PDFDocumentProxy;
  scale: number;
  rotation: number;
  invertColors?: boolean;
  searchText?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
}

interface PageEntry {
  index: number; // 1-based
  page: PDFPageProxy | null;
  loading: boolean;
}

const RENDER_BUFFER = 2; // pages above/below viewport to render

export function PDFContinuousViewer({
  document,
  scale,
  rotation,
  invertColors,
  searchText,
  currentPage,
  onPageChange,
}: PDFContinuousViewerProps) {
  const [pages, setPages] = useState<PageEntry[]>(() =>
    Array.from({ length: document.numPages }, (_, i) => ({
      index: i + 1,
      page: null,
      loading: false,
    }))
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const loadedPages = useRef<Map<number, PDFPageProxy>>(new Map());
  const isScrollingToPage = useRef(false);

  // Load pages around the viewport
  const loadPagesInRange = useCallback(
    async (center: number) => {
      const start = Math.max(1, center - RENDER_BUFFER);
      const end = Math.min(document.numPages, center + RENDER_BUFFER + 1);

      for (let i = start; i <= end; i++) {
        if (loadedPages.current.has(i)) continue;
        try {
          const p = await document.getPage(i);
          loadedPages.current.set(i, p);
          setPages((prev) =>
            prev.map((entry) =>
              entry.index === i ? { ...entry, page: p, loading: false } : entry
            )
          );
        } catch {
          // ignore
        }
      }
    },
    [document]
  );

  // Initial load
  useEffect(() => {
    loadPagesInRange(currentPage);
  }, [document]); // eslint-disable-line react-hooks/exhaustive-deps

  // When currentPage changes externally, scroll to it
  useEffect(() => {
    const el = pageRefs.current.get(currentPage);
    if (el && !isScrollingToPage.current) {
      isScrollingToPage.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        isScrollingToPage.current = false;
      }, 800);
    }
    loadPagesInRange(currentPage);
  }, [currentPage, loadPagesInRange]);

  // Intersection observer to track visible page
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingToPage.current) return;
        let maxRatio = 0;
        let mostVisible = currentPage;
        for (const entry of entries) {
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const pageNum = parseInt(
              (entry.target as HTMLDivElement).dataset.page ?? "1",
              10
            );
            mostVisible = pageNum;
          }
        }
        if (mostVisible !== currentPage) {
          onPageChange(mostVisible);
          loadPagesInRange(mostVisible);
        }
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    pageRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages, currentPage, onPageChange, loadPagesInRange]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-auto bg-muted/50"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="flex flex-col items-center gap-4 py-6 px-4">
        {pages.map(({ index, page }) => (
          <div
            key={index}
            ref={(el) => {
              if (el) pageRefs.current.set(index, el);
              else pageRefs.current.delete(index);
            }}
            data-page={index}
            className="relative"
          >
            {page ? (
              <PDFPage
                page={page}
                scale={scale}
                rotation={rotation}
                invertColors={invertColors}
                searchText={searchText}
              />
            ) : (
              <PagePlaceholder
                pageNum={index}
                document={document}
                scale={scale}
                rotation={rotation}
              />
            )}
            {/* Page number badge */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground select-none">
              {index}
            </div>
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}

function PagePlaceholder({
  pageNum,
  document,
  scale,
  rotation,
}: {
  pageNum: number;
  document: PDFDocumentProxy;
  scale: number;
  rotation: number;
}) {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    document.getPage(pageNum).then((p) => {
      const vp = p.getViewport({ scale, rotation });
      setDims({ width: Math.floor(vp.width), height: Math.floor(vp.height) });
    });
  }, [pageNum, document, scale, rotation]);

  return (
    <div
      className="bg-white shadow-md flex items-center justify-center"
      style={{ width: dims?.width ?? 600, height: dims?.height ?? 800 }}
    >
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
