import { motion } from "framer-motion";
import { CheckCircle, TrendingUp, Shield, Globe } from "lucide-react";
import { useCreateEnquiry } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Seo } from "@/components/site/Seo";
import { truncateForMeta } from "@/lib/site-seo";

export default function Invest() {
  const createEnquiry = useCreateEnquiry();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: { name: "", email: "", country: "", budgetRange: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createEnquiry.mutateAsync({
        data: {
          name: values.name,
          email: values.email,
          country: values.country || null,
          budgetRange: values.budgetRange || null,
          source: "guide_download",
        },
      });
      toast({ title: "Guide sent!", description: "Check your inbox for the 8 Degree Investment Guide." });
      form.reset();
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    }
  });

  const benefits = [
    { icon: TrendingUp, title: "10–12% portfolio ROI focus", body: "We advise on investment properties with a clear performance lens, targeting disciplined portfolio outcomes, not hype or unverified projections." },
    { icon: Shield, title: "Legal structure & clarity", body: "Every opportunity is assessed for legal structure and risk. We favour transparent frameworks foreign investors can understand, with counsel where it matters." },
    { icon: Globe, title: "Strategy and lifestyle", body: "Whether you prioritise yield, relocation, or both, we help you position in Bali's evolving landscape: fewer options, higher standards, clear guidance." },
    { icon: CheckCircle, title: "Boutique advisory", body: "We are not a mass-market brokerage. Structured process, transparent communication, and long-term relationships beyond a single transaction." },
  ];

  const included = [
    "Full legal framework for foreign investors in Bali",
    "Step-by-step acquisition process",
    "Freehold vs leasehold: a complete comparison",
    "Historical ROI data from completed projects",
    "Area-by-area investment guide (Seminyak, Canggu, Uluwatu, Ubud)",
    "Rental yield modelling methodology",
    "Management programme overview",
    "Tax considerations for international investors",
    "FAQ: everything your advisors will want to know",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Invest in Bali luxury property"
        description={truncateForMeta(
          "Investment guide: yield, risk, and how we structure Bali villa and development opportunities for international buyers.",
        )}
        path="/invest"
      />
      {/* Hero */}
      <div className="bg-foreground text-background pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
              >
                The Complete Resource
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-serif text-4xl md:text-5xl leading-tight mb-6"
              >
                The 8 Degree Investment Guide
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-background/70 text-lg leading-relaxed"
              >
                A practical overview for international buyers and investors, aligned with how 8 Degree vets opportunities: legal structure, build quality, location fundamentals, developer credibility, and long-term value sustainability.
              </motion.p>
            </div>

            {/* Download Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-background text-foreground p-8"
            >
              <h2 className="font-serif text-2xl mb-2">Download Free Guide</h2>
              <p className="text-muted-foreground text-sm mb-6">Delivered instantly to your inbox.</p>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input
                  placeholder="Full Name *"
                  {...form.register("name", { required: true })}
                  className="rounded-none"
                  data-testid="input-name"
                />
                <Input
                  placeholder="Email Address *"
                  type="email"
                  {...form.register("email", { required: true })}
                  className="rounded-none"
                  data-testid="input-email"
                />
                <Input
                  placeholder="Country of Residence"
                  {...form.register("country")}
                  className="rounded-none"
                  data-testid="input-country"
                />
                <Select onValueChange={(v) => form.setValue("budgetRange", v)}>
                  <SelectTrigger className="rounded-none" data-testid="select-budget">
                    <SelectValue placeholder="Investment Budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Under $300,000">Under $300,000</SelectItem>
                    <SelectItem value="$300,000 - $500,000">$300,000 – $500,000</SelectItem>
                    <SelectItem value="$500,000 - $750,000">$500,000 – $750,000</SelectItem>
                    <SelectItem value="$750,000 - $1,000,000">$750,000 – $1M</SelectItem>
                    <SelectItem value="Over $1,000,000">Over $1M</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  className="w-full rounded-none tracking-widest uppercase h-12 bg-foreground text-background hover:bg-foreground/80"
                  disabled={createEnquiry.isPending}
                  data-testid="button-download"
                >
                  {createEnquiry.isPending ? "Sending..." : "Download Investment Guide"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">No spam. Unsubscribe at any time.</p>
              </form>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="container mx-auto max-w-6xl px-6 py-20">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4 text-center">Why download</p>
        <h2 className="font-serif text-3xl md:text-4xl mb-16 text-center">How we advise</h2>
        <div className="grid md:grid-cols-2 gap-12">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6"
            >
              <div className="w-10 h-10 border border-border flex items-center justify-center shrink-0">
                <b.icon size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-xl mb-2">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div className="bg-muted/30 border-y border-border">
        <div className="container mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-2xl mb-8">What's Inside the Guide</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {included.map((item, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle size={14} className="text-primary shrink-0 mt-0.5" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
