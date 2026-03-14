import { useState, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, Link, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PDFDropzoneProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  error: string | null;
}

export function PDFDropzone({ onFileSelect, onUrlSubmit, error }: PDFDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") {
        onFileSelect(file);
      }
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
    if (urlValue.trim()) onUrlSubmit(urlValue.trim());
  }, [urlValue, onUrlSubmit]);

  const samplePDFs = [
    {
      label: "PDF Spec (sample)",
      url: "https://www.w3.org/WAI/WCAG21/wcag21.pdf",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/30 p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <FileText className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">PDF Reader</h1>
          <p className="text-muted-foreground mt-2">
            Open, view, and search PDF documents — entirely in your browser.
          </p>
        </div>

        {/* Drop zone */}
        {!urlMode && (
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById("pdf-file-input")?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-lg mb-1">
              {isDragging ? "Drop your PDF here" : "Drag & drop a PDF"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              or click to browse files
            </p>
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
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById("pdf-file-input")?.click();
              }}
            >
              Choose File
            </Button>
          </div>
        )}

        {/* URL mode */}
        {urlMode && (
          <div className="border rounded-2xl p-6 bg-card">
            <div className="flex items-center gap-2 mb-4">
              <Link className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-medium">Open from URL</h2>
              <button
                className="ml-auto text-muted-foreground hover:text-foreground"
                onClick={() => setUrlMode(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="pdf-url" className="text-sm font-medium">PDF URL</label>
                <Input
                  id="pdf-url"
                  autoFocus
                  placeholder="https://example.com/document.pdf"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                  className="mt-1.5"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleUrlSubmit}
                disabled={!urlValue.trim()}
              >
                Open PDF
              </Button>
            </div>
          </div>
        )}

        {/* Toggle URL mode */}
        {!urlMode && (
          <div className="text-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUrlMode(true)}
              className="text-muted-foreground"
            >
              <Link className="h-4 w-4 mr-2" />
              Open from URL instead
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Sample PDFs */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground mb-2">Try a sample</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {samplePDFs.map((pdf) => (
              <Button
                key={pdf.url}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onUrlSubmit(pdf.url)}
              >
                {pdf.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: "🔍", label: "Search text" },
            { icon: "📑", label: "Page thumbnails" },
            { icon: "🔒", label: "Runs locally" },
          ].map((f) => (
            <div key={f.label} className="p-3 rounded-xl bg-muted/50">
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-xs text-muted-foreground">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
