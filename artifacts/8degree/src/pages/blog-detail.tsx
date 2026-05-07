import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { Clock, User, ArrowLeft } from "lucide-react";
import { useGetBlogPost, useListBlogPosts, getGetBlogPostQueryKey, useCreateEnquiry } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Fragment, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Seo } from "@/components/site/Seo";
import { canonicalUrl, jsonLdGraph, organizationJsonLdNode, truncateForMeta } from "@/lib/site-seo";

export default function BlogDetail() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const createEnquiry = useCreateEnquiry();
  const { toast } = useToast();

  const { data: post, isLoading } = useGetBlogPost(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) },
  });
  const { data: relatedData } = useListBlogPosts({ limit: 4 });
  const related = (relatedData?.posts ?? []).filter(p => p.slug !== slug).slice(0, 3);

  const postJsonLd = useMemo(() => {
    if (!post) return null;
    return jsonLdGraph([
      organizationJsonLdNode(),
      {
        "@type": "Article",
        headline: post.title,
        description: truncateForMeta(post.excerpt),
        url: canonicalUrl(`/blog/${encodeURIComponent(post.slug)}`),
        datePublished: post.publishedAt ?? undefined,
        author: { "@type": "Person", name: post.author },
        ...(post.featuredImageUrl ? { image: [post.featuredImageUrl] } : {}),
      },
    ]);
  }, [post]);

  const handleCtaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    try {
      await createEnquiry.mutateAsync({ data: { name, email, source: "blog_cta" } });
      toast({ title: "You are subscribed", description: "We will keep you informed." });
      setEmail(""); setName("");
    } catch {
      toast({ title: "Error", description: "Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Fragment>
        <Seo
          title="Journal article"
          description="Loading article."
          path={`/blog/${encodeURIComponent(slug)}`}
        />
        <div className="min-h-screen bg-background pt-32">
          <div className="container mx-auto max-w-3xl px-6 space-y-4">
            <div className="h-8 bg-muted animate-pulse w-1/3" />
            <div className="h-64 bg-muted animate-pulse" />
            <div className="h-4 bg-muted animate-pulse" />
          </div>
        </div>
      </Fragment>
    );
  }

  if (!post) {
    return (
      <Fragment>
        <Seo
          title="Article not found"
          description="This journal article does not exist or was removed."
          path={`/blog/${encodeURIComponent(slug)}`}
          noindex
        />
        <div className="min-h-screen bg-background pt-32 text-center">
          <p className="font-serif text-3xl text-muted-foreground">Article not found</p>
          <Link href="/blog"><Button className="mt-6 rounded-none">Back to Journal</Button></Link>
        </div>
      </Fragment>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={post.title}
        description={truncateForMeta(post.excerpt)}
        path={`/blog/${encodeURIComponent(post.slug)}`}
        image={post.featuredImageUrl}
        type="article"
        jsonLd={postJsonLd}
      />
      {/* Hero */}
      {post.featuredImageUrl && (
        <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
          <img src={post.featuredImageUrl} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
        </div>
      )}

      <div className={`container mx-auto max-w-3xl px-6 ${post.featuredImageUrl ? '-mt-24 relative z-10' : 'pt-32'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${post.featuredImageUrl ? 'bg-background p-8 md:p-12 mb-8 border-b border-border' : 'py-12 mb-8 border-b border-border'}`}
        >
          <Link href="/blog">
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm tracking-wide mb-6">
              <ArrowLeft size={14} /> Back to Journal
            </button>
          </Link>
          {post.categoryName && (
            <span className="text-xs tracking-[0.3em] uppercase text-primary">{post.categoryName}</span>
          )}
          <h1 className="font-serif text-3xl md:text-4xl mt-3 mb-5 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User size={12} /> {post.author}</span>
            <span className="flex items-center gap-1"><Clock size={12} /> {post.readingTime} min read</span>
            {post.publishedAt && (
              <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-stone max-w-none mb-16"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA Block */}
        <div className="bg-foreground text-background p-8 md:p-12 mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-3">Ready to Invest?</p>
          <h2 className="font-serif text-2xl mb-4">Download Our Investment Guide</h2>
          <p className="text-background/70 mb-6 text-sm">Everything you need to know about investing in luxury Bali property. Delivered to your inbox.</p>
          <form onSubmit={handleCtaSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-none bg-background/10 border-background/20 text-background placeholder:text-background/50 flex-1"
              data-testid="input-cta-name"
            />
            <Input
              placeholder="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="rounded-none bg-background/10 border-background/20 text-background placeholder:text-background/50 flex-1"
              data-testid="input-cta-email"
            />
            <Button
              type="submit"
              variant="secondary"
              className="rounded-none tracking-widest uppercase whitespace-nowrap"
              disabled={createEnquiry.isPending}
              data-testid="button-cta-submit"
            >
              Get the Guide
            </Button>
          </form>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="border-t border-border pt-12 pb-16">
            <h2 className="font-serif text-2xl mb-8">Further Reading</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`}>
                  <div className="group cursor-pointer">
                    {p.featuredImageUrl && (
                      <div className="aspect-video overflow-hidden bg-muted mb-3">
                        <img src={p.featuredImageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <h3 className="font-serif text-sm leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
