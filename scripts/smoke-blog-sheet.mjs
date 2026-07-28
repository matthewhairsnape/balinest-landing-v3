process.env.JOURNAL_SOURCE = "sheet";
const mod = await import("../artifacts/api-server/dist/app.mjs");
const app = mod.default;
const server = app.listen(0);
const port = server.address().port;
const res = await fetch(`http://127.0.0.1:${port}/api/blog?limit=5`);
const text = await res.text();
console.log("status", res.status, "bytes", text.length);
try {
  const data = JSON.parse(text);
  console.log(
    JSON.stringify(
      {
        total: data.total,
        posts: (data.posts || []).slice(0, 3).map((p) => ({
          slug: p.slug,
          title: p.title,
          cat: p.categoryName,
        })),
      },
      null,
      2,
    ),
  );
} catch {
  console.log(text.slice(0, 400));
}
const res2 = await fetch(`http://127.0.0.1:${port}/api/blog/categories`);
console.log("categories", res2.status, (await res2.text()).slice(0, 300));
server.close();
