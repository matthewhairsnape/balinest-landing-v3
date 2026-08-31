/** Primary WhatsApp short link (site-wide). */
export const SITE_WHATSAPP_URL = "https://wa.link/hpmtve";

export const SITE_REDDNOTE_URL = "https://xhslink.cn/m/4yrLwQZdnX7";

export const SITE_CONTACT = {
  email: "concierge@8degree.co",
  phone: "+62 878-4661-9888",
  whatsappDisplay: "+62 877-4661-5888",
  whatsappUrl: SITE_WHATSAPP_URL,
  location:
    "Teratai S18, Jl. Kayu Tulang, Canggu, Kec. Kuta Utara, Kabupaten Badung, Bali 80361",
} as const;

/** Canonical public URL for a journal post (matches Google Sheet `Url` column). */
export function journalPostPath(slug: string): string {
  const s = slug.trim().replace(/^\/+|\/+$/g, "").replace(/^blog\//i, "");
  return `/${s}`;
}
