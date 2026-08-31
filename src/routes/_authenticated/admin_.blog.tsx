import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Newspaper, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { AdminBlogMediaManager } from "@/components/blog/AdminBlogMediaManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { blogService, type BlogPost, type BlogPostInput, type BlogStatus } from "@/services/blog/blogService";

export const Route = createFileRoute("/_authenticated/admin_/blog")({ component: AdminBlogPage });

const blank = (): BlogPostInput => ({ title: "", slug: "", excerpt: "", body: "", category: "", tags: [], author_name: "VYBE Editorial", hero_image_url: "", hero_image_alt: "", status: "draft", is_featured: false, published_at: null, seo_title: "", seo_description: "" });

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [form, setForm] = useState<BlogPostInput>(blank());
  const [saving, setSaving] = useState(false);

  const load = async () => { try { setPosts(await blogService.listAdmin()); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not load blog posts"); } };
  useEffect(() => { void load(); }, []);

  const edit = (post: BlogPost) => { setEditingId(post.id); setForm({ title: post.title, slug: post.slug, excerpt: post.excerpt ?? "", body: post.body, category: post.category ?? "", tags: post.tags ?? [], author_name: post.author_name, hero_image_url: post.hero_image_url ?? "", hero_image_alt: post.hero_image_alt ?? "", status: post.status, is_featured: post.is_featured, published_at: post.published_at, seo_title: post.seo_title ?? "", seo_description: post.seo_description ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const reset = () => { setEditingId(undefined); setForm(blank()); };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload: BlogPostInput = { ...form, title: form.title.trim(), slug: slugify(form.slug || form.title), excerpt: form.excerpt?.trim() || null, category: form.category?.trim() || null, tags: form.tags.map((tag) => tag.trim()).filter(Boolean), author_name: form.author_name.trim() || "VYBE Editorial", hero_image_url: form.hero_image_url?.trim() || null, hero_image_alt: form.hero_image_alt?.trim() || null, published_at: form.status === "published" ? (form.published_at || new Date().toISOString()) : null, seo_title: form.seo_title?.trim() || null, seo_description: form.seo_description?.trim() || null };
      await blogService.save(payload, editingId); toast.success(editingId ? "Blog post updated" : "Blog post created"); reset(); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save blog post"); } finally { setSaving(false); }
  };

  const remove = async (post: BlogPost) => { if (!window.confirm(`Delete \"${post.title}\"?`)) return; try { await blogService.remove(post.id); toast.success("Blog post deleted"); if (editingId === post.id) reset(); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete blog post"); } };

  return <RoleGuard allow={["admin"]}><div className="mx-auto max-w-7xl space-y-8">
    <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-primary"><Newspaper className="h-5 w-5" /> VYBE Editorial</div><h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Blog publishing</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Create, edit, preview, draft, feature, and publish official VYBE Blog articles. Article bodies support paragraphs plus ## headings, ### subheadings, &gt; pull quotes, - bullets, and numbered lists.</p></div><Button asChild variant="outline"><Link to="/blog">View public blog <ExternalLink className="ml-2 h-4 w-4" /></Link></Button></header>

    <Card><CardHeader><CardTitle>{editingId ? "Edit article" : "New article"}</CardTitle></CardHeader><CardContent><form onSubmit={save} className="grid gap-5 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2"><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: editingId ? f.slug : slugify(e.target.value) }))} /></div>
      <div className="space-y-2"><Label>Slug</Label><Input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} /></div>
      <div className="space-y-2"><Label>Category</Label><Input value={form.category ?? ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Creator Culture" /></div>
      <div className="space-y-2 md:col-span-2"><Label>Excerpt</Label><Textarea value={form.excerpt ?? ""} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} rows={3} /></div>
      <div className="space-y-2 md:col-span-2"><Label>Article body</Label><Textarea required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={18} className="font-mono text-sm" placeholder={"Opening paragraph...\n\n## Section heading\n\nMore article text...\n\n> Pull quote"} /></div>
      <div className="space-y-2"><Label>Author</Label><Input value={form.author_name} onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Tags (comma separated)</Label><Input value={form.tags.join(", ")} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value.split(",") }))} /></div>
      <div className="space-y-2"><Label>Hero image URL</Label><Input value={form.hero_image_url ?? ""} onChange={(e) => setForm((f) => ({ ...f, hero_image_url: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Hero image alt text</Label><Input value={form.hero_image_alt ?? ""} onChange={(e) => setForm((f) => ({ ...f, hero_image_alt: e.target.value }))} /></div>
      <div className="space-y-2"><Label>Status</Label><select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as BlogStatus }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select></div>
      <label className="flex items-center gap-3 self-end rounded-lg border p-3 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} /> Feature on Blog homepage</label>
      <div className="space-y-2"><Label>SEO title (optional)</Label><Input value={form.seo_title ?? ""} onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))} /></div>
      <div className="space-y-2"><Label>SEO description (optional)</Label><Input value={form.seo_description ?? ""} onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))} /></div>
      <div className="flex flex-wrap gap-2 md:col-span-2"><Button disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : editingId ? "Update article" : "Save article"}</Button>{editingId ? <Button type="button" variant="outline" onClick={reset}><Plus className="mr-2 h-4 w-4" />New article</Button> : null}</div>
    </form></CardContent></Card>

    {editingId ? <AdminBlogMediaManager postId={editingId} body={form.body} /> : (
      <Card><CardContent className="p-5 text-sm text-muted-foreground">Save the article first, then choose Edit to add inline article images and control where they appear.</CardContent></Card>
    )}

    <section><h2 className="text-2xl font-semibold">Articles</h2><div className="mt-4 grid gap-3">{posts.length === 0 ? <p className="text-sm text-muted-foreground">No blog posts yet.</p> : posts.map((post) => <Card key={post.id}><CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{post.title}</span><span className="rounded-full bg-muted px-2 py-1 text-xs">{post.status}</span>{post.is_featured ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">featured</span> : null}</div><p className="mt-1 text-xs text-muted-foreground">/{post.slug} · updated {new Date(post.updated_at).toLocaleString()}</p></div><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => edit(post)}>Edit</Button>{post.status === "published" ? <Button asChild type="button" variant="outline" size="sm"><Link to="/blog/$slug" params={{ slug: post.slug }}>View</Link></Button> : null}<Button type="button" variant="destructive" size="sm" onClick={() => void remove(post)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div></section>
  </div></RoleGuard>;
}
