/** Legacy WordPress uploads are served via `/api/journal/media/` when bundled under `artifacts/api-server/data/journal-media/`. */

export const WP_UPLOADS_PREFIX = "/wp-content/uploads";

/** @deprecated Prefer `/api/journal/media/` — static `/journal-media/` is caught by the SPA rewrite on Vercel. */
export const JOURNAL_MEDIA_SERVE_PREFIX = "/journal-media";

export const JOURNAL_MEDIA_PREFIX = JOURNAL_MEDIA_SERVE_PREFIX;

export const JOURNAL_MEDIA_API_PREFIX = "/api/journal/media";

const UPLOADS_RE = /\/wp-content\/uploads\/(.+?)(?:\?[^"'\\s]*)?$/i;

/** Extract a Google Drive file id from sheet URLs, `/api/inventory/thumb/…`, or `uc?export=view&id=…` links. */
export function driveFileIdFromFeaturedUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  const fromThumb = /^\/api\/inventory\/thumb\/([a-zA-Z0-9_-]{10,})$/i.exec(t);
  if (fromThumb?.[1]) return fromThumb[1];
  const fromFile = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i.exec(t);
  if (fromFile?.[1]) return fromFile[1];
  if (t.includes("drive.google.com")) {
    const fromQuery = /[?&]id=([a-zA-Z0-9_-]{10,})/i.exec(t);
    if (fromQuery?.[1]) return fromQuery[1];
  }
  return null;
}

export function driveThumbnailUrl(fileId: string, size = "w1200"): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${encodeURIComponent(size)}`;
}

/** Shown when a post has no Drive featured image in the sheet or import bundle. */
export const JOURNAL_DEFAULT_FEATURED_IMAGE = "/site-media/journal-hero.png";

/** Same-origin proxy when bundled API routes are available. */
export function inventoryThumbUrl(fileId: string): string {
  return `/api/inventory/thumb/${encodeURIComponent(fileId)}`;
}

/** Resolve a featured image to a browser-loadable URL (Drive thumbnail), or null. */
export function resolveJournalFeaturedImageUrl(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    const driveId = driveFileIdFromFeaturedUrl(candidate);
    if (driveId) return driveThumbnailUrl(driveId);
  }
  return null;
}

/** Always returns a working thumbnail — Drive when available, otherwise journal hero. */
export function resolveJournalFeaturedImageUrlWithDefault(
  ...candidates: Array<string | null | undefined>
): string {
  return resolveJournalFeaturedImageUrl(...candidates) ?? JOURNAL_DEFAULT_FEATURED_IMAGE;
}

export function journalUploadRelativePath(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  if (t.startsWith(`${JOURNAL_MEDIA_SERVE_PREFIX}/`)) {
    return t.slice(JOURNAL_MEDIA_SERVE_PREFIX.length + 1);
  }
  if (t.startsWith(`${WP_UPLOADS_PREFIX}/`)) {
    return t.slice(WP_UPLOADS_PREFIX.length + 1);
  }
  const m = UPLOADS_RE.exec(t);
  if (m?.[1]) return m[1].replace(/^\/+/, "");
  if (t.startsWith("/wp-content/uploads/")) {
    return t.slice("/wp-content/uploads/".length).replace(/^\/+/, "");
  }
  return null;
}

export function resolveJournalImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const rel = journalUploadRelativePath(url);
  if (rel) return `${JOURNAL_MEDIA_API_PREFIX}/${rel}`;
  const trimmed = url.trim();
  if (/^https?:\/\/(?:www\.)?8degree\.co\/wp-content\/uploads\//i.test(trimmed)) {
    const rel2 = journalUploadRelativePath(trimmed);
    if (rel2) return `${JOURNAL_MEDIA_API_PREFIX}/${rel2}`;
  }
  if (trimmed.startsWith(`${WP_UPLOADS_PREFIX}/`)) {
    return `${JOURNAL_MEDIA_API_PREFIX}/${trimmed.slice(WP_UPLOADS_PREFIX.length + 1)}`;
  }
  if (trimmed.startsWith(`${JOURNAL_MEDIA_SERVE_PREFIX}/`)) {
    return `${JOURNAL_MEDIA_API_PREFIX}/${trimmed.slice(JOURNAL_MEDIA_SERVE_PREFIX.length + 1)}`;
  }
  return trimmed;
}

export function rewriteJournalContentHtml(html: string): string {
  if (!html) return html;
  return html
    .replace(
      /https?:\/\/(?:www\.)?8degree\.co\/wp-content\/uploads\//gi,
      `${JOURNAL_MEDIA_API_PREFIX}/`,
    )
    .replace(/\/wp-content\/uploads\//gi, `${JOURNAL_MEDIA_API_PREFIX}/`);
}
