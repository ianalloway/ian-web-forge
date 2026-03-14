import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePDF } from "@/hooks/usePDF";
import { PDFDropzone } from "@/components/pdf/PDFDropzone";
import { PDFToolbar } from "@/components/pdf/PDFToolbar";
import { PDFSidebar } from "@/components/pdf/PDFSidebar";
import { PDFContinuousViewer } from "@/components/pdf/PDFContinuousViewer";
import { PDFViewer } from "@/components/pdf/PDFViewer";

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
    setScrollMode,
    toggleInvertColors,
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
    // Inform user to use original source
    if (state.fileName) {
      alert(`To download "${state.fileName}", save it from its original source.`);
    }
  }, [state.fileName]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleToggleScrollMode = useCallback(() => {
    setScrollMode(state.scrollMode === "continuous" ? "single" : "continuous");
  }, [state.scrollMode, setScrollMode]);

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
    <div className="flex flex-col h-screen overflow-hidden bg-background relative">
      {/* Loading progress bar */}
      {state.isLoading && (
        <div className="h-0.5 bg-muted overflow-hidden shrink-0">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${state.loadProgress}%` }}
          />
        </div>
      )}

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
          scrollMode={state.scrollMode}
          invertColors={state.invertColors}
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
          onToggleScrollMode={handleToggleScrollMode}
          onToggleInvertColors={toggleInvertColors}
          onDownload={handleDownload}
          onPrint={handlePrint}
          onClose={closeDocument}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && state.document && (
          <PDFSidebar
            document={state.document}
            currentPage={state.currentPage}
            outline={state.outline}
            onPageClick={goToPage}
          />
        )}

        {state.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div
                  className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Loading PDF…</p>
                {state.loadProgress > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{state.loadProgress}%</p>
                )}
              </div>
            </div>
          </div>
        ) : state.error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm space-y-3">
              <div className="text-4xl">⚠️</div>
              <p className="font-semibold text-destructive">Failed to load PDF</p>
              <p className="text-sm text-muted-foreground">{state.error}</p>
              <button
                className="text-sm text-primary underline underline-offset-2"
                onClick={closeDocument}
              >
                Try another file
              </button>
            </div>
          </div>
        ) : state.document ? (
          state.scrollMode === "continuous" ? (
            <PDFContinuousViewer
              document={state.document}
              scale={state.scale}
              rotation={state.rotation}
              invertColors={state.invertColors}
              searchText={state.searchText}
              currentPage={state.currentPage}
              onPageChange={goToPage}
            />
          ) : (
            <PDFViewer
              pdfState={state}
              getPage={getPage}
              onPageVisible={goToPage}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
