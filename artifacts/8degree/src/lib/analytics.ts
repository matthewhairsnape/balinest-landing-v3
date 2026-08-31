declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Fire a GA4 page_view (SPA navigations; initial load handled by the tracker). */
export function trackGa4PageView(pagePath: string) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", { page_path: pagePath });
}
