import fs from "node:fs";
import path from "node:path";

export type InventoryChannel = "website" | "rentals" | "silent";

export function normalizeListingChannel(raw: string | null | undefined): InventoryChannel {
  const c = (raw ?? "").trim().toLowerCase();
  if (c === "rentals" || c === "rental" || c === "rental list") return "rentals";
  if (c === "silent") return "silent";
  return "website";
}

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

const DEFAULT_SITE_ORIGIN = "https://8degree.co";

export function resolveSiteOrigin(forwardedHost?: string | null, forwardedProto?: string | null): string {
  const fromEnv = (process.env.VITE_PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv && fromEnv.includes("8degree.co")) return fromEnv;

  const host = (forwardedHost ?? "").split(",")[0]?.trim();
  if (host && !host.includes("localhost")) {
    const proto = (forwardedProto ?? "https").split(",")[0]?.trim() || "https";
    return `${proto}://${host}`;
  }

  if (fromEnv && !fromEnv.includes("vercel.app")) return fromEnv;
  return DEFAULT_SITE_ORIGIN;
}

export function absoluteSiteUrl(pathname: string, origin?: string): string {
  const base = (origin ?? resolveSiteOrigin()).replace(/\/$/, "");
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${p}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, max = 158): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function inferArea(title: string, description: string, location: string | null): string {
  if (location?.trim()) return location.trim();
  const hay = `${title}\n${description}`.slice(0, 1200);
  const areas = ["Canggu", "Seminyak", "Uluwatu", "Ubud", "Sanur", "Tabanan"];
  for (const a of areas) {
    if (hay.includes(a)) return a;
  }
  return "Bali";
}

function priceLine(listing: {
  estimatePriceUsd?: string | null;
  description: string;
}): string | null {
  if (listing.estimatePriceUsd?.trim()) {
    const n = listing.estimatePriceUsd.replace(/,/g, "");
    return `USD ${Number(n).toLocaleString("en-US")}`;
  }
  const m = listing.description.match(/USD\s*([\d,.]+)/i);
  if (m) return `USD ${m[1].replace(/,/g, "")}`;
  return null;
}

export function buildListingOgDescription(listing: {
  title: string;
  code: string;
  description: string;
  location?: string | null;
  ownership?: string | null;
  landSizeSqm?: string | null;
  buildingSizeSqm?: string | null;
  br?: string | null;
  estimatePriceUsd?: string | null;
}): string {
  const parts: string[] = [];
  const area = inferArea(listing.title, listing.description, listing.location ?? null);
  if (area !== "Bali") parts.push(area);
  if (listing.br?.trim()) parts.push(`${listing.br.trim()} bedrooms`);
  if (listing.ownership?.trim()) parts.push(listing.ownership.trim());
  if (listing.landSizeSqm?.trim()) parts.push(`${listing.landSizeSqm.trim()} sqm land`);
  if (listing.buildingSizeSqm?.trim()) parts.push(`${listing.buildingSizeSqm.trim()} sqm building`);
  const price = priceLine(listing);
  if (price) parts.push(price);
  const joined = parts.join(" · ");
  if (joined) return truncate(joined);
  const blurb = listing.description.replace(/\s+/g, " ").trim().slice(0, 160);
  return truncate(blurb || listing.title || listing.code);
}

function driveFileIdFromUrl(url: string): string | null {
  const thumb = /[?&]id=([a-zA-Z0-9_-]{10,})/.exec(url);
  if (thumb?.[1]) return thumb[1];
  const file = /\/file\/d\/([a-zA-Z0-9_-]{10,})/.exec(url);
  if (file?.[1]) return file[1];
  const open = /\/open\?id=([a-zA-Z0-9_-]{10,})/.exec(url);
  if (open?.[1]) return open[1];
  return null;
}

export function resolveListingOgImageUrl(
  listing: {
    imageUrl?: string | null;
    imageUrls?: string[] | null;
  },
  origin?: string,
): string {
  const raw = (Array.isArray(listing.imageUrls) ? listing.imageUrls[0] : null) ?? listing.imageUrl ?? "";
  const trimmed = raw.trim();
  if (!trimmed) return absoluteSiteUrl("/site-media/hero-poster.jpg", origin);
  if (/drive\.google\.com\/drive\/folders\//i.test(trimmed)) {
    return absoluteSiteUrl("/site-media/hero-poster.jpg", origin);
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const id = driveFileIdFromUrl(trimmed);
    if (id) return absoluteSiteUrl(`/api/inventory/thumb/${id}?sz=w1200`, origin);
    return trimmed;
  }
  return absoluteSiteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`, origin);
}

function replaceOrInsertMeta(
  html: string,
  attr: "name" | "property",
  key: string,
  content: string,
): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<meta\\s+${attr}=["']${escapedKey}["'][^>]*>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

let cachedIndexHtml: string | null = null;

function loadIndexHtmlTemplate(): string {
  if (cachedIndexHtml) return cachedIndexHtml;
  const candidates = [
    path.join(process.cwd(), "index.html"),
    path.join(process.cwd(), "artifacts/8degree/dist/public/index.html"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      cachedIndexHtml = fs.readFileSync(candidate, "utf8");
      return cachedIndexHtml;
    }
  }
  cachedIndexHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><title>8 Degree</title></head><body><div id="root"></div></body></html>`;
  return cachedIndexHtml;
}

export function renderSocialPreviewHtml(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
}): string {
  let html = loadIndexHtmlTemplate();
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  html = replaceOrInsertMeta(html, "name", "description", meta.description);
  html = replaceOrInsertMeta(html, "property", "og:title", meta.title);
  html = replaceOrInsertMeta(html, "property", "og:description", meta.description);
  html = replaceOrInsertMeta(html, "property", "og:url", meta.url);
  html = replaceOrInsertMeta(html, "property", "og:type", "website");
  html = replaceOrInsertMeta(html, "property", "og:image", meta.image);
  html = replaceOrInsertMeta(html, "property", "og:image:width", "1200");
  html = replaceOrInsertMeta(html, "property", "og:image:height", "630");
  html = replaceOrInsertMeta(html, "property", "og:site_name", "8 Degree");
  html = replaceOrInsertMeta(html, "name", "twitter:card", "summary_large_image");
  html = replaceOrInsertMeta(html, "name", "twitter:title", meta.title);
  html = replaceOrInsertMeta(html, "name", "twitter:description", meta.description);
  html = replaceOrInsertMeta(html, "name", "twitter:image", meta.image);
  return html;
}

export const RENTALS_PAGE_OG = {
  title: "Long Term Rentals · 8 Degree",
  description:
    "Explore villa and home rentals for extended stays in Bali—ideal for relocation, remote work, or seasonal living.",
  imagePath: "/site-media/long-term-rentals-hero.png",
  urlPath: "/long-term-rentals",
} as const;

export function rentalsPageOg(origin: string) {
  return {
    title: RENTALS_PAGE_OG.title,
    description: RENTALS_PAGE_OG.description,
    image: absoluteSiteUrl(RENTALS_PAGE_OG.imagePath, origin),
    url: absoluteSiteUrl(RENTALS_PAGE_OG.urlPath, origin),
  };
}
