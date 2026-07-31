import {
  inferListingArea,
  inferListingStatus,
  listingPriceLine,
  listingShortBlurb,
} from "@/lib/portfolio-listing";
import { parseListingPriceUsd } from "@/lib/site-currency";
import { truncateForMeta } from "@/lib/site-seo";

type ListingOgFields = {
  title: string;
  code: string;
  description: string;
  location?: string | null;
  ownership?: string | null;
  landSizeSqm?: string | null;
  buildingSizeSqm?: string | null;
  br?: string | null;
  estimatePriceUsd?: string | null;
};

export function listingOgTitle(listing: Pick<ListingOgFields, "title" | "code">): string {
  return (listing.title || listing.code).trim();
}

function driveFileIdFromUrl(url: string): string | null {
  const thumb = /[?&]id=([a-zA-Z0-9_-]{10,})/.exec(url);
  if (thumb?.[1]) return thumb[1];
  const file = /\/file\/d\/([a-zA-Z0-9_-]{10,})/.exec(url);
  if (file?.[1]) return file[1];
  return null;
}

/** Prefer listing cover photo; use inventory thumb proxy for Google Drive assets. */
export function listingOgImageSrc(listing: {
  imageUrl?: string | null;
  imageUrls?: string[] | null;
}): string | undefined {
  const fromArr = Array.isArray(listing.imageUrls) ? listing.imageUrls.filter(Boolean) : [];
  const raw = fromArr[0] ?? listing.imageUrl ?? "";
  if (!raw?.trim()) return undefined;
  if (/drive\.google\.com\/drive\/folders\//i.test(raw)) return undefined;
  const id = driveFileIdFromUrl(raw);
  if (id) return `/api/inventory/thumb/${id}?sz=w1200`;
  return raw.trim();
}

export function buildListingOgDescription(listing: ListingOgFields): string {
  const parts: string[] = [];
  const area =
    listing.location?.trim() || inferListingArea(listing.title, listing.description);
  if (area && area !== "Bali") parts.push(area);
  if (listing.br?.trim()) parts.push(`${listing.br.trim()} bedrooms`);
  const ownership = listing.ownership?.trim() || inferListingStatus(listing.description);
  if (ownership && ownership !== "Active" && ownership !== "—") parts.push(ownership);
  if (listing.landSizeSqm?.trim()) parts.push(`${listing.landSizeSqm.trim()} sqm land`);
  if (listing.buildingSizeSqm?.trim()) parts.push(`${listing.buildingSizeSqm.trim()} sqm building`);
  const priceUsd = parseListingPriceUsd(listing.estimatePriceUsd, listing.description);
  const price =
    priceUsd != null
      ? `USD ${Math.round(priceUsd).toLocaleString("en-US")}`
      : listingPriceLine(listing.description);
  if (price && !/^price on request$/i.test(price)) parts.push(price.replace(/^From\s+/i, ""));

  const joined = parts.filter(Boolean).join(" · ");
  if (joined) return truncateForMeta(joined, 158);
  return truncateForMeta(
    listingShortBlurb(listing.description) || listing.title || listing.code,
    158,
  );
}
