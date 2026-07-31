#!/usr/bin/env node
/**
 * Fail hard if production journal is down or empty.
 * Usage: node scripts/assert-blog-live.mjs [baseUrl]
 */
const base = (process.argv[2] || process.env.BLOG_ASSERT_BASE_URL || "https://8degree.co").replace(
  /\/$/,
  "",
);

async function getJson(path) {
  const res = await fetch(`${base}${path}`, {
    headers: { accept: "application/json" },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { status: res.status, body, text: text.slice(0, 200) };
}

const blog = await getJson("/api/blog?limit=1");
const cats = await getJson("/api/blog/categories");

const errors = [];

if (blog.status !== 200) {
  errors.push(`/api/blog HTTP ${blog.status}: ${blog.text}`);
} else if (!blog.body || typeof blog.body.total !== "number" || blog.body.total < 1) {
  errors.push(`/api/blog returned empty journal (total=${blog.body?.total ?? "missing"})`);
} else if (!Array.isArray(blog.body.posts) || blog.body.posts.length < 1) {
  errors.push(`/api/blog returned no posts array`);
}

if (cats.status !== 200) {
  errors.push(`/api/blog/categories HTTP ${cats.status}: ${cats.text}`);
} else if (!Array.isArray(cats.body?.categories) || cats.body.categories.length < 1) {
  errors.push(`/api/blog/categories returned no categories`);
}

if (blog.status === 200 && blog.body?.posts?.[0]) {
  const img = blog.body.posts[0].featuredImageUrl ?? "";
  if (img.includes("/api/inventory/thumb/") || img.startsWith("/journal-media/")) {
    errors.push(
      `featuredImageUrl still broken (${img.slice(0, 80)}…) — deploy latest Matt branch`,
    );
  }
}

if (errors.length) {
  console.error(`FAIL: journal down or empty on ${base}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `OK: ${base} journal live — ${blog.body.total} posts, ${cats.body.categories.length} categories`,
);
