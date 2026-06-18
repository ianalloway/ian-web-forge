export type SiteTheme = "matrix" | "light";

const STORAGE_KEY = "theme";

const VALID_THEMES: SiteTheme[] = ["matrix", "light"];

function isSiteTheme(value: string | null): value is SiteTheme {
  return value !== null && VALID_THEMES.includes(value as SiteTheme);
}

export function getStoredTheme(): SiteTheme {
  if (typeof window === "undefined") {
    return "matrix";
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSiteTheme(stored) ? stored : "matrix";
  } catch {
    return "matrix";
  }
}

export function applyTheme(theme: SiteTheme) {
  if (typeof window === "undefined") {
    return;
  }

  document.documentElement.classList.toggle("light", theme === "light");

  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures so theme changes still apply in restricted contexts.
  }
}
