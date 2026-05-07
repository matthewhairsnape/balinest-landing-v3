import { motion } from "framer-motion";
import { useListProjects, useCreateEnquiry } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Seo } from "@/components/site/Seo";
import { truncateForMeta } from "@/lib/site-seo";

export default function Pricing() {
  const { data } = useListProjects({ status: "ongoing", limit: 10 });
  const projects = data?.projects ?? [];
  const createEnquiry = useCreateEnquiry();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: { name: "", email: "", phone: "", country: "", budgetRange: "", projectId: "", message: "" },
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
          interestedProjectId: values.projectId ? Number(values.projectId) : null,
          source: "pricing_page",
        },
      });
      toast({ title: "Request received", description: "Our team will send you full pricing details within 24 hours." });
      form.reset();
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Request pricing · Bali developments"
        description={truncateForMeta(
          "Request indicative pricing and availability for ongoing Bali developments in the 8 Degree portfolio.",
        )}
        path="/pricing"
      />
      <div className="bg-foreground text-background pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
          >
            Request Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl leading-tight mb-6"
          >
            Get Full Pricing Details
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-background/70 max-w-xl mx-auto"
          >
            We share detailed pricing, payment plans, and availability directly with qualified investors. Complete the form and our team will be in touch within 24 hours.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-6 py-16">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
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
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              placeholder="Phone / WhatsApp"
              {...form.register("phone")}
              className="rounded-none"
              data-testid="input-phone"
            />
            <Input
              placeholder="Country"
              {...form.register("country")}
              className="rounded-none"
              data-testid="input-country"
            />
          </div>
          <Select onValueChange={(v) => form.setValue("projectId", v)}>
            <SelectTrigger className="rounded-none" data-testid="select-project">
              <SelectValue placeholder="Select a development (optional)" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Textarea
            placeholder="Any specific questions about pricing, payment plans, or availability..."
            {...form.register("message")}
            className="rounded-none resize-none h-32"
            data-testid="textarea-message"
          />
          <Button
            type="submit"
            className="w-full rounded-none tracking-widest uppercase h-12"
            disabled={createEnquiry.isPending}
            data-testid="button-submit"
          >
            {createEnquiry.isPending ? "Sending..." : "Request Pricing"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            We respond to every pricing enquiry within one business day.
          </p>
        </form>
      </div>
    </div>
  );
}
