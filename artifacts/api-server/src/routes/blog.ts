import { Router } from "express";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { db, isDatabaseConfigured } from "@workspace/db";
import { blogPostsTable, blogCategoriesTable } from "@workspace/db";
import {
  ListBlogPostsQueryParams,
  CreateBlogPostBody,
  GetBlogPostParams,
  UpdateBlogPostParams,
  UpdateBlogPostBody,
  DeleteBlogPostParams,
} from "@workspace/api-zod";
import {
  getJournalFallbackBySlug,
  listJournalFallback,
  listJournalFallbackCategories,
  syncJournalImportToDatabaseIfEmpty,
  type JournalPostDto,
} from "../lib/journal-import-fallback";
import {
  getJournalFromSheetBySlug,
  listJournalFromSheet,
  listJournalSheetCategories,
  loadArticlesFromGoogleSheet,
  useSheetAsJournalSource,
} from "../lib/journal-articles-sheet";
import { resolveJournalFeaturedImageUrl, rewriteJournalContentHtml } from "../lib/journal-image-url";

const router = Router();

function journalMediaRoots(): string[] {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [
    path.resolve(here, "../data/journal-media"),
    path.resolve(process.cwd(), "artifacts/api-server/data/journal-media"),
  ];
}

function resolveBundledJournalMediaPath(relativePath: string): string | null {
  const rel = relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!rel || rel.includes("..")) return null;
  for (const root of journalMediaRoots()) {
    const full = path.resolve(root, rel);
    if (!full.startsWith(`${root}${path.sep}`) && full !== root) continue;
    if (existsSync(full)) return full;
  }
  return null;
}

/** Serve bundled legacy WordPress journal images when present under `artifacts/api-server/data/journal-media/`. */
router.get("/journal/media/*splat", (req, res): void => {
  const raw = req.params.splat;
  const rel = (Array.isArray(raw) ? raw.join("/") : raw ?? "").trim();
  if (!rel) {
    res.status(400).end();
    return;
  }
  const filePath = resolveBundledJournalMediaPath(rel);
  if (!filePath) {
    res.status(404).end();
    return;
  }
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  createReadStream(filePath).pipe(res);
});

const BlogRefreshQuery = z.object({
  refreshSheet: z.string().optional(),
});

/**
 * HARD RULE: public journal GETs must never take blogs down.
 * Prefer Google Sheet → bundled journal-import.json → DB.
 * Never return Express HTML 500 for list/categories/slug reads.
 */
async function resolveCategories(forceRefresh: boolean) {
  if (useSheetAsJournalSource()) {
    try {
      await loadArticlesFromGoogleSheet({ forceRefresh });
      const fromSheet = listJournalSheetCategories();
      if (fromSheet.length > 0) return { categories: fromSheet };
    } catch {
      // fall through
    }
  }

  const fallback = { categories: listJournalFallbackCategories() };

  if (!isDatabaseConfigured()) return fallback;

  try {
    await syncJournalImportToDatabaseIfEmpty();
    const categories = await db
      .select()
      .from(blogCategoriesTable)
      .orderBy(blogCategoriesTable.name);

    if (categories.length === 0) return fallback;

    return {
      categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
    };
  } catch {
    return fallback;
  }
}

async function resolvePostList(opts: {
  category?: string;
  limit: number;
  offset: number;
  forceRefresh: boolean;
}) {
  const { category, limit, offset, forceRefresh } = opts;

  if (useSheetAsJournalSource()) {
    try {
      const fromSheet = await listJournalFromSheet({
        category,
        limit,
        offset,
        forceRefresh,
      });
      if (fromSheet && fromSheet.total > 0) return fromSheet;
    } catch {
      // fall through
    }
  }

  const fallback = listJournalFallback({ category, limit, offset });

  if (!isDatabaseConfigured()) return fallback;

  try {
    await syncJournalImportToDatabaseIfEmpty();

    const conditions = [eq(blogPostsTable.published, true)];
    if (category) conditions.push(eq(blogCategoriesTable.name, category));
    const where = and(...conditions);

    const [posts, countResult] = await Promise.all([
      db
        .select({
          post: blogPostsTable,
          categoryName: blogCategoriesTable.name,
        })
        .from(blogPostsTable)
        .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
        .where(where)
        .orderBy(desc(sql`coalesce(${blogPostsTable.publishedAt}, ${blogPostsTable.createdAt})`))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(blogPostsTable)
        .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
        .where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    if (total === 0) return fallback;

    return {
      posts: posts.map(({ post, categoryName }) => mapPost(post, categoryName)),
      total,
    };
  } catch {
    return fallback;
  }
}

async function resolvePostBySlug(slug: string, forceRefresh: boolean) {
  if (useSheetAsJournalSource()) {
    try {
      const fromSheet = await getJournalFromSheetBySlug(slug, { forceRefresh });
      if (fromSheet) return fromSheet;
    } catch {
      // fall through
    }
  }

  const fallback = getJournalFallbackBySlug(slug);

  if (!isDatabaseConfigured()) return fallback;

  try {
    await syncJournalImportToDatabaseIfEmpty();
    const [result] = await db
      .select({
        post: blogPostsTable,
        categoryName: blogCategoriesTable.name,
      })
      .from(blogPostsTable)
      .leftJoin(blogCategoriesTable, eq(blogPostsTable.categoryId, blogCategoriesTable.id))
      .where(eq(blogPostsTable.slug, slug));

    if (result) return mapPost(result.post, result.categoryName);
  } catch {
    // fall through
  }

  return fallback;
}

router.get("/blog/categories", async (req, res): Promise<void> => {
  try {
    const refresh = BlogRefreshQuery.safeParse(req.query);
    const forceRefresh =
      refresh.success &&
      (refresh.data.refreshSheet === "1" || refresh.data.refreshSheet === "true");

    res.json(await resolveCategories(forceRefresh));
  } catch {
    res.json({ categories: listJournalFallbackCategories() });
  }
});

router.get("/blog", async (req, res): Promise<void> => {
  try {
    const parsed = ListBlogPostsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { category, limit = 12, offset = 0 } = parsed.data;
    const refresh = BlogRefreshQuery.safeParse(req.query);
    const forceRefresh =
      refresh.success &&
      (refresh.data.refreshSheet === "1" || refresh.data.refreshSheet === "true");

    res.json(await resolvePostList({ category, limit, offset, forceRefresh }));
  } catch {
    const category =
      typeof req.query.category === "string" ? req.query.category : undefined;
    const limit = Number(req.query.limit) || 12;
    const offset = Number(req.query.offset) || 0;
    res.json(listJournalFallback({ category, limit, offset }));
  }
});

router.get("/blog/:slug", async (req, res): Promise<void> => {
  try {
    const params = GetBlogPostParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const refresh = BlogRefreshQuery.safeParse(req.query);
    const forceRefresh =
      refresh.success &&
      (refresh.data.refreshSheet === "1" || refresh.data.refreshSheet === "true");

    const post = await resolvePostBySlug(params.data.slug, forceRefresh);
    if (!post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(post);
  } catch {
    const slug = typeof req.params.slug === "string" ? req.params.slug : "";
    const fallback = getJournalFallbackBySlug(slug);
    if (!fallback) {
      res.status(404).json({ error: "Post not found" });
      return;
    }
    res.json(fallback);
  }
});

router.post("/blog", async (req, res): Promise<void> => {
  const parsed = CreateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db.insert(blogPostsTable).values({
    title: parsed.data.title,
    slug: parsed.data.slug,
    excerpt: parsed.data.excerpt,
    content: parsed.data.content,
    featuredImageUrl: parsed.data.featuredImageUrl ?? null,
    author: parsed.data.author,
    categoryId: parsed.data.categoryId ?? null,
    readingTime: parsed.data.readingTime,
    published: parsed.data.published,
    publishedAt: parsed.data.published ? new Date() : null,
  }).returning();

  res.status(201).json(mapPost(post, null));
});

router.put("/blog/:slug", async (req, res): Promise<void> => {
  const params = UpdateBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [post] = await db
    .update(blogPostsTable)
    .set({
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt,
      content: parsed.data.content,
      featuredImageUrl: parsed.data.featuredImageUrl ?? null,
      author: parsed.data.author,
      categoryId: parsed.data.categoryId ?? null,
      readingTime: parsed.data.readingTime,
      published: parsed.data.published,
    })
    .where(eq(blogPostsTable.slug, params.data.slug))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json(mapPost(post, null));
});

router.delete("/blog/:slug", async (req, res): Promise<void> => {
  const params = DeleteBlogPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [post] = await db
    .delete(blogPostsTable)
    .where(eq(blogPostsTable.slug, params.data.slug))
    .returning();

  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json({ success: true });
});

function mapPost(
  p: typeof blogPostsTable.$inferSelect,
  categoryName: string | null | undefined,
): JournalPostDto {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: rewriteJournalContentHtml(p.content),
    featuredImageUrl: resolveJournalFeaturedImageUrl(p.featuredImageUrl),
    author: p.author,
    categoryId: p.categoryId ?? null,
    categoryName: categoryName ?? null,
    readingTime: p.readingTime,
    published: p.published,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

export default router;
