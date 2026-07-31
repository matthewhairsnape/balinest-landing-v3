/** Indicative IDR per USD — keep in sync with `site-currency.ts` `CURRENCY_RATES.IDR`. */
export const LISTING_IDR_PER_USD = 16_500;

/** Indicative EUR per USD — keep in sync with `site-currency.ts` `CURRENCY_RATES.EUR`. */
export const LISTING_EUR_PER_USD = 0.92;

export function idrToUsd(amountIdr: number): number {
  return amountIdr / LISTING_IDR_PER_USD;
}

function parseNumericToken(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, "").replace(/\s/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function applyAmountSuffix(n: number, suffix: string | undefined): number {
  const s = (suffix ?? "").toLowerCase();
  if (s === "k") return n * 1_000;
  if (s === "m" || s === "million") return n * 1_000_000;
  if (s === "billion" || s === "bn") return n * 1_000_000_000;
  return n;
}

/** Parse legacy free-form USD strings like "USD 2,800,000" or "2800000". */
export function parseUsdFromFreeText(text: string | undefined | null): number | null {
  if (!text?.trim()) return null;
  const cleaned = text.replace(/[^\d.,kKmM]/g, " ").trim();
  if (!cleaned) return null;
  const suffix = cleaned.match(/([\d.,]+)\s*([kKmM])\s*$/);
  if (suffix) {
    const base = parseFloat(suffix[1]!.replace(/,/g, ""));
    if (!Number.isFinite(base)) return null;
    return suffix[2]!.toLowerCase() === "m" ? base * 1_000_000 : base * 1_000;
  }
  const match = cleaned.match(/[\d.,]+/);
  if (!match) return null;
  const num = parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(num) ? num : null;
}

/**
 * Extract a canonical USD amount from the sheet price column and/or marketing description.
 * Returns null when no reliable price is found.
 */
export function parseListingPriceUsd(
  estimatePriceUsd: string | null | undefined,
  description?: string | null,
): number | null {
  const fromColumn = parseUsdFromFreeText(estimatePriceUsd);
  // Spreadsheet "Price" column is the source of truth when present.
  if (fromColumn != null && fromColumn > 0) return fromColumn;

  const d = (description ?? "").slice(0, 8000);
  if (!d.trim()) {
    return fromColumn != null && fromColumn > 0 ? fromColumn : null;
  }

  const idrBill = d.match(/\bIDR\s*([\d.,]+)\s*(?:billion|bn|miliar)\b/i);
  if (idrBill) {
    const n = parseNumericToken(idrBill[1]!);
    if (n != null) return idrToUsd(n * 1_000_000_000);
  }

  const idrMill = d.match(/\bIDR\s*([\d.,]+)\s*(?:million|jt|juta|mio)\b/i);
  if (idrMill) {
    const n = parseNumericToken(idrMill[1]!);
    if (n != null) return idrToUsd(n * 1_000_000);
  }

  const idrFull = d.match(/\bIDR\s*([\d][\d.,\s]{7,})/i);
  if (idrFull) {
    const n = parseNumericToken(idrFull[1]!);
    if (n != null && n >= 100_000_000) return idrToUsd(n);
  }

  const rp = d.match(/\bRp\.?\s*([\d][\d.,\s]{7,})/i);
  if (rp) {
    const n = parseNumericToken(rp[1]!);
    if (n != null && n >= 100_000_000) return idrToUsd(n);
  }

  for (const usd of d.matchAll(/\bUSD\s*([\d,.]+)\s*(k|K|m|M|million|billion|bn)?/gi)) {
    let n = parseNumericToken(usd[1]!);
    if (n == null) continue;
    n = applyAmountSuffix(n, usd[2]);
    if (n >= 10_000) return n;
  }

  const eur = d.match(/\bEUR\s*([\d,.]+)\s*(k|K|m|M|million|billion|bn)?/i);
  if (eur) {
    let n = parseNumericToken(eur[1]!);
    if (n != null) {
      n = applyAmountSuffix(n, eur[2]);
      if (n >= 10_000) return n / LISTING_EUR_PER_USD;
    }
  }

  if (fromColumn != null && fromColumn > 0) return fromColumn;
  return null;
}
