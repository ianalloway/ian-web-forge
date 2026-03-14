import { useState, useCallback, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export interface OutlineItem {
  title: string;
  pageNumber: number | null;
  items: OutlineItem[];
}

export interface PDFState {
  document: PDFDocumentProxy | null;
  numPages: number;
  currentPage: number;
  scale: number;
  rotation: number;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;
  fileName: string | null;
  searchText: string;
  searchResults: number[];
  currentSearchIndex: number;
  outline: OutlineItem[];
  scrollMode: "single" | "continuous";
  invertColors: boolean;
}

const initialState: PDFState = {
  document: null,
  numPages: 0,
  currentPage: 1,
  scale: 1.2,
  rotation: 0,
  isLoading: false,
  loadProgress: 0,
  error: null,
  fileName: null,
  searchText: "",
  searchResults: [],
  currentSearchIndex: 0,
  outline: [],
  scrollMode: "continuous",
  invertColors: false,
};

async function buildOutline(
  pdf: PDFDocumentProxy
): Promise<OutlineItem[]> {
  try {
    const raw = await pdf.getOutline();
    if (!raw) return [];

    const resolveItem = async (item: {
      title: string;
      dest: string | unknown[] | null;
      items?: typeof raw;
    }): Promise<OutlineItem> => {
      let pageNumber: number | null = null;
      try {
        if (item.dest) {
          let dest = item.dest;
          if (typeof dest === "string") {
            dest = await pdf.getDestination(dest);
          }
          if (Array.isArray(dest) && dest.length > 0) {
            const ref = dest[0];
            pageNumber = (await pdf.getPageIndex(ref as object)) + 1;
          }
        }
      } catch {
        // ignore
      }
      const children = await Promise.all(
        (item.items ?? []).map(resolveItem)
      );
      return { title: item.title, pageNumber, items: children };
    };

    return Promise.all(raw.map(resolveItem));
  } catch {
    return [];
  }
}

export function usePDF() {
  const [state, setState] = useState<PDFState>(initialState);
  const documentRef = useRef<PDFDocumentProxy | null>(null);

  const updateState = useCallback((updates: Partial<PDFState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const loadFromFile = useCallback(
    async (file: File) => {
      updateState({ isLoading: true, error: null, fileName: file.name, loadProgress: 0 });
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        loadingTask.onProgress = ({ loaded, total }) => {
          if (total > 0) updateState({ loadProgress: Math.round((loaded / total) * 100) });
        };
        const pdf = await loadingTask.promise;
        documentRef.current = pdf;
        const outline = await buildOutline(pdf);
        updateState({
          document: pdf,
          numPages: pdf.numPages,
          currentPage: 1,
          isLoading: false,
          loadProgress: 100,
          error: null,
          searchText: "",
          searchResults: [],
          currentSearchIndex: 0,
          outline,
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
        fileName: url.split("/").pop()?.split("?")[0] || "document.pdf",
        loadProgress: 0,
      });
      try {
        const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false });
        loadingTask.onProgress = ({ loaded, total }) => {
          if (total > 0) updateState({ loadProgress: Math.round((loaded / total) * 100) });
        };
        const pdf = await loadingTask.promise;
        documentRef.current = pdf;
        const outline = await buildOutline(pdf);
        updateState({
          document: pdf,
          numPages: pdf.numPages,
          currentPage: 1,
          isLoading: false,
          loadProgress: 100,
          error: null,
          searchText: "",
          searchResults: [],
          currentSearchIndex: 0,
          outline,
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

  const goToPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.numPages)),
    }));
  }, []);

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
    setState((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.25, 4) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.25, 0.25) }));
  }, []);

  const rotate = useCallback(() => {
    setState((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  }, []);

  const setScrollMode = useCallback((mode: "single" | "continuous") => {
    updateState({ scrollMode: mode });
  }, [updateState]);

  const toggleInvertColors = useCallback(() => {
    setState((prev) => ({ ...prev, invertColors: !prev.invertColors }));
  }, []);

  const getPage = useCallback(async (pageNum: number): Promise<PDFPageProxy | null> => {
    if (!documentRef.current) return null;
    try {
      return await documentRef.current.getPage(pageNum);
    } catch {
      return null;
    }
  }, []);

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
        if (pageText.includes(lowerText)) results.push(i);
      }
      setState((prev) => ({
        ...prev,
        searchResults: results,
        currentSearchIndex: 0,
        currentPage: results.length > 0 ? results[0] : prev.currentPage,
      }));
    },
    [updateState]
  );

  const nextSearchResult = useCallback(() => {
    setState((prev) => {
      if (prev.searchResults.length === 0) return prev;
      const idx = (prev.currentSearchIndex + 1) % prev.searchResults.length;
      return { ...prev, currentSearchIndex: idx, currentPage: prev.searchResults[idx] };
    });
  }, []);

  const prevSearchResult = useCallback(() => {
    setState((prev) => {
      if (prev.searchResults.length === 0) return prev;
      const idx =
        (prev.currentSearchIndex - 1 + prev.searchResults.length) %
        prev.searchResults.length;
      return { ...prev, currentSearchIndex: idx, currentPage: prev.searchResults[idx] };
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
    setScrollMode,
    toggleInvertColors,
    getPage,
    searchInDocument,
    nextSearchResult,
    prevSearchResult,
    closeDocument,
  };
}
