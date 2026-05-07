import { useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ExternalLink, MapPin, Search } from "lucide-react";
import { useListInventoryListings, useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  inferBedroomsBucket,
  inferListingArea,
  listingPriceLine,
  listingShortBlurb,
} from "@/lib/portfolio-listing";
import { Seo } from "@/components/site/Seo";
import { truncateForMeta } from "@/lib/site-seo";

/** Stable empty list so `useMemo` deps do not churn when a request fails. */
const EMPTY_LIST: [] = [];

type MergedCard =
  | {
      kind: "project";
      id: string;
      slug: string;
      title: string;
      area: string;
      shortDescription: string;
      priceLine: string;
      heroImageUrl: string | null;
      featured: boolean;
      unitsLeft: number | null;
      completionDate: string | null;
    }
  | {
      kind: "listing";
      id: string;
      code: string;
      title: string;
      area: string;
      shortDescription: string;
      priceLine: string;
      listingUrl: string | null;
      imageUrl: string | null;
      featured: boolean;
    };

export default function Projects() {
  const [area, setArea] = useState<string>("all");
  const [propertyType, setPropertyType] = useState<string>("all");
  const [bedrooms, setBedrooms] = useState<string>("all");
  const [search, setSearch] = useState("");

  const {
    data: projectData,
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErr,
  } = useListProjects({
    area: area !== "all" ? area : undefined,
    property_type: propertyType !== "all" ? propertyType : undefined,
    bedrooms: bedrooms !== "all" ? Number(bedrooms) : undefined,
    limit: 200,
  });

  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    isError: inventoryError,
    error: inventoryErr,
  } = useListInventoryListings({
    channel: "website",
    limit: 500,
    offset: 0,
  });

  const projects = projectsError ? EMPTY_LIST : (projectData?.projects ?? []);
  const listingsRaw = inventoryError ? EMPTY_LIST : (inventoryData?.listings ?? []);

  const isLoading = projectsLoading || inventoryLoading;
  const loadError = projectsError && inventoryError;
  const loadErrorMessage =
    (projectsErr instanceof Error ? projectsErr.message : null) ??
    (inventoryErr instanceof Error ? inventoryErr.message : null) ??
    "Could not load portfolio data";
  const projectsFetchFailed = projectsError && !inventoryError;
  const inventoryFetchFailed = inventoryError && !projectsError;

  const cards = useMemo(() => {

    const projectCards: MergedCard[] = projects.map((p) => ({
      kind: "project" as const,
      id: `p-${p.id}`,
      slug: p.slug,
      title: p.title,
      area: p.area,
      shortDescription: p.shortDescription,
      priceLine: `From ${p.currency} ${p.priceFrom.toLocaleString()}`,
      heroImageUrl: p.heroImageUrl ?? null,
      featured: p.featured,
      unitsLeft: p.unitsLeft ?? null,
      completionDate: p.completionDate ?? null,
    }));

    const listingsPublic = listingsRaw.filter((row) => {
      const vis = row.visibility ?? "active";
      const sale = row.saleStatus ?? "available";
      return vis !== "draft" && sale !== "sold";
    });

    const listingsFiltered = listingsPublic.filter((row) => {
      if (area !== "all" && inferListingArea(row.title, row.description) !== area) return false;
      if (bedrooms !== "all") {
        const b = Number(bedrooms);
        const n = inferBedroomsBucket(row.title, row.description);
        if (n !== null) {
          if (b === 4) {
            if (n < 4) return false;
          } else if (n !== b) {
            return false;
          }
        }
      }
      if (propertyType !== "all" && propertyType !== "Villa") return false;
      return true;
    });

    const listingsForCards = [...listingsFiltered].sort(
      (a, b) => Number(!!b.featured) - Number(!!a.featured),
    );

    const listingCards: MergedCard[] = listingsForCards.map((row) => ({
      kind: "listing" as const,
      id: `i-${row.id}`,
      code: row.code,
      title: row.title || row.code,
      area: inferListingArea(row.title, row.description),
      shortDescription: listingShortBlurb(row.description),
      priceLine: listingPriceLine(row.description),
      listingUrl: row.listingUrl ?? null,
      imageUrl:
        (Array.isArray(row.imageUrls) && row.imageUrls.length > 0 ? row.imageUrls[0] : row.imageUrl) ?? null,
      featured: row.featured ?? false,
    }));

    let merged = [...projectCards, ...listingCards];

    if (search.trim()) {
      const q = search.toLowerCase();
      merged = merged.filter((c) => {
        const blob =
          c.kind === "project"
            ? `${c.title} ${c.area} ${c.shortDescription}`
            : `${c.code} ${c.title} ${c.area}`;
        return blob.toLowerCase().includes(q);
      });
    }

    return merged;
  }, [projects, listingsRaw, area, bedrooms, propertyType, search]);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Developments and listings portfolio"
        description={truncateForMeta(
          "Browse Bali developments and website-channel inventory from our sheet. Filter by area, type, and bedrooms.",
        )}
        path="/projects"
      />
      <div className="bg-foreground text-background pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
          >
            Portfolio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl leading-tight"
          >
            Developments and Listings
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-sm text-background/70 max-w-2xl"
          />
        </div>
      </div>

      <div className="border-b border-border bg-card sticky top-16 z-30">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-none h-10"
                data-testid="input-search"
              />
            </div>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="w-full md:w-40 rounded-none h-10" data-testid="select-area">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="Seminyak">Seminyak</SelectItem>
                <SelectItem value="Canggu">Canggu</SelectItem>
                <SelectItem value="Uluwatu">Uluwatu</SelectItem>
                <SelectItem value="Ubud">Ubud</SelectItem>
                <SelectItem value="Sanur">Sanur</SelectItem>
                <SelectItem value="Nusa Dua">Nusa Dua</SelectItem>
                <SelectItem value="Tabanan">Tabanan</SelectItem>
                <SelectItem value="Bali">Bali (unspecified)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger className="w-full md:w-40 rounded-none h-10" data-testid="select-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Land">Land</SelectItem>
              </SelectContent>
            </Select>
            <Select value={bedrooms} onValueChange={setBedrooms}>
              <SelectTrigger className="w-full md:w-40 rounded-none h-10" data-testid="select-bedrooms">
                <SelectValue placeholder="Bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="1">1 Bed</SelectItem>
                <SelectItem value="2">2 Beds</SelectItem>
                <SelectItem value="3">3 Beds</SelectItem>
                <SelectItem value="4">4+ Beds</SelectItem>
              </SelectContent>
            </Select>
            {(area !== "all" || propertyType !== "all" || bedrooms !== "all" || search) && (
              <Button
                variant="ghost"
                className="rounded-none text-sm"
                onClick={() => {
                  setArea("all");
                  setPropertyType("all");
                  setBedrooms("all");
                  setSearch("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 py-16">
        {projectsFetchFailed ? (
          <div
            className="mb-8 rounded-lg border border-amber-600/35 bg-amber-500/[0.08] px-4 py-3 text-sm text-foreground"
            role="status"
          >
            Developments could not be loaded (database may be missing the projects table). Sheet-driven listings below
            are unchanged.
          </div>
        ) : null}
        {inventoryFetchFailed ? (
          <div
            className="mb-8 rounded-lg border border-amber-600/35 bg-amber-500/[0.08] px-4 py-3 text-sm text-foreground"
            role="status"
          >
            Inventory could not be loaded. Check the sheet connection and API logs; developments above may still appear.
          </div>
        ) : null}
        {loadError ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-8 text-center">
            <p className="font-medium text-foreground mb-2">Could not reach the API</p>
            <p className="text-sm text-muted-foreground mb-3">{loadErrorMessage}</p>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              Run the API locally on port 8080 (<code className="text-[11px]">pnpm dev</code> from the repo root) so{" "}
              <code className="text-[11px]">/api</code> proxies correctly from Vite.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <PortfolioEmptyState
            hasFilters={
              area !== "all" || propertyType !== "all" || bedrooms !== "all" || Boolean(search.trim())
            }
            projectCount={projectsError ? 0 : (projectData?.projects?.length ?? 0)}
            websiteInventoryCount={inventoryError ? 0 : (inventoryData?.listings?.length ?? 0)}
            projectsUnavailable={projectsError}
            inventoryUnavailable={inventoryError}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {cards.map((card, i) =>
              card.kind === "project" ? (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-testid={`card-project-${card.slug}`}
                >
                  <Link href={`/projects/${card.slug}`}>
                    <div className="group cursor-pointer">
                      <div className="relative overflow-hidden rounded-2xl aspect-[3/4] bg-muted mb-4 border border-border/60 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1">
                        {card.heroImageUrl && (
                          <img
                            src={card.heroImageUrl}
                            alt={card.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
                          <span className="rounded-full bg-secondary/95 text-secondary-foreground text-[10px] tracking-[0.16em] uppercase px-2.5 py-1 backdrop-blur-sm">
                            Development
                          </span>
                          {card.featured && (
                            <span className="rounded-full bg-primary/95 text-primary-foreground text-[10px] tracking-[0.16em] uppercase px-2.5 py-1 backdrop-blur-sm">
                              Featured
                            </span>
                          )}
                          {card.unitsLeft !== null && card.unitsLeft !== undefined && (
                            <span className="rounded-full bg-foreground/90 text-background text-[10px] tracking-[0.16em] uppercase px-2.5 py-1 backdrop-blur-sm">
                              {card.unitsLeft} Unit{card.unitsLeft !== 1 ? "s" : ""} Left
                            </span>
                          )}
                        </div>
                        {card.completionDate && (
                          <div className="absolute top-3 right-3 rounded-full bg-background/90 text-foreground text-[10px] tracking-[0.12em] uppercase px-2.5 py-1 backdrop-blur-sm">
                            Completion {card.completionDate}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-muted-foreground text-[11px] tracking-[0.15em] uppercase mb-2">
                          <MapPin size={10} />
                          {card.area}
                        </div>
                        <h3 className="font-sans text-[28px] leading-[1.05] font-semibold uppercase tracking-[0.02em] mb-1 group-hover:text-primary transition-colors">
                          {card.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{card.shortDescription}</p>
                        <p className="text-sm font-medium text-foreground/85">{card.priceLine}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  data-testid={`card-listing-${card.code}`}
                  className="relative"
                >
                  <Link href={`/properties/${encodeURIComponent(card.code)}`} className="block group cursor-pointer">
                    <ListingCardInner card={card} />
                  </Link>
                  {card.listingUrl ? (
                    <a
                      href={card.listingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-3 right-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                      title="Open original listing"
                      aria-label="Open original listing"
                    >
                      <ExternalLink size={16} />
                    </a>
                  ) : null}
                </motion.div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PortfolioEmptyState({
  hasFilters,
  projectCount,
  websiteInventoryCount,
  projectsUnavailable,
  inventoryUnavailable,
}: {
  hasFilters: boolean;
  projectCount: number;
  websiteInventoryCount: number;
  projectsUnavailable: boolean;
  inventoryUnavailable: boolean;
}) {
  if (hasFilters) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <p className="font-serif text-2xl mb-2 text-foreground">Nothing matches your filters</p>
        <p className="text-sm">Try clearing filters or search.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-16 text-muted-foreground max-w-2xl mx-auto space-y-4">
      <p className="font-serif text-2xl text-foreground">Nothing to show on the portfolio yet</p>
      <p className="text-sm">
        Before filters: {projectsUnavailable ? "developments unavailable" : `${projectCount} development(s)`},{" "}
        {inventoryUnavailable ? "sheet inventory unavailable" : `${websiteInventoryCount} website-channel row(s) from the sheet`}.
      </p>
      <p className="text-sm leading-relaxed">
        Rows with <code className="text-[11px] bg-muted px-1 py-0.5 text-foreground">channel: &quot;silent&quot;</code> stay
        in admin only. Use Admin → Inventory and upsert with{" "}
        <code className="text-[11px] bg-muted px-1 py-0.5 text-foreground">website</code> for listings that should appear
        here.
      </p>
      <p className="text-xs text-muted-foreground">
        Developments use the projects table when the database is set up. Listings come from your configured Google Sheet.
      </p>
    </div>
  );
}

function ListingCardInner({
  card,
}: {
  card: Extract<MergedCard, { kind: "listing" }>;
}) {
  const hasImg = Boolean(card.imageUrl);
  return (
    <>
      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-2xl border border-border/60 bg-[#F4EFE8] shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
        {hasImg ? (
          <img
            src={card.imageUrl!}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#F4EFE8_0%,#e8dfd4_48%,#ddd4c8_100%)]" />
        )}
        {hasImg ? <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" /> : null}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md ${
              hasImg
                ? "border border-white/35 bg-white/20 text-white"
                : "border border-[#1c1917]/10 bg-white/75 text-[#1c1917]/85"
            }`}
          >
            Sheet
          </span>
          {card.featured ? (
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] backdrop-blur-md ${
                hasImg ? "bg-amber-500/95 text-white" : "bg-amber-500 text-white"
              }`}
            >
              Featured
            </span>
          ) : null}
        </div>
      </div>
      <div className="px-0.5">
        <div className="mb-2 flex items-center gap-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <MapPin size={10} aria-hidden />
          <span>Listing · {card.area}</span>
        </div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/75">{card.code}</p>
        <h3 className="font-serif text-[22px] leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-primary md:text-[24px]">
          {card.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{card.shortDescription}</p>
        <p className="mt-2 text-sm font-medium text-foreground/90">{card.priceLine}</p>
      </div>
    </>
  );
}
