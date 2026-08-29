import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, Loader2, Search, ShoppingBag, Store, Sparkles } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MERCH_CATEGORIES, MERCH_AVAILABILITY } from "@/features/merch/schema";
import { publicMerchService, type PublicMerchItem } from "@/services/merch/publicMerchService";

export const Route = createFileRoute("/shop")({ component: PublicMarketplacePage });

const ALL = "All";

function formatPrice(item: PublicMerchItem) {
  if (item.price_cents == null) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: item.currency || "USD" }).format(item.price_cents / 100);
  } catch {
    return `$${(item.price_cents / 100).toFixed(2)}`;
  }
}

function availabilityLabel(value: string) {
  return MERCH_AVAILABILITY.find((item) => item.value === value)?.label ?? value;
}

function PublicMarketplacePage() {
  const [items, setItems] = useState<PublicMerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [category, setCategory] = useState(ALL);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    void publicMerchService.listActive().then((next) => {
      if (!active) return;
      setItems(next);
      setFailed(false);
    }).catch(() => {
      if (active) setFailed(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const categoryMatch = category === ALL || item.category === category;
      const textMatch = !q || item.title.toLowerCase().includes(q) || item.creator_name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      return categoryMatch && textMatch;
    });
  }, [items, category, query]);

  const availableCategories = useMemo(
    () => MERCH_CATEGORIES.filter((name) => items.some((item) => item.category === name)),
    [items],
  );

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />
      <main>
        <section className="border-b border-border/60 bg-gradient-hero">
          <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20">
            <Badge className="border-amber-700/30 bg-amber-100 text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-200">
              <ShoppingBag className="mr-2 h-3.5 w-3.5" /> VYBE Marketplace
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
              Support creators beyond the screen.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Shop creator merchandise available today. As VYBE commerce grows, Marketplace is built
              to make room for more ways creators can offer work, releases, collectibles, and experiences.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-16">
          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-primary/25 bg-primary/5 p-5">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <p className="mt-4 font-semibold">Creator Merch</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Available now from participating creators.</p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-5">
              <Sparkles className="h-6 w-6 text-primary" />
              <p className="mt-4 font-semibold">Music & Digital</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Marketplace-ready commerce will expand as creator sales tools are completed.</p>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-5">
              <Store className="h-6 w-6 text-primary" />
              <p className="mt-4 font-semibold">More Creator Offerings</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">The Marketplace name leaves room for art, collectibles, experiences, and other creator-led offerings.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Creator Merch · Available now</p>
              <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Shop what creators are sharing</h2>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search creator merch" className="h-11 rounded-full pl-10" />
            </div>
          </div>

          {availableCategories.length ? (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
              {[ALL, ...availableCategories].map((name) => (
                <button key={name} type="button" onClick={() => setCategory(name)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${category === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>
                  {name}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}

          {!loading && failed ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <Store className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-lg font-semibold">Marketplace items could not be loaded.</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
            </div>
          ) : null}

          {!loading && !failed && !items.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <Store className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-3 text-lg font-semibold">Creator products are coming in.</h3>
              <p className="mx-auto mt-1 max-w-lg text-sm leading-6 text-muted-foreground">Active creator merchandise will appear here as creators publish it.</p>
              <Button asChild variant="outline" className="mt-4 rounded-full"><Link to="/explore" search={{ q: "" }}>Discover creators</Link></Button>
            </div>
          ) : null}

          {!loading && !failed && items.length && !visible.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
              <p className="font-semibold">No creator merch matches this search.</p>
              <button type="button" className="mt-2 text-sm font-medium text-primary" onClick={() => { setCategory(ALL); setQuery(""); }}>Clear filters</button>
            </div>
          ) : null}

          {!loading && !failed && visible.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-4">
              {visible.map((item) => {
                const price = formatPrice(item);
                const canBuy = item.availability === "available_externally" && Boolean(item.purchase_url);
                return (
                  <article key={item.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:rounded-3xl">
                    <div className="aspect-square overflow-hidden border-b border-border/60 bg-muted">
                      {item.image_url ? <img src={item.image_url} alt={item.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" /> :
                        <div className="flex h-full items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-5">
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <Badge variant="outline" className="max-w-[7rem] truncate px-2 text-[9px] sm:max-w-none sm:text-xs">{item.category}</Badge>
                        {price ? <p className="shrink-0 text-sm font-semibold sm:text-base">{price}</p> : null}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-semibold sm:mt-3 sm:text-lg">{item.title}</h3>
                      {item.creator_username ? <a href={`/artist/${item.creator_username}`} className="mt-1 truncate text-xs font-medium text-primary sm:text-sm">{item.creator_name}</a> :
                        <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">{item.creator_name}</p>}
                      <p className="mt-2 line-clamp-2 flex-1 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">{item.description}</p>
                      <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:mt-3 sm:text-xs">{availabilityLabel(item.availability)}</p>
                      {canBuy ? <Button asChild size="sm" className="mt-3 w-full rounded-full bg-gradient-brand sm:mt-4"><a href={item.purchase_url ?? "#"} target="_blank" rel="noreferrer">Shop now <ExternalLink className="ml-2 h-3.5 w-3.5" /></a></Button> :
                        item.creator_username ? <Button asChild size="sm" variant="outline" className="mt-3 w-full rounded-full sm:mt-4"><a href={`/artist/${item.creator_username}`}>View creator <ArrowRight className="ml-2 h-3.5 w-3.5" /></a></Button> :
                        <Button size="sm" variant="outline" className="mt-3 w-full rounded-full sm:mt-4" disabled>{availabilityLabel(item.availability)}</Button>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
}
