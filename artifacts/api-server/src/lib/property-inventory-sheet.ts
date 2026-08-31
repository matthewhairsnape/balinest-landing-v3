import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { parseUsdFromFreeText } from "../../../shared/listing-price.js";
import { logger } from "./logger";

/** Default workbook + tab (gid) for 8D property list. */
export const DEFAULT_PROPERTY_INVENTORY_SPREADSHEET_ID =
  "1f8XO2oa7JpYP7XvfXX8iTZqTD_oc5rPXvONQrCNGP6U";
export const DEFAULT_PROPERTY_INVENTORY_SHEET_GID = "685479834";

/** @deprecated Use candidate URLs; kept for env override compatibility. */
export const DEFAULT_PROPERTY_INVENTORY_SHEET_EXPORT_URL =
  `https://docs.google.com/spreadsheets/d/${DEFAULT_PROPERTY_INVENTORY_SPREADSHEET_ID}/export?format=csv&gid=${DEFAULT_PROPERTY_INVENTORY_SHEET_GID}`;

export type SheetListingRow = {
  id: string;
  code: string;
  sourceUrl: string | null;
  name: string;
  redirectUrl: string | null;
  title: string;
  imageUrl: string | null;
  imageUrls: string[];
  ownership: string | null;
  location: string | null;
  estimatePriceUsd: string | null;
  deliveryEstimate: string | null;
  landSizeSqm: string | null;
  buildingSizeSqm: string | null;
  br: string | null;
  ba: string | null;
  level: string | null;
  zoning: string | null;
  livingRoom: string | null;
  listingUrl: string | null;
  description: string;
  channel: "silent" | "website" | "rentals";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

let cache: { key: string; fetchedAt: number; rows: SheetListingRow[] } | null = null;
const CACHE_TTL_MS = 60_000;
const DRIVE_FOLDER_TTL_MS = 10 * 60_000;
const driveFolderCache = new Map<string, { fetchedAt: number; imageUrls: string[] }>();

export function clearPropertyInventorySheetCache(): void {
  cache = null;
}

function resolvedSpreadsheetIdAndGid(): { spreadsheetId: string; gid: string } {
  const full = process.env.PROPERTY_INVENTORY_SHEET_EXPORT_URL?.trim();
  if (full) {
    const m = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\//.exec(full);
    const gidM = /[?&]gid=(\d+)/.exec(full);
    if (m?.[1] && gidM?.[1]) {
      return { spreadsheetId: m[1], gid: gidM[1] };
    }
  }
  const id = process.env.PROPERTY_INVENTORY_SPREADSHEET_ID?.trim() || DEFAULT_PROPERTY_INVENTORY_SPREADSHEET_ID;
  const gid = process.env.PROPERTY_INVENTORY_SHEET_GID?.trim() || DEFAULT_PROPERTY_INVENTORY_SHEET_GID;
  return { spreadsheetId: id, gid };
}

/** Stable cache / log key for this workbook tab. */
export function propertyInventorySheetCacheKey(): string {
  const full = process.env.PROPERTY_INVENTORY_SHEET_EXPORT_URL?.trim();
  if (full) return full;
  const { spreadsheetId, gid } = resolvedSpreadsheetIdAndGid();
  return `sheet:${spreadsheetId}:${gid}`;
}

/**
 * URLs to try in order. Google sometimes serves HTML for `/export` when link access is "Commenter";
 * `/gviz/tq?tqx=out:csv` can still return CSV for the same sheet.
 */
export function propertyInventorySheetCandidateCsvUrls(): string[] {
  const full = process.env.PROPERTY_INVENTORY_SHEET_EXPORT_URL?.trim();
  if (full) return [full];

  const { spreadsheetId, gid } = resolvedSpreadsheetIdAndGid();
  return [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
  ];
}

function slugSku(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  s = s.replace(/\s+/g, "_");
  s = s.replace(/[^A-Za-z0-9_-]+/g, "_");
  s = s.replace(/_+/g, "_").replace(/^_|_$/g, "");
  return s.slice(0, 64) || "ITEM";
}

function extractCodeFromUrlCell(urlCell: string): string {
  const m = /^\s*([A-Za-z0-9]+)\s*\|/.exec(urlCell ?? "");
  return m?.[1] ?? "";
}

function extractCodeFromAssets(assets: string): string {
  const m = /^\s*([A-Za-z0-9]+)\s*-\s*/.exec(assets ?? "");
  return m?.[1] ?? "";
}

export function stableInventoryListingIdFromCode(code: string): string {
  const h = createHash("sha1").update(`8degree:property_inventory:${code}`).digest();
  const buf = Buffer.alloc(16);
  h.copy(buf, 0, 0, 16);
  buf[6] = (buf[6]! & 0x0f) | 0x50;
  buf[8] = (buf[8]! & 0x3f) | 0x80;
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function parseListingUrl(url: string | undefined): string | null {
  const t = (url ?? "").trim();
  if (!t || !/^https?:\/\//i.test(t)) return null;
  try {
    void new URL(t);
    return t;
  } catch {
    return null;
  }
}

function nullableCell(row: Record<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = (row[key] ?? "").trim();
    if (v) return v;
  }
  return null;
}

/** Normalize sheet "Price" / "ESTIMATE PRICE IN USD" cells to a plain USD integer string. */
function normalizeSheetPriceUsd(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const parsed = parseUsdFromFreeText(raw);
  if (parsed != null && parsed > 0) return String(Math.round(parsed));
  return null;
}

function normalizeHeaderKey(key: string): string {
  return key
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizedRowGet(row: Record<string, string>, ...keys: string[]): string {
  const normalized = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) {
    normalized.set(normalizeHeaderKey(k), v ?? "");
  }
  for (const key of keys) {
    const v = normalized.get(normalizeHeaderKey(key));
    if (v !== undefined) return v;
  }
  return "";
}

function normalizedNullableCell(row: Record<string, string>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = normalizedRowGet(row, key).trim();
    if (v) return v;
  }
  return null;
}

function driveFolderIdFromUrl(url: string | null): string | null {
  if (!url) return null;
  const m = /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]{10,})/.exec(url);
  return m?.[1] ?? null;
}

function rowChannel(row: Record<string, string>): "silent" | "website" | "rentals" {
  const ch = (row["Channel"] ?? row["channel"] ?? "").trim().toLowerCase();
  if (ch === "silent") return "silent";
  if (ch === "rentals" || ch === "rental" || ch === "rental list") return "rentals";
  return "website";
}

/** Reject HTML / auth walls / empty bodies so we never treat a failed export as an empty inventory. */
export function looksLikePropertyInventorySheetCsv(text: string): boolean {
  const s = text.replace(/^\ufeff/, "").trimStart();
  if (s.length < 20) return false;
  if (/^<\s*!DOCTYPE/i.test(s) || /^<\s*html/i.test(s)) return false;
  const first = s.split(/\r?\n/, 1)[0] ?? "";
  const f = first.toLowerCase();
  const hasName = /\bname\b/.test(f);
  const hasUrl = /\burl\b/.test(f) || /\blink\b/.test(f);
  const hasCode = /\bcode\b/.test(f);
  const hasAssets = /\bassets\b/.test(f);
  // Google often exports NAME / URL; some tabs use Code + Assets without a Url header.
  return (hasName && hasUrl) || (hasCode && hasAssets) || (hasName && hasAssets);
}

export function parsePropertyInventorySheetCsv(csvText: string): SheetListingRow[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  const now = new Date().toISOString();
  const skuCounts = new Map<string, number>();
  const out: SheetListingRow[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i] ?? {};
    const codeCell = normalizedRowGet(
      row,
      "Code",
      "code",
      "Code  Website Listing",
      "Code Website Listing",
    ).trim();
    const name = normalizedRowGet(row, "Name", "name").trim();
    const urlCell = normalizedRowGet(row, "Url", "url", "Link", "link");
    const redirectUrlCell = normalizedRowGet(row, "redirect Url", "redirect_url", "Redirect Url");
    const assets = normalizedRowGet(row, "Assets", "assets").trim();
    const desc = normalizedRowGet(row, "Description/Broadcast", "Description");
    const imageUrl = parseListingUrl(normalizedRowGet(row, "image_url", "Image URL", "imageUrl"));
    const ownership = normalizedNullableCell(row, "OWNERSHIP", "ownership");
    const location = normalizedNullableCell(row, "LOCATION", "location");
    const estimatePriceUsd = normalizeSheetPriceUsd(
      normalizedNullableCell(row, "Price", "PRICE", "ESTIMATE PRICE IN USD", "Estimate Price In USD"),
    );
    const deliveryEstimate = normalizedNullableCell(
      row,
      "Development Status",
      "DEVELOPMENT STATUS",
      "DELIVERY ESTIMATE",
      "Delivery Estimate",
    );
    const landSizeSqm = normalizedNullableCell(row, "LAND SIZE(Sqm)", "LAND SIZE (Sqm)", "Land Size (Sqm)");
    const buildingSizeSqm = normalizedNullableCell(row, "BUILDING SIZE(Sqm)", "BUILDING SIZE (Sqm)", "Building Size (Sqm)");
    const br = normalizedNullableCell(row, "Bedrooms", "BEDROOMS", "BR", "br");
    const ba = normalizedNullableCell(row, "Bathrooms", "BATHROOMS", "BA", "ba");
    const level = normalizedNullableCell(row, "Level", "LEVEL", "Level ");
    const zoning = normalizedNullableCell(row, "Zoning", "ZONING");
    const livingRoom = normalizedNullableCell(row, "Living Room", "LIVING ROOM", "Living room");

    // Sheet uses section divider rows like "Website Listing" / "Silent Listing"
    // with no property fields — never treat those as inventory cards.
    const sectionHeader =
      /^(website|silent)\s*listings?$/i.test(codeCell.trim()) ||
      codeCell.toLowerCase().includes("silent listing") ||
      codeCell.toLowerCase().includes("website listing");
    if (
      sectionHeader &&
      !name &&
      !String(desc).trim() &&
      !String(urlCell).trim() &&
      !String(redirectUrlCell).trim() &&
      !imageUrl
    ) {
      continue;
    }

    let base = codeCell || name;
    if (!base) base = extractCodeFromUrlCell(urlCell) || extractCodeFromAssets(assets);
    if (!base) base = `IMPORT_ROW_${String(i + 1).padStart(4, "0")}`;

    const slug = slugSku(base);
    const n = (skuCounts.get(slug) ?? 0) + 1;
    skuCounts.set(slug, n);
    const code = n === 1 ? slug : `${slug}__${n}`;

    const title = (assets || name || code).slice(0, 500);
    const sourceUrl = parseListingUrl(urlCell);
    const redirectUrl = parseListingUrl(redirectUrlCell);
    const listingUrl = redirectUrl ?? sourceUrl;
    const channel = rowChannel(row);
    const sortOrder = i * 10;

    out.push({
      id: stableInventoryListingIdFromCode(code),
      code,
      sourceUrl,
      name: name || code,
      redirectUrl,
      title,
      imageUrl,
      imageUrls: imageUrl ? [imageUrl] : [],
      ownership,
      location,
      estimatePriceUsd,
      deliveryEstimate,
      landSizeSqm,
      buildingSizeSqm,
      br,
      ba,
      level,
      zoning,
      livingRoom,
      listingUrl,
      description: String(desc).slice(0, 100_000),
      channel,
      sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  }

  return out;
}

async function fetchDriveFolderImageUrls(folderId: string): Promise<string[]> {
  const cached = driveFolderCache.get(folderId);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < DRIVE_FOLDER_TTL_MS) return cached.imageUrls;

  const url = `https://drive.google.com/drive/folders/${folderId}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": SHEET_FETCH_HEADERS["User-Agent"],
        Accept: "text/html,*/*;q=0.8",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    // Drive HTML sometimes uses literal "…" and sometimes HTML-escaped &quot;…
    const re =
      /(?:&quot;|")([a-zA-Z0-9_-]{20,})(?:&quot;|")[\s\S]{0,220}?(?:&quot;|")image\/(?:jpeg|jpg|png|webp|gif|heic)(?:&quot;|")/gim;
    const ids = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) ids.add(m[1]!);
    const imageUrls = [...ids].map((id) => `https://drive.google.com/thumbnail?id=${id}&sz=w1200`);
    driveFolderCache.set(folderId, { fetchedAt: now, imageUrls });
    return imageUrls;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}

function collectDriveFolderIdsFromRows(rows: SheetListingRow[]): string[] {
  const folderIds = new Set<string>();
  for (const row of rows) {
    const folderId = driveFolderIdFromUrl(row.imageUrl);
    if (folderId) folderIds.add(folderId);
  }
  return [...folderIds];
}

async function fetchDriveFoldersById(folderIds: string[]): Promise<Map<string, string[]>> {
  const byFolder = new Map<string, string[]>();
  if (folderIds.length === 0) return byFolder;

  const concurrency = Math.max(1, Math.min(8, Number(process.env.PROPERTY_INVENTORY_DRIVE_CONCURRENCY || "4") || 4));
  for (let i = 0; i < folderIds.length; i += concurrency) {
    const chunk = folderIds.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (folderId) => {
        const urls = await fetchDriveFolderImageUrls(folderId);
        byFolder.set(folderId, urls);
      }),
    );
  }
  return byFolder;
}

function applyDriveFolderResolution(
  rows: SheetListingRow[],
  byFolder: Map<string, string[]>,
): SheetListingRow[] {
  return rows.map((row) => {
    const folderId = driveFolderIdFromUrl(row.imageUrl);
    if (!folderId) return row;
    const resolved = byFolder.get(folderId) ?? [];
    if (resolved.length === 0) return row;
    return {
      ...row,
      imageUrl: resolved[0] ?? row.imageUrl,
      imageUrls: resolved,
    };
  });
}

/** Resolve Google Drive folder URLs to thumbnail URLs for specific listing rows (uses per-folder cache). */
export async function resolveDriveFolderImagesForRows(rows: SheetListingRow[]): Promise<SheetListingRow[]> {
  const folderIds = collectDriveFolderIdsFromRows(rows);
  if (folderIds.length === 0) return rows;
  const byFolder = await fetchDriveFoldersById(folderIds);
  return applyDriveFolderResolution(rows, byFolder);
}

async function enrichRowsWithDriveImages(rows: SheetListingRow[]): Promise<SheetListingRow[]> {
  const maxFoldersToResolve = Math.max(
    1,
    Number(process.env.PROPERTY_INVENTORY_DRIVE_RESOLVE_LIMIT || "60") || 60,
  );
  const folderIds = collectDriveFolderIdsFromRows(rows).slice(0, maxFoldersToResolve);
  if (folderIds.length === 0) return rows;

  const byFolder = await fetchDriveFoldersById(folderIds);
  const out = applyDriveFolderResolution(rows, byFolder);
  logger.info(
    {
      folderCountResolved: byFolder.size,
      foldersWithImages: [...byFolder.values()].filter((v) => v.length > 0).length,
      maxFoldersToResolve,
    },
    "property inventory sheet: drive folder image resolution",
  );
  return out;
}

const SHEET_FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/csv,text/plain,*/*;q=0.8",
};

async function fetchSheetCsv(url: string): Promise<string | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: SHEET_FETCH_HEADERS,
    });
    if (!res.ok) {
      logger.warn({ url, status: res.status }, "property inventory sheet: HTTP error from export URL");
      return null;
    }
    return await res.text();
  } catch (err) {
    logger.warn({ err, url }, "property inventory sheet: fetch failed");
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** @deprecated Use propertyInventorySheetCandidateCsvUrls */
export function sheetExportUrlFromEnv(): string {
  return propertyInventorySheetCandidateCsvUrls()[0] ?? DEFAULT_PROPERTY_INVENTORY_SHEET_EXPORT_URL;
}

/** When `true`, list/get inventory from Google Sheets before falling back to Postgres. Never WordPress. */
export function useSheetAsInventorySource(): boolean {
  const v = process.env.PROPERTY_INVENTORY_SOURCE?.trim().toLowerCase();
  if (v === "database" || v === "db" || v === "postgres") return false;
  return true;
}

export async function loadListingsFromGoogleSheet(options?: {
  forceRefresh?: boolean;
}): Promise<SheetListingRow[] | null> {
  const cacheKey = propertyInventorySheetCacheKey();
  const now = Date.now();
  if (!options?.forceRefresh && cache && cache.key === cacheKey && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rows.length > 0 ? cache.rows : null;
  }

  const urls = propertyInventorySheetCandidateCsvUrls();

  for (const url of urls) {
    const csv = await fetchSheetCsv(url);
    if (!csv?.trim()) continue;

    if (!looksLikePropertyInventorySheetCsv(csv)) {
      logger.warn(
        { url, snippet: csv.slice(0, 200).replace(/\s+/g, " ") },
        "property inventory sheet: response is not valid CSV for this URL",
      );
      continue;
    }

    try {
      const parsedRows = parsePropertyInventorySheetCsv(csv);
      let rows: SheetListingRow[];
      try {
        rows = await enrichRowsWithDriveImages(parsedRows);
      } catch (enrichErr) {
        logger.warn(
          { err: enrichErr, url },
          "property inventory sheet: drive folder image enrich failed; using parsed rows",
        );
        rows = parsedRows;
      }
      if (rows.length === 0) {
        logger.warn({ url }, "property inventory sheet: CSV parsed to zero rows");
        continue;
      }
      cache = { key: cacheKey, fetchedAt: Date.now(), rows };
      logger.info({ url, rowCount: rows.length }, "property inventory sheet: loaded OK");
      return rows;
    } catch (err) {
      logger.warn({ err, url }, "property inventory sheet: CSV parse failed");
    }
  }

  logger.warn(
    { tried: urls, cacheKey },
    "property inventory sheet: all CSV URLs failed — set link sharing to Viewer (not Commenter) or use File → Share → Publish to web",
  );
  return null;
}
