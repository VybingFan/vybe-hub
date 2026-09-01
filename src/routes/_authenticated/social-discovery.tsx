import { FormEvent, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import {
  detectSocialPlatform,
  socialDiscoveryService,
  type SocialContentType,
  type SocialDiscoveryPost,
  type SocialDiscoverySummary,
  type SocialDiscoverySearchAnalytics,
} from "@/services/social/socialDiscoveryService";

export const Route = createFileRoute("/_authenticated/social-discovery")({ component: SocialDiscoveryPage });

const contentTypes: SocialContentType[] = ["post", "video", "reel", "short", "photo", "article", "live", "other"];

type Draft = {
  id?: string;
  original_url: string;
  title: string;
  description: string;
  keywords: string;
  content_type: SocialContentType;
  focus_code: string;
  related_vybe_url: string;
  original_published_at: string;
  is_active: boolean;
  discovery_order: string;
};

const blank: Draft = {
  original_url: "",
  title: "",
  description: "",
  keywords: "",
  content_type: "post",
  focus_code: "",
  related_vybe_url: "",
  original_published_at: "",
  is_active: false,
  discovery_order: "0",
};

function SocialDiscoveryPage() {
  const [summary, setSummary] = useState<SocialDiscoverySummary | null>(null);
  const [posts, setPosts] = useState<SocialDiscoveryPost[]>([]);
  const [analytics, setAnalytics] = useState<SocialDiscoverySearchAnalytics | null>(null);
  const [draft, setDraft] = useState<Draft>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [quickPrepared, setQuickPrepared] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectedPlatform = useMemo(() => {
    if (!draft.original_url.trim()) return null;
    try { return detectSocialPlatform(draft.original_url); } catch { return null; }
  }, [draft.original_url]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [nextSummary, nextPosts, nextAnalytics] = await Promise.all([
        socialDiscoveryService.getSummary(),
        socialDiscoveryService.listMine(),
        socialDiscoveryService.getSearchAnalytics(30),
      ]);
      setSummary(nextSummary);
      setPosts(nextPosts);
      setAnalytics(nextAnalytics);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Social Discovery could not load.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  async function prepareQuickAdd() {
    setPreparing(true);
    setMessage(null);
    setError(null);
    try {
      if (!draft.original_url.trim()) throw new Error("Paste a public social-post link first.");
      const platform = detectSocialPlatform(draft.original_url);
      const existing = await socialDiscoveryService.findMineByUrl(draft.original_url);
      if (existing) {
        throw new Error(`That ${existing.platform} post is already in your library as "${existing.title}".`);
      }
      setQuickPrepared(true);
      setMessage(`${platform === "other" ? "Social" : platform} post recognized. Add a title, optional topics, and choose whether to make it searchable now.`);
    } catch (reason) {
      setQuickPrepared(false);
      setError(reason instanceof Error ? reason.message : "That social-post link could not be prepared.");
    } finally {
      setPreparing(false);
    }
  }

  function edit(post: SocialDiscoveryPost) {
    setDraft({
      id: post.id,
      original_url: post.original_url,
      title: post.title,
      description: post.description || "",
      keywords: post.keywords.join(", "),
      content_type: post.content_type,
      focus_code: post.focus_code || "",
      related_vybe_url: post.related_vybe_url || "",
      original_published_at: post.original_published_at ? post.original_published_at.slice(0, 10) : "",
      is_active: post.is_active,
      discovery_order: String(post.discovery_order || 0),
    });
    setQuickPrepared(true);
    setShowAdvanced(true);
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraft() {
    setDraft(blank);
    setQuickPrepared(false);
    setShowAdvanced(false);
    setMessage(null);
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      if (!draft.title.trim()) throw new Error("Add a title for this social post.");
      const input = {
        original_url: draft.original_url,
        title: draft.title,
        description: draft.description,
        keywords: draft.keywords.split(","),
        content_type: draft.content_type,
        focus_code: draft.focus_code || null,
        related_vybe_url: draft.related_vybe_url || null,
        original_published_at: draft.original_published_at ? new Date(`${draft.original_published_at}T12:00:00Z`).toISOString() : null,
        is_active: draft.is_active,
        discovery_order: Number(draft.discovery_order || 0),
      };
      if (draft.id) await socialDiscoveryService.update(draft.id, input);
      else await socialDiscoveryService.create(input);
      const savedWasEdit = Boolean(draft.id);
      setDraft(blank);
      setQuickPrepared(false);
      setShowAdvanced(false);
      setMessage(savedWasEdit ? "Social post updated." : "Social post added to your library.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The social post could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(post: SocialDiscoveryPost) {
    setMessage(null); setError(null);
    try {
      await socialDiscoveryService.setActive(post.id, !post.is_active);
      setMessage(post.is_active ? "Post removed from active discovery." : "Post activated for discovery.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The post could not be updated.");
    }
  }

  async function remove(post: SocialDiscoveryPost) {
    if (!window.confirm(`Delete "${post.title}" from your Social Discovery library?`)) return;
    setMessage(null); setError(null);
    try {
      await socialDiscoveryService.remove(post.id);
      if (draft.id === post.id) resetDraft();
      setMessage("Social post deleted.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The post could not be deleted.");
    }
  }

  async function checkout(interval: "monthly" | "annual") {
    setMessage(null); setError(null);
    try {
      const url = await socialDiscoveryService.startCheckout(interval);
      window.location.assign(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout could not be started.");
    }
  }

  return <RoleGuard allow={["creator", "admin"]}>
    <div className="mx-auto max-w-6xl space-y-6">
      <WorkspacePageHeader eyebrow="Audience growth" title="Social Discovery" description="Register selected public social posts so VYBE can organize them for creator-controlled discovery. Your ordinary profile social links remain separate." />

      {loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : <>
        <section className="grid gap-4 md:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-base">Subscription</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <p className="font-medium">{summary?.entitled ? "Social Discovery access active" : "Social Discovery add-on"}</p>
            <p className="text-muted-foreground">$8/month or $80/year. Available to every creator membership.</p>
            {summary?.subscription?.cancel_at_period_end ? <p className="text-amber-600">Access remains available through the current paid period.</p> : null}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Active searchable posts</CardTitle></CardHeader><CardContent>
            <p className="text-3xl font-semibold">{summary?.active_post_count ?? 0} <span className="text-base text-muted-foreground">of {summary?.active_post_limit || 25}</span></p>
            <p className="mt-2 text-sm text-muted-foreground">Inactive library posts do not count toward the active limit.</p>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Billing</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">
            {!summary?.entitled ? <>
              <Button size="sm" onClick={() => void checkout("monthly")}>Monthly - $8</Button>
              <Button size="sm" variant="outline" onClick={() => void checkout("annual")}>Annual - $80</Button>
            </> : <p className="text-sm text-muted-foreground">{summary.subscription?.billing_provider === "stripe" ? "Stripe subscription connected." : "Testing access is active."}</p>}
          </CardContent></Card>
        </section>

        <Card>
          <CardHeader><CardTitle className="text-base">Social Discovery performance - last 30 days</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div><p className="text-2xl font-semibold">{analytics?.searches_appeared_in ?? 0}</p><p className="text-xs text-muted-foreground">Searches appeared in</p></div>
              <div><p className="text-2xl font-semibold">{analytics?.result_impressions ?? 0}</p><p className="text-xs text-muted-foreground">Result impressions</p></div>
              <div><p className="text-2xl font-semibold">{analytics?.outbound_clicks ?? 0}</p><p className="text-xs text-muted-foreground">Outbound visits</p></div>
              <div><p className="text-2xl font-semibold">{analytics?.unique_searchers ?? 0}</p><p className="text-xs text-muted-foreground">Unique VYBE searchers</p></div>
              <div><p className="text-2xl font-semibold">{Number(analytics?.outbound_rate ?? 0).toFixed(1)}%</p><p className="text-xs text-muted-foreground">Outbound rate</p></div>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">These numbers measure activity inside VYBE Social Discovery. They do not claim views, likes, or engagement on the external social platform.</p>
          </CardContent>
        </Card>

        {message ? <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">{message}</p> : null}
        {error ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : null}

        {summary?.entitled ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />{draft.id ? "Edit social post" : "Quick Add a social post"}</CardTitle></CardHeader><CardContent>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium">Paste your public post link</span>
              <Input value={draft.original_url} onChange={(event) => { setDraft({ ...draft, original_url: event.target.value }); if (!draft.id) setQuickPrepared(false); }} placeholder="Instagram, TikTok, YouTube, Facebook, X or Threads" required />
              <span className="text-xs text-muted-foreground">{detectedPlatform ? `${detectedPlatform} link detected` : "VYBE will recognize the social platform from the link."}</span>
            </label>

            {!draft.id && !quickPrepared ? <div className="md:col-span-2">
              <Button type="button" disabled={preparing} onClick={() => void prepareQuickAdd()}>{preparing ? "Checking..." : "Prepare post"}</Button>
              <p className="mt-2 text-xs text-muted-foreground">VYBE checks the platform and your library before asking for the remaining details.</p>
            </div> : <>
              <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Discovery title</span><Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} maxLength={160} placeholder="Give people a clear reason to open this post" required /></label>
              <label className="space-y-1"><span className="text-sm font-medium">Topics (optional)</span><Input value={draft.keywords} onChange={(event) => setDraft({ ...draft, keywords: event.target.value })} placeholder="new music, behind the scenes, poetry" /></label>
              <label className="space-y-1"><span className="text-sm font-medium">Content type</span><select value={draft.content_type} onChange={(event) => setDraft({ ...draft, content_type: event.target.value as SocialContentType })} className="h-10 w-full rounded-md border bg-background px-3 text-sm">{contentTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
              <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" checked={draft.is_active} onChange={(event) => setDraft({ ...draft, is_active: event.target.checked })} /><span className="text-sm">Add to active Social Discovery now</span></label>
              <div className="md:col-span-2"><Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? "Hide advanced details" : "Advanced details (optional)"}</Button></div>

              {showAdvanced ? <>
                <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Caption / description</span><textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm" maxLength={2000} /></label>
                <label className="space-y-1"><span className="text-sm font-medium">Creator focus</span><Input value={draft.focus_code} onChange={(event) => setDraft({ ...draft, focus_code: event.target.value })} placeholder="music, writing, film..." /></label>
                <label className="space-y-1"><span className="text-sm font-medium">Original post date</span><Input type="date" value={draft.original_published_at} onChange={(event) => setDraft({ ...draft, original_published_at: event.target.value })} /></label>
                <label className="space-y-1 md:col-span-2"><span className="text-sm font-medium">Related VYBE link</span><Input value={draft.related_vybe_url} onChange={(event) => setDraft({ ...draft, related_vybe_url: event.target.value })} placeholder="/work/... or https://vybewithvybe.com/..." /></label>
                <label className="space-y-1"><span className="text-sm font-medium">Discovery order</span><Input type="number" value={draft.discovery_order} onChange={(event) => setDraft({ ...draft, discovery_order: event.target.value })} /></label>
              </> : null}

              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : draft.id ? "Save changes" : "Add to Social Discovery"}</Button>
                <Button type="button" variant="outline" onClick={resetDraft}>{draft.id ? "Cancel edit" : "Start over"}</Button>
              </div>
            </>}
          </form>
        </CardContent></Card> : <Card><CardContent className="p-6"><p className="font-medium">Subscribe to begin your Social Discovery library.</p><p className="mt-2 text-sm text-muted-foreground">The add-on is separate from your creator membership and works across all of your creator focuses.</p></CardContent></Card>}

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Social post library</CardTitle></CardHeader><CardContent className="space-y-3">
          {!posts.length ? <p className="text-sm text-muted-foreground">No social posts have been added yet.</p> : null}
          {posts.map((post) => <div key={post.id} className="rounded-2xl border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full border px-2 py-0.5">{post.platform}</span><span>{post.content_type}</span><span>{post.is_active ? "Active in discovery" : "Library only"}</span></div><h3 className="mt-2 font-semibold">{post.title}</h3>{post.description ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.description}</p> : null}{post.keywords.length ? <p className="mt-2 text-xs text-muted-foreground">{post.keywords.join(" / ")}</p> : null}</div>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" asChild><a href={post.original_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Open</a></Button>{summary?.entitled ? <><Button size="sm" variant="outline" onClick={() => edit(post)}><Pencil className="mr-1 h-4 w-4" />Edit</Button><Button size="sm" variant="outline" onClick={() => void toggle(post)}>{post.is_active ? "Deactivate" : "Activate"}</Button><Button size="sm" variant="ghost" onClick={() => void remove(post)}><Trash2 className="mr-1 h-4 w-4" />Delete</Button></> : null}</div>
          </div></div>)}
        </CardContent></Card>
      </>}
    </div>
  </RoleGuard>;
}
