export type SiteTheme = "matrix" | "light";

const STORAGE_KEY = "theme";

export function getStoredTheme(): SiteTheme {
  if (typeof window === "undefined") {
    return "matrix";
  }

  return (localStorage.getItem(STORAGE_KEY) as SiteTheme) || "matrix";
}

export function applyTheme(theme: SiteTheme) {
  if (typeof window === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("light", theme === "light");
  localStorage.setItem(STORAGE_KEY, theme);
}
