export type ListingChannel = "website" | "rentals" | "silent";

export function normalizeListingChannel(raw: string | null | undefined): ListingChannel {
  const c = (raw ?? "").trim().toLowerCase();
  if (c === "rentals" || c === "rental" || c === "rental list") return "rentals";
  if (c === "silent") return "silent";
  return "website";
}

/** Public detail URL for a sheet row, based on its channel. */
export function listingPublicPath(code: string, channel: string | null | undefined): string {
  const slug = encodeURIComponent(code.trim());
  switch (normalizeListingChannel(channel)) {
    case "rentals":
      return `/long-term-rentals/${slug}`;
    case "silent":
      return `/unlisted/${slug}`;
    default:
      return `/property/${slug}`;
  }
}

export type ListingRouteKind = "sale" | "rental" | "unlisted";

export function listingRouteKindFromPath(pathname: string): ListingRouteKind {
  const p = pathname.split("?")[0] ?? pathname;
  if (p.startsWith("/long-term-rentals/")) return "rental";
  if (p.startsWith("/unlisted/")) return "unlisted";
  return "sale";
}

export function listingAllowedOnRoute(
  channel: string | null | undefined,
  routeKind: ListingRouteKind,
): boolean {
  const ch = normalizeListingChannel(channel);
  if (routeKind === "rental") return ch === "rentals";
  if (routeKind === "unlisted") return ch === "silent";
  return ch === "website";
}
