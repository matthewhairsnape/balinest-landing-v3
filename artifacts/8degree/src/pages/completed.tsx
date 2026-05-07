import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, CheckCircle } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";
import { Seo } from "@/components/site/Seo";
import { truncateForMeta } from "@/lib/site-seo";

export default function CompletedProjects() {
  const { data, isLoading } = useListProjects({ status: "completed", limit: 20 });
  const projects = data?.projects ?? [];

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Completed developments · track record"
        description={truncateForMeta(
          "Delivered Bali developments and completed projects from the 8 Degree portfolio.",
        )}
        path="/projects/completed"
      />
      <div className="bg-foreground text-background pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
          >
            Track Record
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-4xl md:text-6xl leading-tight"
          >
            Completed Developments
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-background/70 max-w-xl"
          >
            Every completed 8 Degree development has delivered above-projection returns and earned industry recognition for design and construction quality.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 py-16">
        {isLoading ? (
          <div className="space-y-12">
            {[1, 2].map(i => <div key={i} className="h-72 bg-muted animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-center text-muted-foreground py-24 font-serif text-2xl">No completed projects yet.</p>
        ) : (
          <div className="space-y-16">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                data-testid={`card-project-${project.id}`}
              >
                <Link href={`/projects/${project.slug}`}>
                  <div className={`group cursor-pointer grid md:grid-cols-2 gap-0 ${i % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                    <div className={`relative overflow-hidden aspect-[4/3] md:aspect-auto ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                      {project.heroImageUrl ? (
                        <img
                          src={project.heroImageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted min-h-[320px]" />
                      )}
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-1 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">
                          <CheckCircle size={10} />
                          Completed {project.completionDate}
                        </div>
                      </div>
                    </div>
                    <div className={`bg-card border border-border p-8 md:p-12 flex flex-col justify-center ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                      <div className="flex items-center gap-1 text-muted-foreground text-xs tracking-[0.15em] uppercase mb-4">
                        <MapPin size={10} />
                        {project.area} · {project.propertyType}
                      </div>
                      <h2 className="font-serif text-3xl md:text-4xl mb-4 group-hover:text-primary transition-colors">{project.title}</h2>
                      <p className="text-muted-foreground leading-relaxed mb-6">{project.shortDescription}</p>
                      <div className="pt-4 border-t border-border">
                        <span className="text-xs tracking-[0.2em] uppercase text-primary font-medium">View Development</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
