import { useState, useEffect } from "react";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { PDFThumbnail } from "./PDFThumbnail";
import { PDFOutline } from "./PDFOutline";
import type { OutlineItem } from "@/hooks/usePDF";
import { cn } from "@/lib/utils";

type Tab = "thumbnails" | "outline";

interface PDFSidebarProps {
  document: PDFDocumentProxy;
  currentPage: number;
  outline: OutlineItem[];
  onPageClick: (page: number) => void;
}

export function PDFSidebar({
  document,
  currentPage,
  outline,
  onPageClick,
}: PDFSidebarProps) {
  const [tab, setTab] = useState<Tab>("thumbnails");
  const [pages, setPages] = useState<PDFPageProxy[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadPages = async () => {
      const loaded: PDFPageProxy[] = [];
      for (let i = 1; i <= document.numPages; i++) {
        if (cancelled) break;
        const page = await document.getPage(i);
        loaded.push(page);
        if (!cancelled) setPages([...loaded]);
      }
    };
    setPages([]);
    loadPages();
    return () => { cancelled = true; };
  }, [document]);

  return (
    <div className="flex flex-col h-full border-r bg-background w-[160px] shrink-0">
      {/* Tab bar */}
      <div className="flex border-b shrink-0">
        {(["thumbnails", "outline"] as Tab[]).map((t) => (
          <button
            key={t}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab(t)}
          >
            {t === "thumbnails" ? "Pages" : "Outline"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "thumbnails" && (
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
                Loading…
              </p>
            )}
          </div>
        )}
        {tab === "outline" && (
          <PDFOutline
            outline={outline}
            currentPage={currentPage}
            onPageClick={onPageClick}
          />
        )}
      </div>
    </div>
  );
}
