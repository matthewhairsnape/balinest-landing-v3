import { Seo } from "@/components/site/Seo";
import { useLocation } from "wouter";

type InfoPageContent = {
  title: string;
  description: string;
  body: string[];
};

const INFO_BY_PATH: Record<string, InfoPageContent> = {
  "/favorite-properties": {
    title: "Favorite Properties",
    description: "Save and revisit your shortlisted Bali properties.",
    body: [
      "Use this section to track listings you are actively comparing.",
      "Our team can also curate and share a private shortlist based on your criteria.",
    ],
  },
  "/frequently-asked-questions": {
    title: "Frequently Asked Questions",
    description: "Answers to common questions about buying and investing in Bali property.",
    body: [
      "Find guidance on ownership, due diligence, taxes, and timelines.",
      "For a specific scenario, contact us and we will advise based on your goals.",
    ],
  },
  "/company-overview": {
    title: "Company Overview",
    description: "Learn about 8 Degree's advisory approach, market focus, and operating model.",
    body: [
      "We combine local market intelligence with investor-first analysis.",
      "Our advisory process focuses on risk clarity, performance, and execution quality.",
    ],
  },
  "/testimony": {
    title: "Testimony",
    description: "Client experiences working with 8 Degree.",
    body: [
      "Read real buyer and investor stories from projects across Bali.",
      "Our team can also provide references on request for relevant property types.",
    ],
  },
  "/legal-services": {
    title: "Legal Services",
    description: "Legal support and structuring for Bali property transactions.",
    body: [
      "We coordinate legal partners for ownership structuring and contract review.",
      "Our process prioritizes compliance, documentation quality, and transaction safety.",
    ],
  },
  "/legal-and-due-diligence": {
    title: "Legal and Due Diligence",
    description: "Legal checks and due diligence workflow before acquisition.",
    body: [
      "Every acquisition should complete legal, zoning, and documentation checks.",
      "We help align legal due diligence with your investment strategy and timeline.",
    ],
  },
  "/data-driven": {
    title: "Data Driven",
    description: "How we use market data and underwriting in property recommendations.",
    body: [
      "Our recommendations are informed by pricing trends, demand patterns, and comparables.",
      "We continuously validate assumptions against current market conditions.",
    ],
  },
  "/bali-property-guide": {
    title: "Bali Property Guide",
    description: "Practical guide for researching and acquiring property in Bali.",
    body: [
      "Explore ownership models, area dynamics, and acquisition best practices.",
      "Use this guide as a framework before shortlisting opportunities.",
    ],
  },
  "/bali-location-guide": {
    title: "Bali Location Guide",
    description: "Area-by-area guide to Bali locations for living and investment.",
    body: [
      "Compare location profiles by lifestyle, demand, and growth potential.",
      "We help match your goals with the right micro-market.",
    ],
  },
};

const FALLBACK: InfoPageContent = {
  title: "Page",
  description: "Information page.",
  body: ["This page is available and will be expanded with full content soon."],
};

export default function InfoPage() {
  const [location] = useLocation();
  const page = INFO_BY_PATH[location] ?? FALLBACK;

  return (
    <div className="min-h-screen bg-background pt-28 pb-20 px-6">
      <Seo title={page.title} description={page.description} path={location} />
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-4xl md:text-5xl text-foreground">{page.title}</h1>
        <p className="mt-4 text-muted-foreground">{page.description}</p>
        <div className="mt-10 space-y-5 text-foreground/90 leading-relaxed">
          {page.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
