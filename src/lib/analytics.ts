// Privacy-respecting, cookieless analytics — opt-in and off by default.
//
// Nothing loads unless VITE_PLAUSIBLE_DOMAIN is set at build time, so the
// committed site ships with no third-party script and no tracking. Set the
// env var (e.g. in Netlify's build settings) to enable it:
//
//   VITE_PLAUSIBLE_DOMAIN=ianalloway.xyz
//   VITE_PLAUSIBLE_SRC=https://plausible.io/js/script.js   (optional; this is the default)
//
// Plausible is cookieless and stores no personal data, so there's no consent
// banner to add. Any analytics host must also be allowed by the CSP in
// netlify.toml / index.html (plausible.io already is).

const DEFAULT_SRC = "https://plausible.io/js/script.js";

export function initAnalytics(): void {
  if (typeof document === "undefined" || typeof import.meta === "undefined") return;

  const domain = import.meta.env?.VITE_PLAUSIBLE_DOMAIN?.trim();
  if (!domain) return; // disabled — the default

  // Don't inject twice (StrictMode double-invokes effects in dev).
  if (document.querySelector("script[data-analytics='plausible']")) return;

  const src = import.meta.env?.VITE_PLAUSIBLE_SRC?.trim() || DEFAULT_SRC;
  const script = document.createElement("script");
  script.defer = true;
  script.setAttribute("data-domain", domain);
  script.setAttribute("data-analytics", "plausible");
  script.src = src;
  document.head.appendChild(script);
}
