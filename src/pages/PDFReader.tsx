import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePDF } from "@/hooks/usePDF";
import { PDFDropzone } from "@/components/pdf/PDFDropzone";
import { PDFToolbar } from "@/components/pdf/PDFToolbar";
import { PDFViewer } from "@/components/pdf/PDFViewer";
import { PDFSidebar } from "@/components/pdf/PDFSidebar";

export default function PDFReader() {
  const {
    state,
    loadFromFile,
    loadFromUrl,
    goToPage,
    nextPage,
    prevPage,
    setScale,
    zoomIn,
    zoomOut,
    rotate,
    getPage,
    searchInDocument,
    nextSearchResult,
    prevSearchResult,
    closeDocument,
  } = usePDF();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchParams] = useSearchParams();

  // Auto-load PDF from ?url= query param
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam && !state.document && !state.isLoading) {
      loadFromUrl(urlParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = useCallback(() => {
    if (!state.fileName) return;
    // For file-loaded PDFs we can't re-download easily — inform user
    // For URL-loaded, we could open the URL
    alert("To download, use the original file source.");
  }, [state.fileName]);

  // Show dropzone when no document is loaded
  if (!state.document && !state.isLoading) {
    return (
      <PDFDropzone
        onFileSelect={loadFromFile}
        onUrlSubmit={loadFromUrl}
        error={state.error}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {state.document && (
        <PDFToolbar
          currentPage={state.currentPage}
          numPages={state.numPages}
          scale={state.scale}
          fileName={state.fileName}
          searchText={state.searchText}
          searchResults={state.searchResults}
          currentSearchIndex={state.currentSearchIndex}
          sidebarOpen={sidebarOpen}
          onPrevPage={prevPage}
          onNextPage={nextPage}
          onGoToPage={goToPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onSetScale={setScale}
          onRotate={rotate}
          onSearch={searchInDocument}
          onNextSearchResult={nextSearchResult}
          onPrevSearchResult={prevSearchResult}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onDownload={handleDownload}
          onClose={closeDocument}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && state.document && (
          <PDFSidebar
            document={state.document}
            currentPage={state.currentPage}
            onPageClick={goToPage}
          />
        )}

        {/* Main viewer or loading */}
        {state.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading PDF…</p>
            </div>
          </div>
        ) : state.error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <p className="text-destructive font-medium mb-2">Failed to load PDF</p>
              <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
              <button
                className="text-sm text-primary underline"
                onClick={closeDocument}
              >
                Try another file
              </button>
            </div>
          </div>
        ) : (
          state.document && (
            <PDFViewer
              pdfState={state}
              getPage={getPage}
              onPageVisible={goToPage}
            />
          )
        )}
      </div>
    </div>
  );
}
