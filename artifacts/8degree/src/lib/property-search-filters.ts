import type { Project } from "@workspace/api-client-react";
import type { PropertyInventoryListing } from "@workspace/api-client-react";
import {
  inferBedroomsBucket,
  inferListingArea,
} from "@/lib/portfolio-listing";

export const DEFAULT_SEARCH_PRICE_MAX_USD = 3_000_000;

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

export function propertySearchFiltersToQuery(
  payload: PropertySearchApplyPayload,
  priceMax: number = DEFAULT_SEARCH_PRICE_MAX_USD,
): string {
  const params = new URLSearchParams();
  if (payload.area !== "all") params.set("area", payload.area);
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
  return {
    area: params.get("area")?.trim() || defaults.area,
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
  if (row.estimatePriceUsd) {
    const n = Number(String(row.estimatePriceUsd).replace(/,/g, ""));
    if (!Number.isNaN(n) && n > 0) return n;
  }
  const d = row.description.slice(0, 4000);
  const usd = d.match(/USD\s*([\d,.]+)\s*(k|K)?/i);
  if (usd) {
    let n = Number(usd[1].replace(/,/g, ""));
    if (usd[2]) n *= 1000;
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

export function listingMatchesArea(
  row: Pick<PropertyInventoryListing, "title" | "description" | "location">,
  area: string,
): boolean {
  if (area === "all") return true;
  if (inferListingArea(row.title, row.description) === area) return true;
  const hay = `${row.title} ${row.description} ${row.location ?? ""}`.toLowerCase();
  return hay.includes(area.toLowerCase());
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
  if (propertyType === "all") return true;
  const blob = `${row.title} ${row.description}`.toLowerCase();
  if (propertyType === "Villa") return /\bvilla\b|\bvillas\b/i.test(blob);
  if (propertyType === "Apartment") return /\b(apartment|apt|penthouse|condo)\b/i.test(blob);
  if (propertyType === "Land") return /\b(land|plot|tanah)\b/i.test(blob);
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
  if (project.area === area) return true;
  return project.area.toLowerCase().includes(area.toLowerCase());
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

export function matchesListingQuery(
  parts: string[],
  listingQuery: string,
): boolean {
  if (!listingQuery.trim()) return true;
  const q = listingQuery.toLowerCase();
  return parts.join(" ").toLowerCase().includes(q);
}
