import type { Project } from "@workspace/api-client-react";
import type { PropertyInventoryListing } from "@workspace/api-client-react";
import {
  inferBedroomsBucket,
  inferListingArea,
} from "@/lib/portfolio-listing";
import { parseListingPriceUsd } from "@/lib/site-currency";

export const DEFAULT_SEARCH_PRICE_MAX_USD = 3_000_000;

/** Areas selectable in search UI + portfolio region buckets. */
export const SEARCH_AREA_NAMES = [
  "Uluwatu",
  "Melasti",
  "Bingin",
  "Pecatu",
  "Pandawa",
  "Ungasan",
  "Padang Padang",
  "Canggu",
  "Umalas",
  "Pererenan",
  "Others",
  "Seminyak",
  "Ubud",
  "Tabanan",
  "Sanur",
  "Nusa Dua",
] as const;

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function fuzzyAreaDistance(needle: string, areaName: string): number {
  return levenshtein(needle, areaName.toLowerCase());
}

function maxFuzzyAreaDistance(areaName: string): number {
  return areaName.length >= 6 ? 2 : 1;
}

/** Map free-text / typos (e.g. "ulawatu") to a canonical area name. */
export function resolveAreaName(raw: string): string | null {
  const needle = raw.trim().toLowerCase();
  if (!needle || needle === "area" || needle === "all") return null;

  for (const name of SEARCH_AREA_NAMES) {
    if (name.toLowerCase() === needle) return name;
  }

  for (const name of SEARCH_AREA_NAMES) {
    const lower = name.toLowerCase();
    if (lower.includes(needle) || needle.includes(lower)) return name;
  }

  let best: { name: string; dist: number } | null = null;
  for (const name of SEARCH_AREA_NAMES) {
    const dist = fuzzyAreaDistance(needle, name);
    if (dist <= maxFuzzyAreaDistance(name) && (!best || dist < best.dist)) {
      best = { name, dist };
    }
  }
  return best?.name ?? null;
}

export function filterAreaNames(names: readonly string[], query: string): string[] {
  const needle = query.trim();
  if (!needle) return [...names];
  const lower = needle.toLowerCase();
  const direct = names.filter((name) => name.toLowerCase().includes(lower));
  if (direct.length > 0) return direct;

  const resolved = resolveAreaName(needle);
  if (resolved && (names as readonly string[]).includes(resolved)) {
    return [resolved];
  }

  return names.filter((name) => fuzzyAreaDistance(lower, name) <= maxFuzzyAreaDistance(name));
}

export type PropertySearchApplyPayload = {
  area: string;
  propertyType: string;
  bedrooms: string;
  listingQuery: string;
  ownership: string;
  minPrice: number;
  maxPrice: number;
  devStatus: string;
};

export function defaultPropertySearchPayload(
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): PropertySearchApplyPayload {
  return {
    area: "all",
    propertyType: "all",
    bedrooms: "all",
    listingQuery: "",
    ownership: "all",
    minPrice: 0,
    maxPrice: priceMax,
    devStatus: "all",
  };
}

/** True when the user has changed any filter from the default browse state. */
export function propertySearchFiltersActive(
  payload: PropertySearchApplyPayload,
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): boolean {
  const defaults = defaultPropertySearchPayload(priceMax);
  return (
    payload.area !== defaults.area ||
    payload.propertyType !== defaults.propertyType ||
    payload.bedrooms !== defaults.bedrooms ||
    payload.ownership !== defaults.ownership ||
    payload.devStatus !== defaults.devStatus ||
    payload.listingQuery.trim() !== "" ||
    payload.minPrice !== defaults.minPrice ||
    payload.maxPrice !== defaults.maxPrice
  );
}

export function propertySearchFiltersToQuery(
  payload: PropertySearchApplyPayload,
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): string {
  const params = new URLSearchParams();
  if (payload.area !== "all") {
    params.set("area", resolveAreaName(payload.area) ?? payload.area);
  }
  if (payload.propertyType !== "all") params.set("type", payload.propertyType);
  if (payload.bedrooms !== "all") params.set("beds", payload.bedrooms);
  if (payload.ownership !== "all") params.set("ownership", payload.ownership);
  if (payload.devStatus !== "all") params.set("dev", payload.devStatus);
  if (payload.listingQuery.trim()) params.set("q", payload.listingQuery.trim());
  if (payload.minPrice > 0) params.set("minPrice", String(payload.minPrice));
  if (payload.maxPrice < priceMax) {
    params.set("maxPrice", String(payload.maxPrice));
  }
  return params.toString();
}

export function parsePropertySearchQuery(
  search: string,
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): PropertySearchApplyPayload {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const defaults = defaultPropertySearchPayload(priceMax);
  const minRaw = params.get("minPrice");
  const maxRaw = params.get("maxPrice");
  const rawArea = params.get("area")?.trim() || defaults.area;
  const canonicalArea =
    rawArea === "all" ? "all" : resolveAreaName(rawArea) ?? rawArea;
  return {
    area: canonicalArea,
    propertyType: params.get("type")?.trim() || defaults.propertyType,
    bedrooms: params.get("beds")?.trim() || defaults.bedrooms,
    listingQuery: params.get("q")?.trim() || "",
    ownership: params.get("ownership")?.trim() || defaults.ownership,
    devStatus: params.get("dev")?.trim() || defaults.devStatus,
    minPrice: minRaw && !Number.isNaN(Number(minRaw)) ? Number(minRaw) : 0,
    maxPrice: maxRaw && !Number.isNaN(Number(maxRaw)) ? Number(maxRaw) : priceMax,
  };
}

export function listingUsdPrice(row: PropertyInventoryListing): number | null {
  return parseListingPriceUsd(row.estimatePriceUsd, row.description);
}

/** Pick the closest matching listings for a property detail "similar" strip. */
export function pickSimilarListings(
  current: PropertyInventoryListing,
  pool: PropertyInventoryListing[],
  limit = 3,
): PropertyInventoryListing[] {
  const currentArea =
    current.location?.trim() || inferListingArea(current.title, current.description);
  const currentBrRaw = current.br?.trim() ? Number(current.br.replace(/\D/g, "")) : NaN;
  const currentBr = !Number.isNaN(currentBrRaw)
    ? currentBrRaw
    : inferBedroomsBucket(current.title, current.description);
  const currentPrice = listingUsdPrice(current);
  const currentOwnership = (current.ownership ?? "").trim().toLowerCase();

  const scored = pool
    .filter(
      (row) =>
        row.code.trim().toLowerCase() !== current.code.trim().toLowerCase(),
    )
    .map((row) => {
      let score = 0;
      const area = row.location?.trim() || inferListingArea(row.title, row.description);
      if (area && currentArea && area.toLowerCase() === currentArea.toLowerCase()) score += 100;

      const brRaw = row.br?.trim() ? Number(row.br.replace(/\D/g, "")) : NaN;
      const br = !Number.isNaN(brRaw) ? brRaw : inferBedroomsBucket(row.title, row.description);
      if (currentBr != null && br != null) {
        score += Math.max(0, 40 - Math.abs(currentBr - br) * 12);
      }

      const ownership = (row.ownership ?? "").trim().toLowerCase();
      if (currentOwnership && ownership && ownership === currentOwnership) score += 25;

      const price = listingUsdPrice(row);
      if (currentPrice != null && price != null && currentPrice > 0) {
        const ratio = price / currentPrice;
        if (ratio >= 0.75 && ratio <= 1.25) score += 30;
        else if (ratio >= 0.55 && ratio <= 1.45) score += 15;
      }

      if (row.featured) score += 5;
      return { row, score };
    });

  scored.sort(
    (a, b) => b.score - a.score || a.row.code.localeCompare(b.row.code),
  );
  return scored.slice(0, limit).map((s) => s.row);
}

export function listingMatchesArea(
  row: Pick<PropertyInventoryListing, "title" | "description" | "location">,
  area: string,
): boolean {
  if (area === "all") return true;
  const canonical = resolveAreaName(area) ?? area;
  if (inferListingArea(row.title, row.description) === canonical) return true;
  const hay = `${row.title} ${row.description} ${row.location ?? ""}`.toLowerCase();
  return hay.includes(canonical.toLowerCase());
}

export function listingMatchesBedrooms(
  row: Pick<PropertyInventoryListing, "title" | "description" | "br">,
  bedrooms: string,
): boolean {
  if (bedrooms === "all") return true;
  const fromBr = row.br?.trim() ? Number(row.br.replace(/\D/g, "")) : NaN;
  const n = !Number.isNaN(fromBr) ? fromBr : inferBedroomsBucket(row.title, row.description);
  if (n === null) return true;
  if (bedrooms === "4") return n >= 4;
  if (bedrooms === "6+") return n >= 6;
  return Number(bedrooms) === n;
}

export function listingMatchesPropertyType(
  row: Pick<PropertyInventoryListing, "title" | "description">,
  propertyType: string,
): boolean {
  const type = propertyType.trim().toLowerCase();
  if (!type || type === "all") return true;
  const blob = `${row.title} ${row.description}`.toLowerCase();
  if (type === "villa") return /\bvilla\b|\bvillas\b/i.test(blob);
  if (type === "apartment") return /\b(apartment|apt|penthouse|condo)\b/i.test(blob);
  if (type === "land") return /\b(land|plot|tanah)\b/i.test(blob);
  return true;
}

export function listingMatchesOwnership(
  row: Pick<PropertyInventoryListing, "ownership" | "description">,
  ownership: string,
): boolean {
  if (ownership === "all") return true;
  const blob = `${row.ownership ?? ""} ${row.description}`.toLowerCase();
  if (ownership === "freehold") return /\bfreehold\b/.test(blob);
  if (ownership === "leasehold") return /\bleasehold\b/.test(blob);
  return true;
}

export function listingMatchesDevStatus(
  row: Pick<PropertyInventoryListing, "deliveryEstimate" | "description">,
  devStatus: string,
): boolean {
  if (devStatus === "all") return true;
  const blob = `${row.deliveryEstimate ?? ""} ${row.description}`.toLowerCase();
  const ready = /\b(ready|completed|immediate|move[-\s]?in|delivered|handover|finished)\b/.test(blob);
  const offPlan = /\b(off[-\s]?plan|under construction|pre[-\s]?launch|launching|q[1-4]\s*20\d{2}|coming soon|planned|developing)\b/.test(
    blob,
  );
  if (devStatus === "ready") return ready || (!offPlan && /\bready\b/.test((row.deliveryEstimate ?? "").toLowerCase()));
  if (devStatus === "off-plan") return offPlan || (!ready && /\b(construction|develop)\b/.test(blob));
  return true;
}

export function listingMatchesPrice(
  row: PropertyInventoryListing,
  minPrice: number,
  maxPrice: number,
  priceMax: number,
): boolean {
  if (minPrice <= 0 && maxPrice >= priceMax) return true;
  const price = listingUsdPrice(row);
  if (price === null) return true;
  return price >= minPrice && price <= maxPrice;
}

export function listingMatchesSearchFilters(
  row: PropertyInventoryListing,
  filters: PropertySearchApplyPayload,
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): boolean {
  if (!listingMatchesArea(row, filters.area)) return false;
  if (!listingMatchesBedrooms(row, filters.bedrooms)) return false;
  if (!listingMatchesPropertyType(row, filters.propertyType)) return false;
  if (!listingMatchesOwnership(row, filters.ownership)) return false;
  if (!listingMatchesDevStatus(row, filters.devStatus)) return false;
  if (!listingMatchesPrice(row, filters.minPrice, filters.maxPrice, priceMax)) return false;
  return true;
}

export function projectMatchesArea(project: Pick<Project, "area">, area: string): boolean {
  if (area === "all") return true;
  const canonical = resolveAreaName(area) ?? area;
  if (project.area === canonical) return true;
  return project.area.toLowerCase().includes(canonical.toLowerCase());
}

export function projectMatchesBedrooms(project: Pick<Project, "bedroomsMin" | "bedroomsMax">, bedrooms: string): boolean {
  if (bedrooms === "all") return true;
  const target = bedrooms === "6+" ? 6 : Number(bedrooms);
  if (Number.isNaN(target)) return true;
  if (bedrooms === "4") return project.bedroomsMax >= 4;
  if (bedrooms === "6+") return project.bedroomsMax >= 6;
  return project.bedroomsMin <= target && project.bedroomsMax >= target;
}

export function projectMatchesPropertyType(project: Pick<Project, "propertyType">, propertyType: string): boolean {
  if (propertyType === "all") return true;
  return project.propertyType.toLowerCase() === propertyType.toLowerCase();
}

export function projectMatchesOwnership(project: Pick<Project, "shortDescription" | "propertyType">, ownership: string): boolean {
  if (ownership === "all") return true;
  const blob = `${project.shortDescription} ${project.propertyType}`.toLowerCase();
  if (ownership === "freehold") return /\bfreehold\b/.test(blob);
  if (ownership === "leasehold") return /\bleasehold\b/.test(blob);
  return true;
}

export function projectMatchesDevStatus(
  project: Pick<Project, "status" | "completionDate" | "shortDescription">,
  devStatus: string,
): boolean {
  if (devStatus === "all") return true;
  if (devStatus === "ready") {
    return project.status === "completed" || /\b(ready|completed|immediate)\b/i.test(project.shortDescription);
  }
  if (devStatus === "off-plan") {
    return (
      project.status === "upcoming" ||
      project.status === "ongoing" ||
      /\b(off[-\s]?plan|under construction|launching)\b/i.test(project.shortDescription)
    );
  }
  return true;
}

export function projectMatchesPrice(
  project: Pick<Project, "priceFrom">,
  minPrice: number,
  maxPrice: number,
  priceMax: number,
): boolean {
  if (minPrice <= 0 && maxPrice >= priceMax) return true;
  if (project.priceFrom <= 0) return true;
  return project.priceFrom >= minPrice && project.priceFrom <= maxPrice;
}

export function projectMatchesSearchFilters(
  project: Project,
  filters: PropertySearchApplyPayload,
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): boolean {
  if (!projectMatchesArea(project, filters.area)) return false;
  if (!projectMatchesBedrooms(project, filters.bedrooms)) return false;
  if (!projectMatchesPropertyType(project, filters.propertyType)) return false;
  if (!projectMatchesOwnership(project, filters.ownership)) return false;
  if (!projectMatchesDevStatus(project, filters.devStatus)) return false;
  if (!projectMatchesPrice(project, filters.minPrice, filters.maxPrice, priceMax)) return false;
  return true;
}

export function normalizeListingCode(raw: string): string {
  return raw.replace(/[\s_-]/g, "").toLowerCase();
}

export function matchesListingQuery(
  parts: string[],
  listingQuery: string,
): boolean {
  if (!listingQuery.trim()) return true;
  const q = listingQuery.trim().toLowerCase();
  const hay = parts.filter(Boolean).join(" ").toLowerCase();
  if (hay.includes(q)) return true;

  const qCode = normalizeListingCode(listingQuery);
  if (qCode.length >= 2) {
    for (const part of parts) {
      if (!part) continue;
      if (normalizeListingCode(part).includes(qCode)) return true;
    }
  }

  const asArea = resolveAreaName(listingQuery);
  if (asArea) {
    return hay.includes(asArea.toLowerCase());
  }

  return false;
}
