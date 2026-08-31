import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Legacy WordPress / marketing URLs → current static or SPA destinations.
 * Balinest LP is served at /8-degree-real-estate-x-balinest-villa/ via vercel.json rewrite (slug preserved).
 */
const LEGACY_REDIRECTS: Record<string, string> = {
};

function blogSlugCanonicalRedirect(path: string): string | null {
  const m = /^\/blog\/([^/?#]+)\/?$/.exec(path);
  if (!m?.[1]) return null;
  return `/${decodeURIComponent(m[1])}`;
}

function normalizePath(path: string): string {
  if (!path) return "/";
  const noQuery = path.split("?")[0] ?? path;
  if (noQuery.length > 1 && noQuery.endsWith("/")) return noQuery.slice(0, -1);
  return noQuery;
}

export function LegacyPathRedirect() {
  const [location] = useLocation();

  useEffect(() => {
    const raw = location || window.location.pathname;
    const blogCanonical = blogSlugCanonicalRedirect(raw);
    if (blogCanonical) {
      window.location.replace(blogCanonical);
      return;
    }
    const exact = LEGACY_REDIRECTS[raw] ?? LEGACY_REDIRECTS[`${raw}/`];
    const normalized = normalizePath(raw);
    const dest =
      exact ??
      LEGACY_REDIRECTS[normalized] ??
      LEGACY_REDIRECTS[`${normalized}/`];

    if (!dest) return;

    // Static marketing pages live outside the SPA shell.
    if (dest.startsWith("/balinest")) {
      window.location.replace(dest);
      return;
    }
    window.location.replace(dest);
  }, [location]);

  return null;
}
