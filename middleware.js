const SOCIAL_BOT =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Pinterest|facebookcatalog/i;

function listingCodeFromPath(pathname) {
  const patterns = [
    /^\/property\/([^/]+)$/i,
    /^\/properties\/([^/]+)$/i,
    /^\/long-term-rentals\/([^/]+)$/i,
    /^\/unlisted\/([^/]+)$/i,
  ];
  for (const re of patterns) {
    const m = pathname.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function socialPreviewUrl(origin, host, params) {
  const dest = new URL("/api/social-preview", origin);
  for (const [key, value] of Object.entries(params)) {
    dest.searchParams.set(key, value);
  }
  dest.searchParams.set("host", host);
  return dest;
}

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!SOCIAL_BOT.test(ua)) return;

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  const code = listingCodeFromPath(pathname);
  if (code) {
    return fetch(socialPreviewUrl(url.origin, url.host, { code }), {
      headers: { accept: "text/html" },
    });
  }

  if (pathname === "/long-term-rentals") {
    return fetch(socialPreviewUrl(url.origin, url.host, { page: "rentals" }), {
      headers: { accept: "text/html" },
    });
  }
}

export const config = {
  matcher: ["/property/:code*", "/properties/:code*", "/long-term-rentals/:path*", "/unlisted/:code*"],
};
