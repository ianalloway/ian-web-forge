import { useState, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface PDFState {
  document: PDFDocumentProxy | null;
  numPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
  searchText: string;
  searchResults: number[];
  currentSearchIndex: number;
}

const initialState: PDFState = {
  document: null,
  numPages: 0,
  currentPage: 1,
  scale: 1.2,
  rotation: 0,
  isLoading: false,
  error: null,
  fileName: null,
  searchText: "",
  searchResults: [],
  currentSearchIndex: 0,
};

export function usePDF() {
  const [state, setState] = useState<PDFState>(initialState);
  const documentRef = useRef<PDFDocumentProxy | null>(null);

  const updateState = useCallback((updates: Partial<PDFState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadFromFile = useCallback(
    async (file: File) => {
      updateState({ isLoading: true, error: null, fileName: file.name });
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        documentRef.current = pdf;
        updateState({
          document: pdf,
          numPages: pdf.numPages,
          currentPage: 1,
          isLoading: false,
          error: null,
          searchText: "",
          searchResults: [],
          currentSearchIndex: 0,
        });
      } catch (err) {
        updateState({
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load PDF",
        });
      }
    },
    [updateState]
  );

  const loadFromUrl = useCallback(
    async (url: string) => {
      updateState({
        isLoading: true,
        error: null,
        fileName: url.split("/").pop() || "document.pdf",
      });
      try {
        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: false,
        });
        const pdf = await loadingTask.promise;
        documentRef.current = pdf;
        updateState({
          document: pdf,
          numPages: pdf.numPages,
          currentPage: 1,
          isLoading: false,
          error: null,
          searchText: "",
          searchResults: [],
          currentSearchIndex: 0,
        });
      } catch (err) {
        updateState({
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load PDF from URL",
        });
      }
    },
    [updateState]
  );

  const goToPage = useCallback(
    (page: number) => {
      setState((prev) => {
        const clamped = Math.max(1, Math.min(page, prev.numPages));
        return { ...prev, currentPage: clamped };
      });
    },
    []
  );

  const nextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, prev.numPages),
    }));
  }, []);

  const prevPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(prev.currentPage - 1, 1),
    }));
  }, []);

  const setScale = useCallback((scale: number) => {
    updateState({ scale: Math.max(0.25, Math.min(scale, 4)) });
  }, [updateState]);

  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 4),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, 0.25),
    }));
  }, []);

  const rotate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  }, []);

  const getPage = useCallback(
    async (pageNum: number): Promise<PDFPageProxy | null> => {
      if (!documentRef.current) return null;
      try {
        return await documentRef.current.getPage(pageNum);
      } catch {
        return null;
      }
    },
    []
  );

  const searchInDocument = useCallback(
    async (text: string) => {
      if (!documentRef.current || !text.trim()) {
        updateState({ searchText: text, searchResults: [], currentSearchIndex: 0 });
        return;
      }
      updateState({ searchText: text });
      const results: number[] = [];
      const lowerText = text.toLowerCase();
      for (let i = 1; i <= documentRef.current.numPages; i++) {
        const page = await documentRef.current.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .toLowerCase();
        if (pageText.includes(lowerText)) {
          results.push(i);
        }
      }
      updateState({
        searchResults: results,
        currentSearchIndex: 0,
        currentPage: results.length > 0 ? results[0] : state.currentPage,
      });
    },
    [updateState, state.currentPage]
  );

  const nextSearchResult = useCallback(() => {
    setState((prev) => {
      if (prev.searchResults.length === 0) return prev;
      const nextIndex = (prev.currentSearchIndex + 1) % prev.searchResults.length;
      return {
        ...prev,
        currentSearchIndex: nextIndex,
        currentPage: prev.searchResults[nextIndex],
      };
    });
  }, []);

  const prevSearchResult = useCallback(() => {
    setState((prev) => {
      if (prev.searchResults.length === 0) return prev;
      const prevIndex =
        (prev.currentSearchIndex - 1 + prev.searchResults.length) %
        prev.searchResults.length;
      return {
        ...prev,
        currentSearchIndex: prevIndex,
        currentPage: prev.searchResults[prevIndex],
      };
    });
  }, []);

  const closeDocument = useCallback(() => {
    if (documentRef.current) {
      documentRef.current.destroy();
      documentRef.current = null;
    }
    setState(initialState);
  }, []);

  return {
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
  };
}
