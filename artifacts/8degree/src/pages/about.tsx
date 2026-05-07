import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TeamPhotos } from "@/components/site/TeamPhotos";
import { SITE_MEDIA } from "@/lib/site-assets";
import { Seo } from "@/components/site/Seo";
import { jsonLdGraph, organizationJsonLdNode, truncateForMeta } from "@/lib/site-seo";

const stats = [
  { value: "4+", label: "Years operating in Bali" },
  { value: "80+", label: "Curated properties in portfolio" },
  { value: "10+", label: "Transactions above IDR 16B" },
  { value: "10–12%", label: "Investment portfolio ROI focus" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="About 8 Degree · Bali advisory team"
        description={truncateForMeta(
          "Meet the 8 Degree team: boutique Bali property advisory focused on clarity, curation, and long-term value.",
        )}
        path="/about"
        jsonLd={jsonLdGraph([organizationJsonLdNode()])}
      />
      {/* Hero */}
      <div className="relative h-[55vh] min-h-[420px] overflow-hidden">
        <img
          src={SITE_MEDIA.heroPoster}
          alt="Bali"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = SITE_MEDIA.heroStill;
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto max-w-6xl px-6 pb-16 text-white">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
            >
              Company overview · Brand story · Mission &amp; values
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl md:text-6xl leading-tight max-w-4xl"
            >
              About 8 Degree
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-white/90 max-w-2xl font-light"
            >
              Boutique real estate investment advisory in Bali: clarity, structure, and long-term positioning.
            </motion.p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-foreground text-background">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="font-serif text-3xl md:text-4xl text-primary mb-2">{s.value}</div>
                <div className="text-xs tracking-[0.2em] uppercase text-background/60 leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-6 py-20 space-y-20">
        {/* Company Overview */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary">Company overview</p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight">8 Degree Real Estate Agency</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>
              8 Degree Real Estate Agency is a boutique real estate investment advisory based in Bali.
            </p>
            <p>
              For over four years, we have operated at the intersection of strategic investment and quality living, helping clients secure both high-performing assets and exceptional homes in Bali&apos;s most desirable areas.
            </p>
            <p>
              With a focused portfolio of 80+ curated properties and 10+ transactions above IDR 16 billion, we prioritize precision over volume.
            </p>
            <p className="text-foreground font-medium">
              We are not a mass-market brokerage.
            </p>
            <p className="text-foreground font-medium">
              We are a strategic partner for clients who value clarity, structure, and long-term positioning.
            </p>
          </div>
        </motion.section>

        {/* What We Do */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6 border-t border-border pt-20"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary">What we do</p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight">Advisory scope</h2>
          <p className="text-muted-foreground leading-relaxed">We advise clients on:</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
            <li>Investment properties targeting 10–12% portfolio ROI performance</li>
            <li>Residential homes for relocation and long-term living</li>
            <li>High-value transactions above IDR 16B</li>
            <li>Select off-market opportunities</li>
            <li>Strategic portfolio positioning within Bali&apos;s evolving property landscape</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed pt-4">
            Whether you are acquiring a rental asset or purchasing a home to live in, every property we present is vetted for:
          </p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-2 leading-relaxed">
            <li>Legal structure</li>
            <li>Build quality</li>
            <li>Location fundamentals</li>
            <li>Developer credibility</li>
            <li>Long-term value sustainability</li>
          </ul>
          <p className="text-foreground font-medium pt-2">Fewer options. Higher standards. Clear guidance.</p>
        </motion.section>

        {/* Investment & Living */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6 border-t border-border pt-20"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary">Brand story</p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight">Investment &amp; living, not one or the other</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>We believe Bali property should serve your strategy and your lifestyle.</p>
            <p>Some clients come to us focused on yield. Others are searching for a home that reflects the way they want to live. Often, the right property delivers both.</p>
            <p>A residence that feels right. An asset that performs.</p>
            <p className="text-foreground font-medium">That balance is where we operate.</p>
          </div>
        </motion.section>

        {/* Our Approach */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-6 border-t border-border pt-20"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary">Our approach</p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight">Built differently</h2>
          <div className="text-muted-foreground leading-relaxed space-y-4">
            <p>The Bali market can be fragmented and opaque.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Unverified projections.</li>
              <li>Inconsistent legal clarity.</li>
              <li>Transactional agents.</li>
            </ul>
            <p className="text-foreground font-medium pt-2">We built 8 Degree differently.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Transparent communication.</li>
              <li>Structured advisory process.</li>
              <li>Long-term relationships beyond the transaction.</li>
            </ul>
            <p>Because real estate is not a one-time event; it&apos;s a positioning decision.</p>
          </div>
        </motion.section>

        {/* Mission & Vision */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 border-t border-border pt-20"
        >
          <div className="space-y-4">
            <p className="text-xs tracking-[0.3em] uppercase text-primary">Mission</p>
            <p className="text-muted-foreground leading-relaxed">
              To structure intelligent property opportunities in Bali that deliver measurable financial performance and exceptional living standards.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-xs tracking-[0.3em] uppercase text-primary">Vision</p>
            <p className="text-muted-foreground leading-relaxed">
              To become Bali&apos;s leading boutique real estate advisory, known for integrity, strategic execution, and trusted long-term partnerships.
            </p>
          </div>
        </motion.section>

        {/* The 8 Degree Principle */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-border pt-20 pb-4"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Values</p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6">The 8 Degree principle</h2>
          <blockquote className="border-l-2 border-primary pl-6 text-muted-foreground leading-relaxed space-y-4">
            <p>Small shifts in decision-making create significant long-term impact.</p>
            <p>The right entry point. The right structure. The right property.</p>
            <p>A few degrees today can compound into substantial advantage tomorrow.</p>
            <p className="text-foreground font-medium not-italic">That&apos;s the level we operate on.</p>
          </blockquote>
        </motion.section>

        {/* Team */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-border pt-20"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-2">People</p>
          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-8">Team</h2>
          <TeamPhotos />
        </motion.section>
      </div>

      {/* Image band */}
      <div className="bg-muted/30 border-y border-border py-16">
        <div className="container mx-auto max-w-6xl px-6">
          <motion.img
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            src={SITE_MEDIA.topArea}
            alt="Bali property"
            className="w-full aspect-[21/9] object-cover max-h-[420px]"
            onError={(e) => {
              e.currentTarget.src = SITE_MEDIA.heroStill;
            }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Next step</p>
        <h2 className="font-serif text-3xl md:text-5xl mb-6">Position your portfolio with clarity</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Whether you are focused on yield, relocation, or both, we structure opportunities that meet higher standards.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/contact">
            <Button className="rounded-none tracking-widest uppercase h-12 px-8">Get in touch</Button>
          </Link>
          <Link href="/invest">
            <Button variant="outline" className="rounded-none tracking-widest uppercase h-12 px-8">
              Download investment guide
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
