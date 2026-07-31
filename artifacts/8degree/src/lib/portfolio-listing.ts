const AREA_KEYWORDS: { area: string; keys: string[] }[] = [
  { area: "Seminyak", keys: ["Seminyak", "Oberoi", "Bidadari", "Gang Kahyangan", "Dewi Sri"] },
  { area: "Canggu", keys: ["Canggu", "Berawa", "Pererenan", "Batu Bolong", "Padonan", "Babakan", "Tumbak Bayuh", "Kayu Tulang", "Buduk", "Munggu", "Seseh", "Cemagi", "Mengening"] },
  { area: "Uluwatu", keys: ["Uluwatu", "Bingin", "Pecatu", "Balangan", "Ungasan", "Melasti", "Dreamland", "Jimbaran", "Bukit"] },
  { area: "Ubud", keys: ["Ubud", "Tegallalang", "Gianyar", "Kemenuh", "Peliatan", "Mas "] },
  { area: "Sanur", keys: ["Sanur"] },
  { area: "Nusa Dua", keys: ["Nusa Dua", "Tanjung Benoa"] },
  { area: "Tabanan", keys: ["Tabanan", "Tanah Lot", "Nyanyi", "Kedungu", "Kaba-Kaba", "Buwit"] },
];

export function inferListingArea(title: string, description: string): string {
  const hay = `${title}\n${description}`.slice(0, 1200);
  for (const { area, keys } of AREA_KEYWORDS) {
    if (keys.some((k) => hay.includes(k))) return area;
  }
  return "Bali";
}

export function inferBedroomsBucket(title: string, description: string): number | null {
  const t = `${title}\n${description}`;
  const m = t.match(/\b(\d+)\s*[-–]?\s*(?:bedroom|bedrooms)\b/i);
  if (m) {
    const n = Number(m[1]);
    return n >= 4 ? 4 : n;
  }
  const m2 = t.match(/\b(\d+)\s*BR\b/i);
  if (m2) {
    const n = Number(m2[1]);
    return n >= 4 ? 4 : n;
  }
  return null;
}

export function listingPriceLine(description: string): string {
  const d = description.slice(0, 4000);
  const usd = d.match(/USD\s*([\d,.]+)\s*(k|K)?/i);
  if (usd) return `From USD ${usd[1].replace(/,/g, "")}`;
  const idr = d.match(/IDR\s*([\d .]+)\s*Billion/i);
  if (idr) return `From IDR ${idr[1].trim()} Billion`;
  const idrFull = d.match(/IDR\s*([\d][\d.,\s]{7,})/i);
  if (idrFull) {
    const n = parseFloat(idrFull[1].replace(/,/g, "").replace(/\s/g, ""));
    if (Number.isFinite(n) && n >= 100_000_000) {
      return `From IDR ${n.toLocaleString("en-US")}`;
    }
  }
  const idr2 = d.match(/Rp\.?\s*([\d .,]+)/i);
  if (idr2) return `From ${idr2[0].trim()}`;
  const eur = d.match(/EUR\s*([\d,.]+)/i);
  if (eur) return `From EUR ${eur[1].replace(/,/g, "")}`;
  return "Price on request";
}

export function listingShortBlurb(description: string, maxLen = 160): string {
  const t = description.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length <= maxLen ? t : `${t.slice(0, maxLen - 1)}…`;
}

/** Admin display only; derived from marketing copy until CRM exposes a status field. */
export function inferListingStatus(description: string): string {
  const d = description.slice(0, 3000).toLowerCase();
  if (/\bsold\b|under contract|reserved only|fully reserved\b/.test(d)) return "Reserved";
  if (/\bsold out\b|no longer available\b/.test(d)) return "Sold";
  if (/\bleasehold\b/.test(d) && !/\bfreehold\b/.test(d)) return "Leasehold";
  if (/\bfreehold\b/.test(d)) return "Freehold";
  if (/\bcoming soon\b|pre[-\s]?launch\b/.test(d)) return "Coming soon";
  return "Active";
}

/** E.g. "30 Years" for marketing copy; used on listing cards. */
export function inferLeaseYearsLabel(description: string): string | null {
  const d = description.slice(0, 2800);
  const m = d.match(/\b(\d+)\s*(?:years?|yrs?)\b(?:\s*(?:lease|remaining))?/i);
  if (m) return `${m[1]} Years`;
  const m2 = d.match(/(\d+)\s*(?:years?|yrs?)\s*leasehold/i);
  if (m2) return `${m2[1]} Years`;
  return null;
}
