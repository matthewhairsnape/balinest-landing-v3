import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useListInventoryListings } from "@workspace/api-client-react";
import { inferListingArea, listingPriceLine, listingShortBlurb } from "@/lib/portfolio-listing";

const HOMEPAGE_FEATURED_SLOTS = 2;
const EDITORIAL_BG = "#F4EFE8";
const INK = "#1c1917";

/** Same visual height for both images when shown as a pair (px values must match for the square). */
const PAIR_IMAGE_HEIGHT =
  "lg:h-[clamp(220px,38vw,500px)] lg:min-h-[220px] lg:max-h-[500px] lg:w-[clamp(220px,38vw,500px)]";
const PAIR_RECT_HEIGHT = "lg:h-[clamp(220px,38vw,500px)] lg:min-h-[220px] lg:max-h-[500px]";

export function FeaturedInventoryStrip() {
  const { data, isLoading, isError } = useListInventoryListings({
    channel: "website",
    limit: 200,
    offset: 0,
  });

  if (isLoading || isError || !data?.listings?.length) return null;

  const eligible = data.listings.filter((row) => {
    const vis = row.visibility ?? "active";
    const sale = row.saleStatus ?? "available";
    return vis === "active" && sale !== "sold";
  });

  if (eligible.length === 0) return null;

  const rows = [...eligible]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
    .slice(0, HOMEPAGE_FEATURED_SLOTS);

  const thumb = (row: (typeof rows)[0]) =>
    (Array.isArray(row.imageUrls) && row.imageUrls.length > 0 ? row.imageUrls[0] : row.imageUrl) ?? null;

  const isPair = rows.length === 2;

  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: EDITORIAL_BG, color: INK }}>
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-14">
        <div className="mb-16 flex flex-col justify-between gap-8 md:mb-20 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="mb-4 font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-[#1c1917]/50 md:text-[11px]">
              Featured listings
            </p>
            <h2 className="font-serif text-3xl font-normal leading-[1.12] tracking-tight text-[#1c1917] md:text-4xl lg:text-[2.75rem]">
              Hand-picked opportunities on the site right now.
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex shrink-0 items-center gap-2 self-start font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-[#1c1917] underline-offset-[6px] transition-opacity hover:opacity-70 md:self-end md:text-[11px]"
          >
            Full portfolio
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div
          className={
            isPair
              ? "flex flex-col gap-14 lg:flex-row lg:items-start lg:gap-12 xl:gap-16 2xl:gap-20"
              : "mx-auto max-w-3xl"
          }
        >
          {rows.map((row, idx) => {
            const img = thumb(row);
            const area = inferListingArea(row.title, row.description);
            const label = row.featured ? "Featured" : "Spotlight";
            const isLeft = idx === 0;

            const imageShell =
              isPair && isLeft
                ? `overflow-hidden bg-[#e8e2da] aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:w-full lg:min-w-0 ${PAIR_RECT_HEIGHT}`
                : isPair && !isLeft
                  ? `overflow-hidden bg-[#e8e2da] aspect-square mx-auto w-[min(100%,22rem)] sm:w-[min(100%,26rem)] lg:mx-0 lg:aspect-auto lg:max-w-none lg:shrink-0 ${PAIR_IMAGE_HEIGHT}`
                  : "overflow-hidden bg-[#e8e2da] aspect-[16/10] w-full sm:aspect-[2/1]";

            const articleClass =
              isPair && isLeft ? "min-w-0 lg:flex-[1.65] lg:basis-0" : isPair && !isLeft ? "lg:shrink-0" : "";

            return (
              <motion.article
                key={row.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: Math.min(idx * 0.08, 0.28) }}
                className={articleClass}
              >
                <Link href={`/properties/${encodeURIComponent(row.code)}`} className="group block">
                  <div className={imageShell}>
                    {img ? (
                      <img
                        src={img}
                        alt={row.title || row.code}
                        className="h-full w-full object-cover transition-[transform,opacity] duration-[1s] ease-out group-hover:scale-[1.02] group-hover:opacity-[0.94]"
                        decoding="async"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8e2da] to-[#ddd4c8] font-serif text-sm text-[#1c1917]/35">
                        {row.code}
                      </div>
                    )}
                  </div>

                  <p className="mt-8 font-sans text-[10px] font-medium uppercase tracking-[0.26em] text-[#1c1917]/50 md:mt-10 md:text-[11px]">
                    {label}
                    {area ? ` · ${area.toUpperCase()}` : ""}
                  </p>
                  <h3 className="mt-4 max-w-lg font-serif text-2xl font-normal leading-snug tracking-tight text-[#1c1917] transition-colors group-hover:text-[#1c1917]/80 md:text-3xl lg:text-[2rem]">
                    {row.title || row.code}
                  </h3>
                  <p className="mt-5 max-w-lg font-sans text-sm font-normal leading-relaxed text-[#1c1917]/70 md:text-[15px]">
                    {listingShortBlurb(row.description)}
                  </p>
                  <p className="mt-6 font-sans text-[10px] uppercase tracking-[0.2em] text-[#1c1917]/45 md:text-[11px]">
                    {listingPriceLine(row.description)}
                  </p>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
