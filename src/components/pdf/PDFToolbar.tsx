import { useState, KeyboardEvent, ChangeEvent, useEffect, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  PanelLeftOpen,
  PanelLeftClose,
  FileText,
  Columns2,
  AlignJustify,
  Moon,
  Printer,
  Keyboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PDFToolbarProps {
  currentPage: number;
  numPages: number;
  scale: number;
  fileName: string | null;
  searchText: string;
  searchResults: number[];
  currentSearchIndex: number;
  sidebarOpen: boolean;
  scrollMode: "single" | "continuous";
  invertColors: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetScale: (scale: number) => void;
  onRotate: () => void;
  onSearch: (text: string) => void;
  onNextSearchResult: () => void;
  onPrevSearchResult: () => void;
  onToggleSidebar: () => void;
  onToggleScrollMode: () => void;
  onToggleInvertColors: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onClose: () => void;
}

const ZOOM_PRESETS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.0 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
  { label: "175%", value: 1.75 },
  { label: "200%", value: 2.0 },
  { label: "300%", value: 3.0 },
  { label: "400%", value: 4.0 },
];

export function PDFToolbar({
  currentPage,
  numPages,
  scale,
  fileName,
  searchText,
  searchResults,
  currentSearchIndex,
  sidebarOpen,
  scrollMode,
  invertColors,
  onPrevPage,
  onNextPage,
  onGoToPage,
  onZoomIn,
  onZoomOut,
  onSetScale,
  onRotate,
  onSearch,
  onNextSearchResult,
  onPrevSearchResult,
  onToggleSidebar,
  onToggleScrollMode,
  onToggleInvertColors,
  onDownload,
  onPrint,
  onClose,
}: PDFToolbarProps) {
  const [pageInput, setPageInput] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA";

      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
        return;
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setShortcutsOpen(false);
        onSearch("");
        return;
      }
      if (isInput) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        onNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        onPrevPage();
      } else if (e.key === "=" || e.key === "+") {
        onZoomIn();
      } else if (e.key === "-") {
        onZoomOut();
      } else if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onSetScale(1.0);
      } else if (e.key === "Home") {
        onGoToPage(1);
      } else if (e.key === "End") {
        onGoToPage(numPages);
      } else if (e.key === "?") {
        setShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNextPage, onPrevPage, onZoomIn, onZoomOut, onSetScale, onGoToPage, onSearch, numPages]);

  const handlePageKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parseInt(pageInput, 10);
      if (!isNaN(parsed)) onGoToPage(parsed);
      setPageInput("");
      (e.target as HTMLInputElement).blur();
    }
  };

  const closestZoom = ZOOM_PRESETS.reduce((prev, curr) =>
    Math.abs(curr.value - scale) < Math.abs(prev.value - scale) ? curr : prev
  ).label;

  const toggleSearch = () => {
    const next = !searchOpen;
    setSearchOpen(next);
    if (!next) onSearch("");
    else setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col border-b bg-background shrink-0">
      <div className="flex items-center gap-0.5 px-2 py-1 flex-wrap min-h-[40px]">
        {/* Sidebar */}
        <ToolbarBtn
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar (S)" : "Show sidebar (S)"}
          active={sidebarOpen}
        >
          {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
        </ToolbarBtn>

        <Divider />

        {/* File name */}
        <div className="flex items-center gap-1 min-w-0 max-w-[180px]">
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs truncate text-muted-foreground" title={fileName ?? ""}>
            {fileName ?? "Untitled"}
          </span>
        </div>

        <Divider />

        {/* Page nav */}
        <ToolbarBtn onClick={onPrevPage} disabled={currentPage <= 1} title="Previous page (←)">
          <ChevronLeft className="h-4 w-4" />
        </ToolbarBtn>
        <div className="flex items-center gap-1">
          <Input
            className="h-7 w-12 text-center text-xs px-1"
            value={pageInput || currentPage}
            onChange={(e) => setPageInput(e.target.value)}
            onFocus={() => setPageInput(String(currentPage))}
            onBlur={() => setPageInput("")}
            onKeyDown={handlePageKeyDown}
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">/ {numPages}</span>
        </div>
        <ToolbarBtn onClick={onNextPage} disabled={currentPage >= numPages} title="Next page (→)">
          <ChevronRight className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        {/* Zoom */}
        <ToolbarBtn onClick={onZoomOut} disabled={scale <= 0.25} title="Zoom out (-)">
          <ZoomOut className="h-4 w-4" />
        </ToolbarBtn>
        <select
          className="h-7 w-[4.5rem] text-xs rounded border border-input bg-background px-1 cursor-pointer"
          value={closestZoom}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            const p = ZOOM_PRESETS.find((x) => x.label === e.target.value);
            if (p) onSetScale(p.value);
          }}
        >
          {ZOOM_PRESETS.map((p) => (
            <option key={p.label} value={p.label}>{p.label}</option>
          ))}
        </select>
        <ToolbarBtn onClick={onZoomIn} disabled={scale >= 4} title="Zoom in (+)">
          <ZoomIn className="h-4 w-4" />
        </ToolbarBtn>

        <Divider />

        {/* Scroll mode */}
        <ToolbarBtn
          onClick={onToggleScrollMode}
          title={scrollMode === "continuous" ? "Switch to single page" : "Switch to continuous scroll"}
          active={scrollMode === "continuous"}
        >
          {scrollMode === "continuous" ? (
            <AlignJustify className="h-4 w-4" />
          ) : (
            <Columns2 className="h-4 w-4" />
          )}
        </ToolbarBtn>

        {/* Rotate */}
        <ToolbarBtn onClick={onRotate} title="Rotate 90°">
          <RotateCw className="h-4 w-4" />
        </ToolbarBtn>

        {/* Invert colors */}
        <ToolbarBtn
          onClick={onToggleInvertColors}
          title="Toggle dark/light colors"
          active={invertColors}
        >
          <Moon className="h-4 w-4" />
        </ToolbarBtn>

        {/* Search */}
        <ToolbarBtn onClick={toggleSearch} title="Search (Ctrl+F)" active={searchOpen}>
          <Search className="h-4 w-4" />
        </ToolbarBtn>

        <div className="flex-1" />

        {/* Print */}
        <ToolbarBtn onClick={onPrint} title="Print">
          <Printer className="h-4 w-4" />
        </ToolbarBtn>

        {/* Download */}
        <ToolbarBtn onClick={onDownload} title="Download">
          <Download className="h-4 w-4" />
        </ToolbarBtn>

        {/* Shortcuts */}
        <ToolbarBtn
          onClick={() => setShortcutsOpen((v) => !v)}
          title="Keyboard shortcuts (?)"
          active={shortcutsOpen}
        >
          <Keyboard className="h-4 w-4" />
        </ToolbarBtn>

        {/* Close */}
        <ToolbarBtn onClick={onClose} title="Close document">
          <X className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="flex items-center gap-1.5 px-3 py-1 border-t bg-muted/20">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            ref={searchInputRef}
            className="h-7 text-xs flex-1"
            placeholder="Search text in document… (Esc to close)"
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
          />
          {searchText.trim() && (
            <span className={cn(
              "text-xs whitespace-nowrap shrink-0",
              searchResults.length > 0 ? "text-muted-foreground" : "text-destructive"
            )}>
              {searchResults.length > 0
                ? `${currentSearchIndex + 1}/${searchResults.length} pages`
                : "No results"}
            </span>
          )}
          <ToolbarBtn onClick={onPrevSearchResult} disabled={searchResults.length === 0} title="Previous">
            <ChevronUp className="h-3 w-3" />
          </ToolbarBtn>
          <ToolbarBtn onClick={onNextSearchResult} disabled={searchResults.length === 0} title="Next">
            <ChevronDown className="h-3 w-3" />
          </ToolbarBtn>
          <ToolbarBtn onClick={toggleSearch} title="Close">
            <X className="h-3 w-3" />
          </ToolbarBtn>
        </div>
      )}

      {/* Keyboard shortcuts overlay */}
      {shortcutsOpen && (
        <div className="absolute top-10 right-2 z-50 bg-background border rounded-lg shadow-xl p-4 w-72 text-xs">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Keyboard Shortcuts</span>
            <button onClick={() => setShortcutsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ["→ / ↓ / PgDn", "Next page"],
              ["← / ↑ / PgUp", "Prev page"],
              ["Home", "First page"],
              ["End", "Last page"],
              ["+ / =", "Zoom in"],
              ["-", "Zoom out"],
              ["Ctrl+0", "Reset zoom"],
              ["Ctrl+F", "Search"],
              ["Esc", "Close search"],
              ["?", "This panel"],
            ].map(([key, desc]) => (
              <>
                <kbd key={`k-${key}`} className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">{key}</kbd>
                <span key={`d-${key}`} className="text-muted-foreground">{desc}</span>
              </>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  disabled,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", active && "bg-muted")}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </Button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />;
}
