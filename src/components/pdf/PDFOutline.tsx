import { useState } from "react";
import { ChevronRight, BookOpen } from "lucide-react";
import type { OutlineItem } from "@/hooks/usePDF";
import { cn } from "@/lib/utils";

interface PDFOutlineProps {
  outline: OutlineItem[];
  currentPage: number;
  onPageClick: (page: number) => void;
}

function OutlineEntry({
  item,
  currentPage,
  onPageClick,
  depth,
}: {
  item: OutlineItem;
  currentPage: number;
  onPageClick: (page: number) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = item.items.length > 0;
  const isActive = item.pageNumber === currentPage;

  return (
    <div>
      <button
        className={cn(
          "w-full text-left flex items-start gap-1 px-2 py-1 rounded text-sm transition-colors hover:bg-muted",
          isActive && "bg-primary/10 text-primary font-medium",
          !item.pageNumber && "opacity-50 cursor-default"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => {
          if (item.pageNumber) onPageClick(item.pageNumber);
          if (hasChildren) setOpen((v) => !v);
        }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 mt-0.5 shrink-0 transition-transform text-muted-foreground",
              open && "rotate-90"
            )}
          />
        )}
        {!hasChildren && <span className="w-3.5 shrink-0" />}
        <span className="flex-1 leading-tight line-clamp-2">{item.title}</span>
        {item.pageNumber && (
          <span className="text-xs text-muted-foreground ml-1 shrink-0">
            {item.pageNumber}
          </span>
        )}
      </button>
      {hasChildren && open && (
        <div>
          {item.items.map((child, i) => (
            <OutlineEntry
              key={i}
              item={child}
              currentPage={currentPage}
              onPageClick={onPageClick}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PDFOutline({ outline, currentPage, onPageClick }: PDFOutlineProps) {
  if (outline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-3 text-center gap-2">
        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">No outline available for this document</p>
      </div>
    );
  }

  return (
    <div className="py-1">
      {outline.map((item, i) => (
        <OutlineEntry
          key={i}
          item={item}
          currentPage={currentPage}
          onPageClick={onPageClick}
          depth={0}
        />
      ))}
    </div>
  );
}
