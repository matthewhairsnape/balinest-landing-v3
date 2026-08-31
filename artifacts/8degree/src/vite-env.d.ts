/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Express API origin only, e.g. `https://api.example.com` (no path, no trailing slash). */
  readonly VITE_API_BASE_URL?: string;
  /** Public site origin for canonicals, Open Graph, and build-time sitemap (no trailing slash). */
  readonly VITE_PUBLIC_SITE_URL?: string;
  /** GA4 measurement ID, e.g. G-XXXXXXXXXX (injected into index.html at build time). */
  readonly VITE_GA4_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
