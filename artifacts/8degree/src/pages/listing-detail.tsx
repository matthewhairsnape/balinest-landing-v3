import { Fragment, useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, MessageCircle } from "lucide-react";
import {
  ApiError,
  getInventoryListingQueryKey,
  useCreateEnquiry,
  useGetInventoryListing,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { inferListingArea, listingPriceLine, listingShortBlurb } from "@/lib/portfolio-listing";
import { Seo } from "@/components/site/Seo";
import {
  canonicalUrl,
  jsonLdGraph,
  organizationJsonLdNode,
  toAbsoluteImageUrl,
  truncateForMeta,
} from "@/lib/site-seo";
const EDITORIAL_BG = "#F4EFE8";
const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1613490908578-7804bb61483b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80";

function galleryUrls(listing: {
  imageUrls?: string[] | null;
  imageUrl?: string | null;
}): string[] {
  const fromArr = Array.isArray(listing.imageUrls) ? listing.imageUrls.filter(Boolean) : [];
  if (fromArr.length > 0) return fromArr;
  if (listing.imageUrl) return [listing.imageUrl];
  return [];
}

export default function ListingDetail() {
  const [, params] = useRoute("/properties/:code");
  const code = (params?.code ?? "").trim();
  const [activeImg, setActiveImg] = useState(0);
  const [heroCarouselApi, setHeroCarouselApi] = useState<CarouselApi>();

  const { data, isLoading, isError, error } = useGetInventoryListing(code, {
    query: { enabled: Boolean(code), queryKey: getInventoryListingQueryKey(code) },
  });
  const createEnquiry = useCreateEnquiry();
  const { toast } = useToast();

  const listing = data?.listing;

  const listingJsonLd = useMemo(() => {
    if (!listing) return null;
    const images = galleryUrls(listing)
      .map((u) => toAbsoluteImageUrl(u))
      .filter((u): u is string => Boolean(u));
    return jsonLdGraph([
      organizationJsonLdNode(),
      {
        "@type": "Residence",
        name: listing.title || listing.code,
        description: truncateForMeta(listingShortBlurb(listing.description) || listing.title),
        url: canonicalUrl(`/properties/${encodeURIComponent(listing.code)}`),
        ...(images.length ? { image: images } : {}),
      },
    ]);
  }, [listing]);

  const isUnavailable = Boolean(
    listing &&
      (listing.visibility === "draft" ||
        listing.saleStatus === "sold" ||
        listing.channel !== "website"),
  );

  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", country: "", budgetRange: "", message: "" },
  });

  const heroSlides = useMemo(() => {
    if (!listing) return [];
    const urls = galleryUrls(listing);
    if (urls.length > 0) return urls.map((imageUrl, i) => ({ imageUrl, id: i }));
    return [{ imageUrl: FALLBACK_HERO, id: 0 }];
  }, [listing]);

  const secondaryImages = heroSlides.slice(1);

  useEffect(() => {
    if (!heroCarouselApi) return;
    const syncSelected = () => setActiveImg(heroCarouselApi.selectedScrollSnap());
    syncSelected();
    heroCarouselApi.on("select", syncSelected);
    heroCarouselApi.on("reInit", syncSelected);
    return () => {
      heroCarouselApi.off("select", syncSelected);
      heroCarouselApi.off("reInit", syncSelected);
    };
  }, [heroCarouselApi]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!listing) return;
    try {
      await createEnquiry.mutateAsync({
        data: {
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          country: values.country || null,
          budgetRange: values.budgetRange || null,
          message:
            (values.message ? `${values.message}\n\n` : "") +
            `Interested in listing: ${listing.code} · ${listing.title}`,
          interestedProjectId: null,
          source: "listing_detail",
        },
      });
      toast({ title: "Enquiry sent", description: "We will be in touch within 24 hours." });
      form.reset();
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    }
  });

  if (!code) {
    return (
      <Fragment>
        <Seo
          title="Invalid property link"
          description="This property URL is not valid."
          path="/projects"
          noindex
        />
        <div className="min-h-screen bg-[#F4EFE8] pt-32 text-center px-6">
          <p className="font-serif text-3xl text-[#1c1917]/60">Invalid property link</p>
          <Link href="/projects">
            <Button className="mt-8 rounded-none bg-[#1c1917] text-white hover:bg-[#1c1917]/90">Back to portfolio</Button>
          </Link>
        </div>
      </Fragment>
    );
  }

  if (isLoading) {
    return (
      <Fragment>
        <Seo
          title="Property listing"
          description="Loading property details and gallery."
          path={`/properties/${encodeURIComponent(code)}`}
        />
        <div className="min-h-screen bg-[#F4EFE8] pt-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 h-[55vh] min-h-[320px] animate-pulse bg-[#e8e2da]" />
            <div className="h-10 w-2/3 animate-pulse bg-[#e8e2da]" />
          </div>
        </div>
      </Fragment>
    );
  }

  if (listing && isUnavailable) {
    return (
      <Fragment>
        <Seo
          title={listing.title || listing.code}
          description="This listing is not available on the public site."
          path={`/properties/${encodeURIComponent(code)}`}
          noindex
        />
        <div className="min-h-screen bg-[#F4EFE8] pt-32 text-center px-6">
          <p className="font-serif text-3xl text-[#1c1917]/60">This property is not available</p>
          <p className="mt-4 text-sm text-[#1c1917]/50 max-w-md mx-auto">
            It may be reserved, sold, or not published on our public site.
          </p>
          <Link href="/projects">
            <Button className="mt-8 rounded-none bg-[#1c1917] text-white hover:bg-[#1c1917]/90">Back to portfolio</Button>
          </Link>
        </div>
      </Fragment>
    );
  }

  if (!listing) {
    const is404 = isError && error instanceof ApiError && (error.status === 404 || error.status === 400);
    return (
      <Fragment>
        <Seo
          title="Property not found"
          description="We could not find this listing."
          path={`/properties/${encodeURIComponent(code)}`}
          noindex
        />
        <div className="min-h-screen bg-[#F4EFE8] pt-32 text-center px-6">
          <p className="font-serif text-3xl text-[#1c1917]/60">
            {is404 ? "Property not found" : isError ? "Could not load this property" : "Property not found"}
          </p>
          <p className="mt-4 text-sm text-[#1c1917]/50 max-w-md mx-auto">
            {isError && !is404 && error instanceof Error ? error.message : "Check the link or return to the portfolio."}
          </p>
          <Link href="/projects">
            <Button className="mt-8 rounded-none bg-[#1c1917] text-white hover:bg-[#1c1917]/90">Back to portfolio</Button>
          </Link>
        </div>
      </Fragment>
    );
  }

  const area = inferListingArea(listing.title, listing.description);
  const priceLine = listing.estimatePriceUsd?.trim() || listingPriceLine(listing.description);
  const categoryLine = `Listing · ${area}`.toUpperCase();

  const primaryImage = galleryUrls(listing)[0] ?? listing.imageUrl ?? null;

  return (
    <div className="min-h-screen bg-[#F4EFE8] text-[#1c1917]">
      <Seo
        title={listing.title || listing.code}
        description={truncateForMeta(listingShortBlurb(listing.description) || `${area}. ${priceLine}`)}
        path={`/properties/${encodeURIComponent(listing.code)}`}
        image={primaryImage}
        jsonLd={listingJsonLd}
      />
      <header className="relative h-[min(78vh,900px)] min-h-[420px] w-full overflow-hidden bg-[#e8e2da]">
        <Carousel
          setApi={setHeroCarouselApi}
          opts={{ loop: heroSlides.length > 1 }}
          className="h-full w-full"
        >
          <CarouselContent className="-ml-0 h-full">
            {heroSlides.map((img) => (
              <CarouselItem key={img.id} className="pl-0">
                <img
                  src={img.imageUrl}
                  alt={listing.title}
                  className="h-[min(78vh,900px)] min-h-[420px] w-full object-cover"
                  loading={img.id === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {heroSlides.length > 1 ? (
            <>
              <CarouselPrevious className="left-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 border-white/40 bg-black/30 text-white hover:bg-black/45 md:left-6" />
              <CarouselNext className="right-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 border-white/40 bg-black/30 text-white hover:bg-black/45 md:right-6" />
            </>
          ) : null}
        </Carousel>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

        <div className="absolute left-0 right-0 top-0 z-10">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-10">
            <Link href="/projects">
              <span className="inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 transition-colors hover:text-white">
                <ArrowLeft size={14} strokeWidth={1.5} />
                Portfolio
              </span>
            </Link>
            <div className="flex flex-wrap justify-end gap-2">
              {listing.featured ? (
                <span className="rounded-full bg-white/95 px-3 py-1 font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#1c1917]">
                  Featured
                </span>
              ) : null}
              <span className="rounded-full bg-black/50 px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-white backdrop-blur-sm">
                {listing.code}
              </span>
            </div>
          </div>
        </div>

        {heroSlides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => {
                  setActiveImg(i);
                  heroCarouselApi?.scrollTo(i);
                }}
                className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-8 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </header>

      <section className="border-b border-[#1c1917]/10" style={{ backgroundColor: EDITORIAL_BG }}>
        <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-20 md:px-10">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-[#1c1917]/50 md:text-[11px]">
            {categoryLine}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.1] tracking-tight text-[#1c1917] md:text-5xl lg:text-[3.25rem]">
            {listing.title || listing.code}
          </h1>
          <p className="mt-8 max-w-2xl font-serif text-lg font-normal leading-relaxed text-[#1c1917]/75 md:text-xl">
            {listing.description?.trim()
              ? listing.description.replace(/\s+/g, " ").trim().slice(0, 360) +
                (listing.description.length > 360 ? "…" : "")
              : "Private villa opportunity in Bali."}
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[#1c1917]/10 pt-10 md:grid-cols-3">
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Area</dt>
              <dd className="mt-2 font-serif text-base text-[#1c1917]">{area}</dd>
            </div>
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Price</dt>
              <dd className="mt-2 font-serif text-base text-[#1c1917]">{priceLine}</dd>
            </div>
            {listing.ownership ? (
              <div>
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Ownership</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{listing.ownership}</dd>
              </div>
            ) : null}
            {listing.deliveryEstimate ? (
              <div>
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Delivery</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{listing.deliveryEstimate}</dd>
              </div>
            ) : null}
            {listing.landSizeSqm ? (
              <div>
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Land</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{listing.landSizeSqm} m²</dd>
              </div>
            ) : null}
            {listing.buildingSizeSqm ? (
              <div>
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Building</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{listing.buildingSizeSqm} m²</dd>
              </div>
            ) : null}
            {listing.br ? (
              <div>
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Bedrooms</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{listing.br}</dd>
              </div>
            ) : null}
            {listing.ba ? (
              <div>
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Bathrooms</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{listing.ba}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      {secondaryImages.length > 0 && (
        <section className="border-b border-[#1c1917]/10 bg-white">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
            {secondaryImages.slice(0, 6).map((img) => (
              <div key={img.id} className="aspect-[4/3] overflow-hidden bg-[#e8e2da]">
                <img src={img.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-10 md:py-20" style={{ backgroundColor: EDITORIAL_BG }}>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20 xl:grid-cols-[minmax(0,1fr)_340px]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div>
              <h2 className="mb-6 font-serif text-2xl font-normal text-[#1c1917] md:text-3xl">About this property</h2>
              <div className="max-w-2xl space-y-5 font-serif text-base leading-[1.75] text-[#1c1917]/80 md:text-[17px]">
                {listing.description?.trim() ? (
                  listing.description
                    .split(/\n\n+/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                ) : (
                  <p>Contact us for full specifications and availability for this listing.</p>
                )}
              </div>
            </div>
          </motion.div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[#1c1917]/10 bg-[#1c1917] p-8 text-white">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-white/50">Indicative pricing</p>
              <p className="mt-2 font-serif text-2xl font-normal leading-snug">{priceLine}</p>

              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(`Hi, I'm interested in ${listing.title} (${listing.code})`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block"
              >
                <Button className="h-12 w-full rounded-none border-0 bg-white font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#1c1917] hover:bg-white/90">
                  <MessageCircle size={16} className="mr-2" />
                  WhatsApp
                </Button>
              </a>
              {listing.listingUrl ? (
                <a href={listing.listingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-none border-white/40 bg-transparent font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white/10"
                  >
                    View original listing
                  </Button>
                </a>
              ) : null}

              <form className="mt-10 space-y-4 border-t border-white/15 pt-10" onSubmit={onSubmit}>
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-white/45">Send an enquiry</p>
                <Input
                  placeholder="Name"
                  className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  {...form.register("name", { required: true })}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  {...form.register("email", { required: true })}
                />
                <Input
                  placeholder="Phone"
                  className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  {...form.register("phone")}
                />
                <Input
                  placeholder="Country"
                  className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  {...form.register("country")}
                />
                <Select onValueChange={(v) => form.setValue("budgetRange", v)}>
                  <SelectTrigger className="rounded-none border-white/20 bg-white/10 text-white">
                    <SelectValue placeholder="Budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under-500k">Under USD 500k</SelectItem>
                    <SelectItem value="500k-1m">USD 500k – 1m</SelectItem>
                    <SelectItem value="1m-3m">USD 1m – 3m</SelectItem>
                    <SelectItem value="3m-plus">USD 3m+</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Message"
                  className="min-h-[100px] rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  {...form.register("message")}
                />
                <Button
                  type="submit"
                  disabled={createEnquiry.isPending}
                  className="h-11 w-full rounded-none border-0 bg-white font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#1c1917] hover:bg-white/90"
                >
                  <CheckCircle size={16} className="mr-2" />
                  Submit
                </Button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
