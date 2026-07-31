const SOCIAL_BOT =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|Discordbot|TelegramBot|Pinterest|facebookcatalog/i;

export default async function middleware(request) {
  const ua = request.headers.get("user-agent") ?? "";
  if (!SOCIAL_BOT.test(ua)) return;

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/$/, "") || "/";

  const propertyMatch = pathname.match(/^\/property\/([^/]+)$/i);
  if (propertyMatch) {
    const dest = new URL("/api/social-preview", url.origin);
    dest.searchParams.set("code", propertyMatch[1]);
    dest.searchParams.set("host", url.host);
    return fetch(dest.toString(), {
      headers: { accept: "text/html" },
    });
  }

  const rentalListingMatch = pathname.match(/^\/long-term-rentals\/([^/]+)$/i);
  if (rentalListingMatch) {
    const dest = new URL("/api/social-preview", url.origin);
    dest.searchParams.set("code", rentalListingMatch[1]);
    dest.searchParams.set("host", url.host);
    return fetch(dest.toString(), {
      headers: { accept: "text/html" },
    });
  }

  if (pathname === "/long-term-rentals") {
    const dest = new URL("/api/social-preview", url.origin);
    dest.searchParams.set("page", "rentals");
    dest.searchParams.set("host", url.host);
    return fetch(dest.toString(), {
      headers: { accept: "text/html" },
    });
  }
}

export const config = {
  matcher: ["/property/:code*", "/long-term-rentals/:path*"],
};
