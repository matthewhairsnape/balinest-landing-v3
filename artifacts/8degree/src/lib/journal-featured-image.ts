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

/** Browser-safe featured image src — matches property listing Drive thumbnails. */
export function journalFeaturedImageSrc(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const t = url.trim();
  const driveId = driveFileIdFromJournalImageUrl(t);
  if (driveId) return driveJournalThumbnailUrl(driveId);
  if (/^https:\/\/drive\.google\.com\/thumbnail/i.test(t)) return t;
  return /^https?:\/\//i.test(t) ? t : null;
}
