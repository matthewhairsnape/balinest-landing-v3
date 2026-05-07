import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HeroMedia } from "@/components/site/HeroMedia";
import { PortfolioShowcase } from "@/components/site/PortfolioShowcase";
import { FeaturedInventoryStrip } from "@/components/site/FeaturedInventoryStrip";
import { TopAreaImage } from "@/components/site/TopAreaImage";
import { useGetFeaturedProjects, useGetSiteOverview, useListBlogPosts, useListTestimonials } from "@workspace/api-client-react";
import { Seo } from "@/components/site/Seo";
import {
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  jsonLdGraph,
  organizationJsonLdNode,
  SITE_NAME,
  truncateForMeta,
} from "@/lib/site-seo";

export default function Home() {
  const { data: featuredProjectsData } = useGetFeaturedProjects();
  const { data: siteOverview } = useGetSiteOverview();
  const { data: testimonialsData } = useListTestimonials();
  const { data: blogPostsData } = useListBlogPosts({ limit: 3 });

  return (
    <div className="w-full">
      <Seo
        title="Luxury Bali real estate & strategic developments"
        description={truncateForMeta(DEFAULT_DESCRIPTION)}
        path="/"
        jsonLd={jsonLdGraph([
          organizationJsonLdNode(),
          { "@type": "WebSite", name: SITE_NAME, url: canonicalUrl("/") },
        ])}
      />
      {/* Hero Section */}
      <section className="relative h-[100dvh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <HeroMedia />
        </div>
        
        <div className="container relative z-20 px-6 mx-auto text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="font-serif text-4xl md:text-6xl lg:text-7xl mb-6 max-w-4xl mx-auto leading-tight"
          >
            Strategic property in Bali: performance and living
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-white/90 font-light"
          >
            Boutique advisory: fewer options, higher standards, clear guidance for yield, relocation, or both.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/projects">
              <Button size="lg" className="rounded-none tracking-widest uppercase w-full sm:w-auto h-14 px-8 bg-white text-black hover:bg-white/90">
                View Portfolio
              </Button>
            </Link>
            <Link href="/invest">
              <Button size="lg" variant="outline" className="rounded-none tracking-widest uppercase w-full sm:w-auto h-14 px-8 border-white text-white hover:bg-white hover:text-black">
                Investment Guide
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {featuredProjectsData?.projects && featuredProjectsData.projects.length > 0 ? (
        <PortfolioShowcase projects={featuredProjectsData.projects} />
      ) : null}

      <FeaturedInventoryStrip />

      {/* Why Invest - Site Overview */}
      <section className="py-24 bg-foreground text-background">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="font-serif text-3xl md:text-5xl mb-6">The 8 Degree Advantage</h2>
              <p className="text-background/80 mb-8 leading-relaxed">
                We don't just build properties; we craft legacies. Our developments represent the pinnacle of luxury living in Bali, combining visionary architecture with strategic locations to deliver unparalleled lifestyle and investment returns.
              </p>
              
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <div className="text-4xl font-serif text-primary mb-2">{siteOverview?.totalProjects || 12}</div>
                  <div className="text-sm uppercase tracking-widest text-background/60">Exclusive Developments</div>
                </div>
                <div>
                  <div className="text-4xl font-serif text-primary mb-2">{siteOverview?.yearsExperience || 8}+</div>
                  <div className="text-sm uppercase tracking-widest text-background/60">Years in Bali</div>
                </div>
                <div>
                  <div className="text-4xl font-serif text-primary mb-2">{siteOverview?.averageRoi || "12-15%"}</div>
                  <div className="text-sm uppercase tracking-widest text-background/60">Projected ROI</div>
                </div>
                <div>
                  <div className="text-4xl font-serif text-primary mb-2">{siteOverview?.totalUnits || 150}+</div>
                  <div className="text-sm uppercase tracking-widest text-background/60">Units Delivered</div>
                </div>
              </div>

              <Link href="/about">
                <Button variant="outline" className="rounded-none tracking-widest uppercase border-background/20 text-background hover:bg-background hover:text-foreground h-12 px-8">
                  Our Philosophy
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square overflow-hidden"
            >
              <TopAreaImage alt="8 Degree · Bali property advisory" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="container px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-5xl text-foreground mb-4">Client Voices</h2>
            <p className="text-muted-foreground">What our investors say about their 8 Degree experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonialsData?.testimonials?.slice(0, 3).map((testimonial, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                key={testimonial.id}
                className="bg-background p-8 border border-border"
              >
                <div className="flex gap-1 mb-6 text-primary">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-foreground/80 mb-8 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-medium text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.country}</div>
                  {testimonial.projectTitle && (
                    <div className="text-sm text-primary mt-1">Investor, {testimonial.projectTitle}</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <div className="container px-6 mx-auto max-w-3xl">
          <h2 className="font-serif text-3xl md:text-5xl mb-6">Ready to Begin Your Journey?</h2>
          <p className="text-primary-foreground/80 mb-10 text-lg">
            Connect with our investment advisors to discover the perfect property for your portfolio or lifestyle needs.
          </p>
          <Link href="/contact">
            <Button size="lg" className="rounded-none tracking-widest uppercase bg-white text-primary hover:bg-white/90 h-14 px-10">
              Schedule a Consultation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
