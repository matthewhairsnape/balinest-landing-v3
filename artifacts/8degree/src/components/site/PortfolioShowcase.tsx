import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { Project } from "@workspace/api-client-react";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1613490908578-7804bb61483b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80";

function categoryLabel(p: Project): string {
  const status = (p.status ?? "").replace(/-/g, " ");
  const type = p.propertyType ?? "Development";
  const area = p.area ?? "Bali";
  return `${type} · ${area}`.toUpperCase();
}

export function PortfolioShowcase({ projects }: { projects: Project[] }) {
  if (!projects.length) return null;

  return (
    <section className="py-20 md:py-28 bg-[#F4EFE8] text-[#1c1917]">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-14">
        <div className="mb-16 md:mb-24 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.28em] text-[#1c1917]/55">
              Portfolio
            </p>
            <h2 className="font-serif text-3xl leading-[1.15] tracking-tight text-[#1c1917] md:text-4xl lg:text-[2.75rem]">
              Developments shaped for place, permanence, and clarity.
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex shrink-0 items-center gap-2 self-start font-sans text-[11px] font-medium uppercase tracking-[0.22em] text-[#1c1917] underline-offset-4 transition-colors hover:text-[#1c1917]/70 md:self-end"
          >
            View all
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div
          className="grid grid-cols-1 gap-y-16 md:gap-y-20 lg:grid-cols-[minmax(0,1.48fr)_minmax(0,1fr)] lg:gap-x-12 lg:gap-y-24 xl:gap-x-16"
          style={{ alignItems: "start" }}
        >
          {projects.map((project, idx) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: Math.min(idx * 0.06, 0.35) }}
              className={idx % 2 === 1 ? "lg:pt-12 xl:pt-16" : ""}
            >
              <Link href={`/projects/${project.slug}`} className="group block">
                <div className="overflow-hidden bg-[#e8e2da]">
                  <img
                    src={project.heroImageUrl || FALLBACK_IMG}
                    alt={project.title}
                    className="aspect-[5/6] w-full object-cover transition-[opacity,transform] duration-[1.1s] ease-out group-hover:scale-[1.02] group-hover:opacity-[0.92] md:aspect-[4/5]"
                    decoding="async"
                    loading="lazy"
                  />
                </div>
                <p className="mt-7 font-sans text-[10px] font-medium uppercase tracking-[0.26em] text-[#1c1917]/50 md:text-[11px]">
                  {categoryLabel(project)}
                </p>
                <h3 className="mt-3 max-w-md font-serif text-2xl font-normal leading-snug tracking-tight text-[#1c1917] transition-colors group-hover:text-[#1c1917]/80 md:text-3xl lg:text-[2rem]">
                  {project.title}
                </h3>
                <p className="mt-4 max-w-md font-serif text-[15px] font-normal leading-relaxed text-[#1c1917]/72 md:text-base">
                  {project.shortDescription}
                </p>
                <p className="mt-5 font-sans text-[11px] uppercase tracking-[0.18em] text-[#1c1917]/45">
                  From {project.currency} {project.priceFrom.toLocaleString()}
                </p>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
