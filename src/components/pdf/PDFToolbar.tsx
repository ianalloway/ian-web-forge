import { useState, KeyboardEvent, ChangeEvent } from "react";
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
  onDownload: () => void;
  onClose: () => void;
}

const ZOOM_PRESETS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "100%", value: 1.0 },
  { label: "125%", value: 1.25 },
  { label: "150%", value: 1.5 },
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
  onDownload,
  onClose,
}: PDFToolbarProps) {
  const [pageInputValue, setPageInputValue] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const handlePageKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parseInt(pageInputValue, 10);
      if (!isNaN(parsed)) {
        onGoToPage(parsed);
      }
      setPageInputValue("");
    }
  };

  const handleZoomChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const preset = ZOOM_PRESETS.find((p) => p.label === e.target.value);
    if (preset) onSetScale(preset.value);
  };

  const closestZoom =
    ZOOM_PRESETS.reduce((prev, curr) =>
      Math.abs(curr.value - scale) < Math.abs(prev.value - scale) ? curr : prev
    ).label;

  const toggleSearch = () => {
    setSearchOpen((v) => !v);
    if (searchOpen) onSearch("");
  };

  return (
    <div className="flex flex-col border-b bg-background">
      <div className="flex items-center gap-1 px-2 py-1.5 flex-wrap">
        {/* Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* File name */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[200px]">
          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm truncate text-muted-foreground" title={fileName ?? ""}>
            {fileName ?? "Untitled"}
          </span>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              className="h-8 w-14 text-center text-sm"
              value={pageInputValue || currentPage}
              onChange={(e) => setPageInputValue(e.target.value)}
              onFocus={() => setPageInputValue(String(currentPage))}
              onBlur={() => setPageInputValue("")}
              onKeyDown={handlePageKeyDown}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              / {numPages}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNextPage}
            disabled={currentPage >= numPages}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomOut}
            disabled={scale <= 0.25}
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <select
            className="h-8 w-20 text-sm rounded-md border border-input bg-background px-1 cursor-pointer"
            value={closestZoom}
            onChange={handleZoomChange}
          >
            {ZOOM_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onZoomIn}
            disabled={scale >= 4}
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Rotate */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRotate}
          title="Rotate 90°"
        >
          <RotateCw className="h-4 w-4" />
        </Button>

        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", searchOpen && "bg-muted")}
          onClick={toggleSearch}
          title="Search in document"
        >
          <Search className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        {/* Download */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onDownload}
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onClose}
          title="Close document"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-t bg-muted/30">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            className="h-7 text-sm flex-1"
            placeholder="Search in document…"
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
          />
          {searchResults.length > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentSearchIndex + 1} / {searchResults.length} pages
            </span>
          )}
          {searchText && searchResults.length === 0 && (
            <span className="text-xs text-destructive whitespace-nowrap">
              No results
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onPrevSearchResult}
            disabled={searchResults.length === 0}
            title="Previous result"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onNextSearchResult}
            disabled={searchResults.length === 0}
            title="Next result"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleSearch}
            title="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
