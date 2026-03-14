import { useState, useEffect } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { PDFThumbnail } from "./PDFThumbnail";

interface PDFSidebarProps {
  document: PDFDocumentProxy;
  currentPage: number;
  onPageClick: (page: number) => void;
}

export function PDFSidebar({
  document,
  currentPage,
  onPageClick,
}: PDFSidebarProps) {
  const [pages, setPages] = useState<PDFPageProxy[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadPages = async () => {
      const loaded: PDFPageProxy[] = [];
      for (let i = 1; i <= document.numPages; i++) {
        if (cancelled) break;
        const page = await document.getPage(i);
        loaded.push(page);
        if (!cancelled) {
          setPages([...loaded]);
        }
      }
    };
    setPages([]);
    loadPages();
    return () => {
      cancelled = true;
    };
  }, [document]);

  return (
    <div className="flex flex-col h-full border-r bg-muted/30 w-[140px] shrink-0">
      <div className="px-3 py-2 border-b">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Pages
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 p-2">
          {pages.map((page, idx) => (
            <PDFThumbnail
              key={idx + 1}
              page={page}
              pageNumber={idx + 1}
              isActive={currentPage === idx + 1}
              onClick={onPageClick}
            />
          ))}
          {pages.length < document.numPages && (
            <p className="text-xs text-center text-muted-foreground py-2">
              Loading thumbnails…
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
