import { useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { PropertyInventoryListing } from "@workspace/api-client-react";
import { useListInventoryListings } from "@workspace/api-client-react";
import { HOME_LISTINGS_BAND } from "@/lib/home-section-surfaces";
import {
  FeaturedListingCard,
  inventoryRowToFeaturedModel,
  isInventoryCardEligible,
  type FeaturedCardModel,
} from "@/components/site/highlighted-listing-card";
import { useSiteCurrency, type SiteCurrency } from "@/lib/site-currency";

const DEFAULT_GRID_SLOTS = 6;

const sectionSurface = {
  overlapHero: "-mt-4 pt-3 pb-14 md:-mt-6 md:pt-4 md:pb-20 lg:pt-5",
  /** After a full-bleed hero (e.g. projects page): no negative overlap. */
  standalone: "pt-10 pb-14 md:pt-12 md:pb-20",
} as const;

export type FeaturedInventoryStripProps = {
  title: string;
  subtitle: string;
  viewAllLabel: string;
  /** Defaults to `/projects`. Use `#anchor` for in-page jumps on the projects page. */
  viewAllHref?: string;
  /** `overlapHero` tucks under the homepage hero; `standalone` is for the Bali properties page. */
  sectionVariant?: keyof typeof sectionSurface;
  /** When true, the section title and subtitle are not rendered (e.g. projects page). */
  hideHeading?: boolean;
  /** Max cards to show (homepage uses default 6; projects strip uses 9 for a 3×3 grid). */
  maxCards?: number;
  /** Section background (homepage default: listings band). */
  sectionBackgroundColor?: string;
  /** Inventory channel filter (defaults to website / for-sale listings). */
  channel?: "website" | "rentals" | "silent";
};

const viewAllCtaClassName =
  "group inline-flex items-center gap-2 rounded-full border border-[#1c1917]/25 bg-white/80 px-6 py-3 text-xs font-medium uppercase tracking-[0.28em] text-primary shadow-sm backdrop-blur-sm transition-colors hover:border-[#01514E] hover:bg-white";

function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/60 shadow-sm">
      <div className="aspect-[16/10] animate-pulse bg-[#d8d4ce]/80" />
      <div className="space-y-3 px-5 py-4">
        <div className="h-3 w-[65%] animate-pulse rounded bg-[#1c1917]/10" />
        <div className="h-5 w-full animate-pulse rounded bg-[#1c1917]/10" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#1c1917]/10" />
      </div>
    </div>
  );
}

function inventoryToFeaturedCards(
  listings: PropertyInventoryListing[],
  slots: number,
  currency: SiteCurrency,
): FeaturedCardModel[] {
  const eligible = listings.filter(isInventoryCardEligible);

  return [...eligible]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, slots)
    .map((row, idx) => inventoryRowToFeaturedModel(row, idx, currency));
}

export function FeaturedInventoryStrip({
  title,
  subtitle,
  viewAllLabel,
  viewAllHref = "/projects",
  sectionVariant = "overlapHero",
  hideHeading = false,
  maxCards = DEFAULT_GRID_SLOTS,
  sectionBackgroundColor = HOME_LISTINGS_BAND,
  channel = "website",
}: FeaturedInventoryStripProps) {
  const slots = Math.max(1, Math.min(maxCards, 24));
  const currency = useSiteCurrency();

  const { data, isError, isLoading, isFetching } = useListInventoryListings({
    channel,
    limit: 200,
    offset: 0,
  });

  const waitingForListings = isLoading || (isFetching && !data?.listings?.length);

  const cards = useMemo((): FeaturedCardModel[] => {
    if (waitingForListings || isError || !data?.listings?.length) {
      return [];
    }
    return inventoryToFeaturedCards(data.listings, slots, currency);
  }, [waitingForListings, isError, data, slots, currency]);

  if (!waitingForListings && cards.length === 0) {
    return null;
  }

  return (
    <section
      className={sectionSurface[sectionVariant]}
      style={{ backgroundColor: sectionBackgroundColor }}
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-10">
        {hideHeading ? null : (
          <div className="mb-10 mx-auto max-w-2xl text-center md:mb-14">
            <h2 className="font-serif text-3xl font-bold uppercase tracking-[0.06em] text-primary md:text-4xl lg:text-[2.35rem]">
              {title}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#1c1917]/70 md:text-base">
              {subtitle}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {waitingForListings
            ? Array.from({ length: slots }, (_, i) => <ListingCardSkeleton key={i} />)
            : cards.map((row, idx) => <FeaturedListingCard key={row.id} model={row} idx={idx} />)}
        </div>

        {!waitingForListings && cards.length > 0 ? (
          <div className="mt-10 flex justify-center md:mt-14">
            {viewAllHref.startsWith("#") ? (
              <a href={viewAllHref} className={viewAllCtaClassName}>
                {viewAllLabel}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </a>
            ) : (
              <Link href={viewAllHref} className={viewAllCtaClassName}>
                {viewAllLabel}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
