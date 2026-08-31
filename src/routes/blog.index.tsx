import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { blogService, type BlogPost } from "@/services/blog/blogService";
import { useUser } from "@/hooks/useUser";

export const Route = createFileRoute("/blog/")({ component: BlogPage });

function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const { primaryRole } = useUser();

  useEffect(() => {
    blogService.listPublished().then(setPosts).catch((err) => setError(err instanceof Error ? err.message : "Could not load the VYBE Blog.")).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(posts.map((post) => post.category?.trim()).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b))], [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === "All" || post.category === category;
      const matchesQuery = !q || [post.title, post.excerpt ?? "", post.category ?? "", ...(post.tags ?? [])].join(" ").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [posts, query, category]);

  const featured = filtered.find((post) => post.is_featured) ?? filtered[0];
  const rest = featured ? filtered.filter((post) => post.id !== featured.id) : filtered;

  return (
    <main>
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 md:py-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary"><BookOpenText className="h-4 w-4" /> VYBE Editorial</div>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">The VYBE Blog</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">Stories, interviews, ideas, creator perspectives, culture, platform news, and practical insight from across the VYBE community.</p>
            </div>
            {primaryRole === "admin" ? <Button asChild variant="outline"><Link to="/admin/blog">Manage Blog</Link></Button> : null}
          </div>
          <div className="relative mt-8 max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the VYBE Blog" className="pl-10" /></div>
          {categories.length > 1 ? <div className="mt-5 flex flex-wrap gap-2" aria-label="Filter blog articles by category">{categories.map((item) => <Button key={item} type="button" size="sm" variant={category === item ? "default" : "outline"} onClick={() => setCategory(item)}>{item}</Button>)}</div> : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
        {loading ? <p className="text-sm text-muted-foreground">Loading VYBE stories...</p> : null}
        {error ? <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">The blog publishing table is not available yet. Apply the V24.70A migration, then refresh this page.</div> : null}
        {!loading && !error && !featured ? <div className="rounded-3xl border border-dashed p-10 text-center"><BookOpenText className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 text-2xl font-semibold">The newsroom is ready.</h2><p className="mx-auto mt-2 max-w-xl text-muted-foreground">No posts are published yet. Add your existing VYBE articles from Admin &gt; Blog, preview them, and publish when ready.</p></div> : null}

        {featured ? (
          <article className="grid overflow-hidden rounded-3xl border bg-card shadow-sm lg:grid-cols-[1.1fr_.9fr]">
            <div className="min-h-72 bg-muted">{featured.hero_image_url ? <img src={featured.hero_image_url} alt={featured.hero_image_alt || featured.title} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-72 items-center justify-center bg-gradient-to-br from-primary/20 to-muted"><BookOpenText className="h-16 w-16 text-primary/60" /></div>}</div>
            <div className="flex flex-col justify-center p-7 md:p-10">
              <div className="flex flex-wrap gap-2">{featured.category ? <Badge>{featured.category}</Badge> : null}{featured.is_featured ? <Badge variant="secondary">Featured</Badge> : null}</div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">{featured.title}</h2>
              {featured.excerpt ? <p className="mt-4 text-base leading-7 text-muted-foreground">{featured.excerpt}</p> : null}
              <p className="mt-5 text-sm text-muted-foreground">By {featured.author_name} {featured.published_at ? ` \u00b7 ${new Date(featured.published_at).toLocaleDateString()}` : ""}</p>
              <Button asChild className="mt-6 w-fit"><Link to="/blog/$slug" params={{ slug: featured.slug }}>Read article <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </article>
        ) : null}

        {rest.length ? <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{rest.map((post) => <article key={post.id} className="overflow-hidden rounded-2xl border bg-card"><div className="aspect-[16/9] bg-muted">{post.hero_image_url ? <img src={post.hero_image_url} alt={post.hero_image_alt || post.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><BookOpenText className="h-9 w-9 text-primary/50" /></div>}</div><div className="p-5">{post.category ? <Badge variant="secondary">{post.category}</Badge> : null}<h3 className="mt-3 text-xl font-semibold leading-7">{post.title}</h3>{post.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p> : null}<p className="mt-4 text-xs text-muted-foreground">{post.author_name}{post.published_at ? ` \u00b7 ${new Date(post.published_at).toLocaleDateString()}` : ""}</p><Link to="/blog/$slug" params={{ slug: post.slug }} className="mt-4 inline-flex items-center text-sm font-medium text-primary">Read article <ArrowRight className="ml-1 h-4 w-4" /></Link></div></article>)}</div> : null}
      </section>
    </main>
  );
}
