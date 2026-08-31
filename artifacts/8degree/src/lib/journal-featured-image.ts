/** Google Drive file id from sheet links, thumb proxy paths, or uc export URLs. */
export function driveFileIdFromJournalImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  const fromThumb = /^\/api\/inventory\/thumb\/([a-zA-Z0-9_-]{10,})/i.exec(t);
  if (fromThumb?.[1]) return fromThumb[1];
  const fromFile = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i.exec(t);
  if (fromFile?.[1]) return fromFile[1];
  if (t.includes("drive.google.com")) {
    const fromQuery = /[?&]id=([a-zA-Z0-9_-]{10,})/i.exec(t);
    if (fromQuery?.[1]) return fromQuery[1];
  }
  return null;
}

export function driveJournalThumbnailUrl(fileId: string, size = "w800"): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=${encodeURIComponent(size)}`;
}

export const JOURNAL_DEFAULT_FEATURED_IMAGE = "/site-media/journal-hero.png";

/** Browser-safe featured image src — proxied Drive thumbs (same as listing cards). */
export function journalFeaturedImageSrc(url: string | null | undefined): string {
  if (!url?.trim()) return JOURNAL_DEFAULT_FEATURED_IMAGE;
  const t = url.trim();
  if (
    t.startsWith("/journal-media/") ||
    t.startsWith("/wp-content/") ||
    /\/wp-content\/uploads\//i.test(t)
  ) {
    return JOURNAL_DEFAULT_FEATURED_IMAGE;
  }
  const driveId = driveFileIdFromJournalImageUrl(t);
  if (driveId) return `/api/inventory/thumb/${encodeURIComponent(driveId)}`;
  if (/^\/api\/inventory\/thumb\//i.test(t)) return t;
  if (t.startsWith("/site-media/")) return t;
  if (/^https?:\/\//i.test(t)) return t;
  return JOURNAL_DEFAULT_FEATURED_IMAGE;
}
