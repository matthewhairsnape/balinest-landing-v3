import { Fragment, useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Download, MessageCircle } from "lucide-react";
import { useGetProject, useListProjects, useCreateEnquiry, getGetProjectQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
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

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:slug");
  const slug = params?.slug ?? "";
  const [activeImg, setActiveImg] = useState(0);

  const { data: project, isLoading } = useGetProject(slug, {
    query: { enabled: !!slug, queryKey: getGetProjectQueryKey(slug) },
  });
  const { data: relatedData } = useListProjects({ status: "ongoing", limit: 4 });
  const createEnquiry = useCreateEnquiry();
  const { toast } = useToast();

  const projectJsonLd = useMemo(() => {
    if (!project) return null;
    const img = toAbsoluteImageUrl(project.heroImageUrl);
    return jsonLdGraph([
      organizationJsonLdNode(),
      {
        "@type": "Residence",
        name: project.title,
        description: truncateForMeta(project.shortDescription),
        url: canonicalUrl(`/projects/${encodeURIComponent(project.slug)}`),
        ...(img ? { image: [img] } : {}),
      },
    ]);
  }, [project]);

  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", country: "", budgetRange: "", message: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createEnquiry.mutateAsync({
        data: {
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          country: values.country || null,
          budgetRange: values.budgetRange || null,
          message: values.message || null,
          interestedProjectId: project?.id,
          source: "project_detail",
        },
      });
      toast({ title: "Enquiry sent", description: "We will be in touch within 24 hours." });
      form.reset();
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <Fragment>
        <Seo
          title="Development"
          description="Loading project details and gallery."
          path={`/projects/${encodeURIComponent(slug)}`}
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

  if (!project) {
    return (
      <Fragment>
        <Seo
          title="Development not found"
          description="This project is not in our portfolio or the link is incorrect."
          path={`/projects/${encodeURIComponent(slug)}`}
          noindex
        />
        <div className="min-h-screen bg-[#F4EFE8] pt-32 text-center">
          <p className="font-serif text-3xl text-[#1c1917]/60">Development not found</p>
          <Link href="/projects">
            <Button className="mt-8 rounded-none bg-[#1c1917] text-white hover:bg-[#1c1917]/90">Back to portfolio</Button>
          </Link>
        </div>
      </Fragment>
    );
  }

  const gallery = (project.images ?? []).filter((img) => img.imageUrl);
  const heroSlides =
    gallery.length > 0
      ? gallery
      : project.heroImageUrl
        ? [{ imageUrl: project.heroImageUrl, id: 0, sortOrder: 0, caption: null as string | null }]
        : [{ imageUrl: FALLBACK_HERO, id: 0, sortOrder: 0, caption: null }];
  const secondaryImages = gallery.slice(1);
  const units = project.units ?? [];
  const related = (relatedData?.projects ?? []).filter((p) => p.slug !== slug).slice(0, 3);

  const formatPrice = (price: number, currency: string) => `${currency} ${price.toLocaleString()}`;
  const statusColor = {
    available: "bg-emerald-50 text-emerald-900",
    reserved: "bg-amber-50 text-amber-900",
    sold: "bg-stone-100 text-stone-700",
  };

  const categoryLine = `${project.propertyType} · ${project.area}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4EFE8] text-[#1c1917]">
      <Seo
        title={project.title}
        description={truncateForMeta(project.shortDescription)}
        path={`/projects/${encodeURIComponent(project.slug)}`}
        image={project.heroImageUrl}
        jsonLd={projectJsonLd}
      />
      {/* Full-bleed header image */}
      <header className="relative h-[min(78vh,900px)] min-h-[420px] w-full overflow-hidden bg-[#e8e2da]">
        {heroSlides.map((img, i) =>
          img.imageUrl ? (
            <img
              key={img.id ?? i}
              src={img.imageUrl}
              alt={img.caption ?? project.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === activeImg ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null,
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35" />

        <div className="absolute left-0 right-0 top-0 z-10">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6 md:px-10">
            <Link href="/projects">
              <span className="inline-flex items-center gap-2 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/90 transition-colors hover:text-white">
                <ArrowLeft size={14} strokeWidth={1.5} />
                Portfolio
              </span>
            </Link>
          </div>
        </div>

        {heroSlides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Image ${i + 1}`}
                onClick={() => setActiveImg(i)}
                className={`h-1.5 rounded-full transition-all ${i === activeImg ? "w-8 bg-white" : "w-1.5 bg-white/45 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}
      </header>

      {/* Intro + details */}
      <section className="border-b border-[#1c1917]/10" style={{ backgroundColor: EDITORIAL_BG }}>
        <div className="mx-auto max-w-[1100px] px-6 py-16 md:py-20 md:px-10">
          <p className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-[#1c1917]/50 md:text-[11px]">
            {categoryLine}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-normal leading-[1.1] tracking-tight text-[#1c1917] md:text-5xl lg:text-[3.25rem]">
            {project.title}
          </h1>
          <p className="mt-8 max-w-2xl font-serif text-lg font-normal leading-relaxed text-[#1c1917]/75 md:text-xl">
            {project.shortDescription}
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-[#1c1917]/10 pt-10 md:grid-cols-4">
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Location</dt>
              <dd className="mt-2 font-serif text-base text-[#1c1917]">{project.area}</dd>
            </div>
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Type</dt>
              <dd className="mt-2 font-serif text-base text-[#1c1917]">{project.propertyType}</dd>
            </div>
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">From</dt>
              <dd className="mt-2 font-serif text-base text-[#1c1917]">{formatPrice(project.priceFrom, project.currency)}</dd>
            </div>
            <div>
              <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Bedrooms</dt>
              <dd className="mt-2 font-serif text-base text-[#1c1917]">
                {project.bedroomsMin}–{project.bedroomsMax}
              </dd>
            </div>
            {project.completionDate ? (
              <div className="col-span-2 md:col-span-1">
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Completion</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">{project.completionDate}</dd>
              </div>
            ) : null}
            {project.unitsLeft != null ? (
              <div className="col-span-2 md:col-span-1">
                <dt className="font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">Availability</dt>
                <dd className="mt-2 font-serif text-base text-[#1c1917]">
                  {project.unitsLeft} unit{project.unitsLeft !== 1 ? "s" : ""} remaining
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      {/* Gallery strip */}
      {secondaryImages.length > 0 && (
        <section className="border-b border-[#1c1917]/10 bg-white">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
            {secondaryImages.slice(0, 6).map((img) => (
              <div key={img.id} className="aspect-[4/3] overflow-hidden bg-[#e8e2da]">
                <img src={img.imageUrl} alt={img.caption ?? project.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-10 md:py-20" style={{ backgroundColor: EDITORIAL_BG }}>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-20 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-14">
            <div>
              <h2 className="mb-6 font-serif text-2xl font-normal text-[#1c1917] md:text-3xl">About this development</h2>
              <div className="max-w-2xl space-y-5 font-serif text-base leading-[1.75] text-[#1c1917]/80 md:text-[17px]">
                {(project.fullDescription || "")
                  .split(/\n\n+/)
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
              </div>
            </div>

            {project.amenities && project.amenities.length > 0 && (
              <div>
                <h2 className="mb-6 font-serif text-2xl font-normal text-[#1c1917] md:text-3xl">Features</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {project.amenities.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 font-sans text-sm text-[#1c1917]/80">
                      <CheckCircle size={16} className="mt-0.5 shrink-0 text-[#1c1917]/40" strokeWidth={1.5} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {project.investmentHighlights && project.investmentHighlights.length > 0 && (
              <div className="border border-[#1c1917]/10 bg-white p-8 md:p-10">
                <h2 className="mb-6 font-serif text-2xl font-normal text-[#1c1917]">Investment highlights</h2>
                <ul className="space-y-4 font-serif text-[15px] leading-relaxed text-[#1c1917]/75">
                  {project.investmentHighlights.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="text-[#1c1917]/30">-</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {units.length > 0 && (
              <div>
                <h2 className="mb-6 font-serif text-2xl font-normal text-[#1c1917] md:text-3xl">Units</h2>
                <div className="overflow-x-auto border border-[#1c1917]/10 bg-white">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-[#1c1917]/10 bg-[#F4EFE8]">
                        <th className="px-4 py-3 text-left font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#1c1917]/50">
                          Unit
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#1c1917]/50">
                          Bed / Bath
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#1c1917]/50">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#1c1917]/50">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-[#1c1917]/50">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit) => (
                        <tr key={unit.id} className="border-b border-[#1c1917]/5 last:border-0" data-testid={`row-unit-${unit.id}`}>
                          <td className="px-4 py-3 font-medium text-[#1c1917]">{unit.unitName}</td>
                          <td className="px-4 py-3 text-[#1c1917]/70">
                            {unit.bedrooms} / {unit.bathrooms}
                          </td>
                          <td className="px-4 py-3 text-[#1c1917]/70">{unit.buildSize ? `${unit.buildSize} m²` : "-"}</td>
                          <td className="px-4 py-3 font-medium text-[#1c1917]">{formatPrice(unit.price, unit.currency)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-1 font-sans text-[10px] uppercase tracking-[0.15em] ${
                                statusColor[unit.status as keyof typeof statusColor] ?? ""
                              }`}
                            >
                              {unit.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-[#1c1917]/10 bg-[#1c1917] p-8 text-white">
              <p className="font-sans text-[10px] uppercase tracking-[0.24em] text-white/50">Starting from</p>
              <p className="mt-2 font-serif text-3xl font-normal">{formatPrice(project.priceFrom, project.currency)}</p>

              <a
                href={`https://wa.me/6281234567890?text=Hi, I am interested in ${encodeURIComponent(project.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 block"
              >
                <Button className="h-12 w-full rounded-none border-0 bg-white font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#1c1917] hover:bg-white/90">
                  <MessageCircle size={16} className="mr-2" />
                  Enquire
                </Button>
              </a>
              {project.brochureUrl && (
                <a href={project.brochureUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-none border-white/30 bg-transparent font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white/10"
                  >
                    <Download size={16} className="mr-2" />
                    Brochure
                  </Button>
                </a>
              )}

              <div className="mt-10 border-t border-white/15 pt-8">
                <h3 className="mb-4 font-sans text-[10px] font-medium uppercase tracking-[0.22em] text-white/50">Message</h3>
                <form onSubmit={onSubmit} className="space-y-3">
                  <Input
                    placeholder="Name"
                    {...form.register("name", { required: true })}
                    className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    data-testid="input-name"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    {...form.register("email", { required: true })}
                    className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    data-testid="input-email"
                  />
                  <Input
                    placeholder="Phone"
                    {...form.register("phone")}
                    className="rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    data-testid="input-phone"
                  />
                  <Select onValueChange={(v) => form.setValue("budgetRange", v)}>
                    <SelectTrigger
                      className="rounded-none border-white/20 bg-white/10 text-white data-[placeholder]:text-white/40"
                      data-testid="select-budget"
                    >
                      <SelectValue placeholder="Budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Under $300,000">Under $300,000</SelectItem>
                      <SelectItem value="$300,000 - $500,000">$300,000 – $500,000</SelectItem>
                      <SelectItem value="$500,000 - $750,000">$500,000 – $750,000</SelectItem>
                      <SelectItem value="$750,000 - $1,000,000">$750,000 – $1M</SelectItem>
                      <SelectItem value="Over $1,000,000">Over $1M</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Your message"
                    {...form.register("message")}
                    className="h-24 resize-none rounded-none border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    data-testid="textarea-message"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    className="h-11 w-full rounded-none border-white/40 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white hover:bg-white/10"
                    disabled={createEnquiry.isPending}
                    data-testid="button-submit"
                  >
                    {createEnquiry.isPending ? "Sending…" : "Send"}
                  </Button>
                </form>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 border-t border-[#1c1917]/10 pt-16"
          >
            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.26em] text-[#1c1917]/45">More</p>
            <h2 className="mt-3 font-serif text-2xl text-[#1c1917] md:text-3xl">Other developments</h2>
            <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
              {related.map((p) => (
                <Link key={p.id} href={`/projects/${p.slug}`} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-[#e8e2da]">
                    {p.heroImageUrl ? (
                      <img
                        src={p.heroImageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02] group-hover:opacity-90"
                      />
                    ) : null}
                  </div>
                  <p className="mt-5 font-sans text-[10px] uppercase tracking-[0.22em] text-[#1c1917]/45">
                    {(p.propertyType + " · " + p.area).toUpperCase()}
                  </p>
                  <h3 className="mt-2 font-serif text-xl text-[#1c1917] transition-colors group-hover:text-[#1c1917]/70">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
