import { useState, useCallback, DragEvent, ChangeEvent, useEffect } from "react";
import { Upload, Link, FileText, X, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface RecentFile {
  name: string;
  url: string;
  date: number;
}

const RECENT_KEY = "pdf_reader_recent";

function getRecent(): RecentFile[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveRecent(url: string, name: string) {
  const existing = getRecent().filter((r) => r.url !== url);
  const updated = [{ name, url, date: Date.now() }, ...existing].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

interface PDFDropzoneProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  error: string | null;
}

export function PDFDropzone({ onFileSelect, onUrlSubmit, error }: PDFDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [recent, setRecent] = useState<RecentFile[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleUrlSubmit = useCallback(() => {
    const url = urlValue.trim();
    if (!url) return;
    const name = url.split("/").pop()?.split("?")[0] || "document.pdf";
    saveRecent(url, name);
    setRecent(getRecent());
    onUrlSubmit(url);
  }, [urlValue, onUrlSubmit]);

  const handleRecentClick = (r: RecentFile) => {
    onUrlSubmit(r.url);
  };

  const handleClearRecent = () => {
    clearRecent();
    setRecent([]);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PDF Reader</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Open, read, and search PDF documents — fully in your browser. No uploads, no tracking.
          </p>
        </div>

        {/* Drop zone / URL mode */}
        {!urlMode ? (
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer select-none",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("pdf-file-input")?.click()}
          >
            <Upload className={cn(
              "h-8 w-8 mx-auto mb-3 transition-colors",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="font-semibold text-lg mb-1">
              {isDragging ? "Release to open" : "Drop a PDF here"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or click to choose a file</p>
            <input
              id="pdf-file-input"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); document.getElementById("pdf-file-input")?.click(); }}
            >
              Choose File
            </Button>
          </div>
        ) : (
          <div className="border rounded-2xl p-5 bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Link className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Open from URL</span>
              <button
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => setUrlMode(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                autoFocus
                placeholder="https://example.com/document.pdf"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                className="flex-1 text-sm"
              />
              <Button onClick={handleUrlSubmit} disabled={!urlValue.trim()} size="sm">
                Open
              </Button>
            </div>
          </div>
        )}

        {/* URL toggle */}
        {!urlMode && (
          <div className="text-center mt-3">
            <Button variant="ghost" size="sm" onClick={() => setUrlMode(true)} className="text-muted-foreground text-xs">
              <Link className="h-3.5 w-3.5 mr-1" /> Open from URL
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Recent
              </div>
              <button
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                onClick={handleClearRecent}
              >
                <Trash2 className="h-3 w-3" /> Clear
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {recent.map((r) => (
                <button
                  key={r.url}
                  className="flex items-center gap-2 text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  onClick={() => handleRecentClick(r)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-4 gap-3 text-center">
          {[
            { icon: "📜", label: "Continuous scroll" },
            { icon: "🔍", label: "Full-text search" },
            { icon: "📑", label: "Bookmarks" },
            { icon: "🔒", label: "100% local" },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-xl bg-muted/50">
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-[11px] text-muted-foreground leading-tight">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
