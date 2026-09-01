import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Loader2, Search, Share2, X } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import {
  socialDiscoverySearchService,
  type SocialDiscoverySearchPost,
} from "@/services/social/socialDiscoverySearchService";

export const Route = createFileRoute("/_authenticated/social-search")({
  component: SocialSearchPage,
});

const platforms = [
  { value: "all", label: "All platforms" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "x", label: "X" },
  { value: "threads", label: "Threads" },
] as const;

function SocialSearchPage() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [results, setResults] = useState<SocialDiscoverySearchPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const filteredResults = useMemo(
    () => results.filter((post) => platform === "all" || post.platform === platform),
    [platform, results],
  );

  useEffect(() => {
    if (!searched || loading) return;
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [loading, searched, query]);

  async function runSearch(value: string) {
    const nextQuery = value.trim();
    if (!nextQuery) {
      setQuery("");
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }

    setQuery(nextQuery);
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      setResults(await socialDiscoverySearchService.search(nextQuery));
    } catch (reason) {
      setResults([]);
      setError(reason instanceof Error ? reason.message : "Social Discovery search could not load.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void runSearch(input);
  }

  function clearSearch() {
    setInput("");
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(null);
    setPlatform("all");
  }

  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <div className="mx-auto max-w-6xl space-y-8">
        <WorkspacePageHeader
          eyebrow="Social Discovery"
          title="Search beyond VYBE."
          description="Find public social posts that creators have intentionally added to VYBE Social Discovery. Results link back to the original platform."
        />

        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="p-5 sm:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm leading-6 text-muted-foreground">
                Search creator-selected posts across supported social platforms without mixing them into VYBE creator and content discovery.
              </p>
              <form onSubmit={submit} className="relative mt-6">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Search social posts, topics, creators, or keywords"
                  className="h-14 rounded-full bg-background pl-12 pr-36 text-base"
                  aria-label="Search Social Discovery"
                />
                {input ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-[7.5rem] top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-1.5 top-1.5 h-11 rounded-full px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </form>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {platforms.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={platform === item.value ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setPlatform(item.value)}
                    disabled={!searched}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div ref={resultsRef} className="scroll-mt-6">
          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Searching Social Discovery…</p>
            </div>
          ) : null}

          {!loading && error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {!loading && !error && searched ? (
            <section>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Search results</p>
                  <h2 className="mt-1 text-2xl font-semibold">Results for “{query}”</h2>
                  {platform !== "all" ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Filtered to {platforms.find((item) => item.value === platform)?.label}.
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-muted-foreground">{filteredResults.length} found</span>
              </div>

              {filteredResults.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {filteredResults.map((post) => (
                    <article key={post.id} className="rounded-2xl border bg-card p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-11 w-11 shrink-0">
                          <AvatarImage src={post.creator_avatar_url ?? undefined} />
                          <AvatarFallback>
                            <Share2 className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                              {post.platform}
                            </span>
                            <span className="text-xs text-muted-foreground">{post.content_type}</span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold">{post.title}</h3>
                          {post.description ? (
                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.description}</p>
                          ) : null}
                          <p className="mt-3 text-xs text-muted-foreground">
                            Shared for discovery by {post.creator_artist_name || post.creator_display_name || post.creator_username}
                          </p>
                          {post.keywords?.length ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {post.keywords.slice(0, 6).map((keyword) => (
                                <span key={keyword} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="mt-5 flex flex-wrap gap-2">
                            <Button asChild size="sm">
                              <a
                                href={post.original_url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => void socialDiscoverySearchService.recordOutboundClick(post.search_event_id, post.id)}
                              >
                                View original post
                                <ExternalLink className="ml-2 h-3.5 w-3.5" />
                              </a>
                            </Button>
                            {post.related_vybe_url ? (
                              <Button asChild size="sm" variant="outline">
                                <a href={post.related_vybe_url}>Related VYBE</a>
                              </Button>
                            ) : null}
                            <Button asChild size="sm" variant="ghost">
                              <Link to="/artist/$username" params={{ username: post.creator_username }} search={{ track: "" }}>
                                Creator profile
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No active Social Discovery posts match this search and platform filter yet.
                </p>
              )}
            </section>
          ) : null}

          {!searched && !loading ? (
            <div className="rounded-3xl border border-dashed p-8 text-center sm:p-12">
              <Share2 className="mx-auto h-8 w-8 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">A separate search space for the social web</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Social Discovery searches only the public posts participating creators have chosen to index with VYBE. VYBE does not scrape or reproduce the social platform itself.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </RoleGuard>
  );
}
