import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ImagePlus, Link2, Pencil, Save, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { extractBlogHeadings } from "@/components/blog/BlogArticleBody";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  blogService,
  type BlogPostMedia,
  type BlogPostMediaDisplayStyle,
  type BlogPostMediaInput,
  type BlogPostMediaPlacement,
} from "@/services/blog/blogService";

type AdminBlogMediaManagerProps = {
  postId: string;
  body: string;
};

type MediaSourceMode = "upload" | "url";

const blankMedia = (postId: string): BlogPostMediaInput => ({
  post_id: postId,
  media_type: "image",
  media_url: null,
  storage_path: null,
  alt_text: "",
  caption: null,
  placement: "before_body",
  heading_text: null,
  display_style: "standard",
  sort_order: 0,
});

export function AdminBlogMediaManager({ postId, body }: AdminBlogMediaManagerProps) {
  const [items, setItems] = useState<BlogPostMedia[]>([]);
  const [form, setForm] = useState<BlogPostMediaInput>(() => blankMedia(postId));
  const [editingId, setEditingId] = useState<string | undefined>();
  const [sourceMode, setSourceMode] = useState<MediaSourceMode>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingPreview, setEditingPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const headings = useMemo(() => extractBlogHeadings(body), [body]);
  const localPreview = useMemo(() => selectedFile ? URL.createObjectURL(selectedFile) : null, [selectedFile]);

  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  const load = async () => {
    try {
      setItems(await blogService.listAdminMedia(postId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load article media");
    }
  };

  useEffect(() => {
    setEditingId(undefined);
    setSourceMode("upload");
    setSelectedFile(null);
    setEditingPreview(null);
    setForm(blankMedia(postId));
    void load();
  }, [postId]);

  const reset = () => {
    setEditingId(undefined);
    setSourceMode("upload");
    setSelectedFile(null);
    setEditingPreview(null);
    setForm(blankMedia(postId));
  };

  const edit = (item: BlogPostMedia) => {
    setEditingId(item.id);
    setSourceMode(item.storage_path ? "upload" : "url");
    setSelectedFile(null);
    setEditingPreview(item.resolved_url || item.media_url || null);
    setForm({
      post_id: item.post_id,
      media_type: item.media_type,
      media_url: item.media_url,
      storage_path: item.storage_path,
      alt_text: item.alt_text,
      caption: item.caption,
      placement: item.placement,
      heading_text: item.heading_text,
      display_style: item.display_style,
      sort_order: item.sort_order,
    });
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const altText = form.alt_text.trim();
    const headingText = form.placement === "after_heading" ? form.heading_text?.trim() || null : null;
    const externalUrl = form.media_url?.trim() || null;

    if (!altText) {
      toast.error("Alt text is required");
      return;
    }
    if (form.placement === "after_heading" && !headingText) {
      toast.error("Choose a section heading for this image");
      return;
    }
    if (sourceMode === "upload" && !selectedFile && !form.storage_path) {
      toast.error("Choose an image to upload");
      return;
    }
    if (sourceMode === "url" && !externalUrl) {
      toast.error("Enter an image URL");
      return;
    }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      let storagePath = sourceMode === "upload" ? form.storage_path : null;
      let mediaUrl = sourceMode === "url" ? externalUrl : null;

      if (sourceMode === "upload" && selectedFile) {
        uploadedPath = await blogService.uploadMediaFile(postId, selectedFile);
        storagePath = uploadedPath;
        mediaUrl = null;
      }

      await blogService.saveMedia(
        {
          ...form,
          post_id: postId,
          media_url: mediaUrl,
          storage_path: storagePath,
          alt_text: altText,
          caption: form.caption?.trim() || null,
          heading_text: headingText,
          sort_order: Number.isFinite(form.sort_order) ? Math.max(0, Math.trunc(form.sort_order)) : 0,
        },
        editingId,
      );
      toast.success(editingId ? "Article image updated" : "Article image added");
      reset();
      await load();
    } catch (error) {
      if (uploadedPath) {
        try { await blogService.removeUploadedMedia(uploadedPath); } catch { /* preserve primary error */ }
      }
      toast.error(error instanceof Error ? error.message : "Could not save article image");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: BlogPostMedia) => {
    if (!window.confirm("Remove this image from the article? The stored upload will remain available for future media-library cleanup.")) return;
    try {
      await blogService.removeMedia(item.id);
      if (editingId === item.id) reset();
      toast.success("Article image removed");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove article image");
    }
  };

  const previewUrl = localPreview || (sourceMode === "url" ? form.media_url?.trim() || null : editingPreview);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /> Article media</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Upload official Blog images privately while an article is in draft. Published articles receive temporary signed access to uploaded images. External image URLs remain available as a secondary option.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="button" variant={sourceMode === "upload" ? "default" : "outline"} onClick={() => setSourceMode("upload")}><Upload className="mr-2 h-4 w-4" /> Upload image</Button>
            <Button type="button" variant={sourceMode === "url" ? "default" : "outline"} onClick={() => setSourceMode("url")}><Link2 className="mr-2 h-4 w-4" /> Use image URL</Button>
          </div>

          {sourceMode === "upload" ? (
            <div className="space-y-2 md:col-span-2">
              <Label>Image upload</Label>
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Maximum 5MB. Draft uploads stay in the private Blog media bucket.</p>
              {editingId && form.storage_path && !selectedFile ? <p className="text-xs text-muted-foreground">Current uploaded image will be kept unless you choose a replacement.</p> : null}
            </div>
          ) : (
            <div className="space-y-2 md:col-span-2"><Label>Image URL</Label><Input value={form.media_url ?? ""} onChange={(event) => setForm((current) => ({ ...current, media_url: event.target.value }))} placeholder="https://..." /></div>
          )}

          {previewUrl ? <div className="md:col-span-2"><img src={previewUrl} alt="Selected article media preview" className="max-h-64 w-full rounded-xl border object-contain" /></div> : null}

          <div className="space-y-2 md:col-span-2"><Label>Alt text</Label><Input required value={form.alt_text} onChange={(event) => setForm((current) => ({ ...current, alt_text: event.target.value }))} placeholder="Describe the image for accessibility" /></div>
          <div className="space-y-2 md:col-span-2"><Label>Caption (optional)</Label><Textarea rows={2} value={form.caption ?? ""} onChange={(event) => setForm((current) => ({ ...current, caption: event.target.value }))} /></div>
          <div className="space-y-2">
            <Label>Placement</Label>
            <select value={form.placement} onChange={(event) => {
              const placement = event.target.value as BlogPostMediaPlacement;
              setForm((current) => ({ ...current, placement, heading_text: placement === "after_heading" ? current.heading_text ?? headings[0] ?? null : null }));
            }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="before_body">Before article body</option>
              <option value="after_heading" disabled={headings.length === 0}>After section heading</option>
              <option value="end_body">End of article</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Display width</Label>
            <select value={form.display_style} onChange={(event) => setForm((current) => ({ ...current, display_style: event.target.value as BlogPostMediaDisplayStyle }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="standard">Standard</option>
              <option value="wide">Wide</option>
            </select>
          </div>
          {form.placement === "after_heading" ? (
            <div className="space-y-2 md:col-span-2">
              <Label>Section heading</Label>
              {headings.length ? (
                <select required value={form.heading_text ?? ""} onChange={(event) => setForm((current) => ({ ...current, heading_text: event.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Choose a heading</option>
                  {headings.map((heading) => <option key={heading} value={heading}>{heading}</option>)}
                </select>
              ) : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Add a ## or ### heading to the article body before using heading placement.</p>}
            </div>
          ) : null}
          <div className="space-y-2"><Label>Order</Label><Input type="number" min={0} step={1} value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) || 0 }))} /></div>
          <div className="flex flex-wrap items-end gap-2">
            <Button disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : editingId ? "Update image" : "Add image"}</Button>
            {editingId ? <Button type="button" variant="outline" onClick={reset}><X className="mr-2 h-4 w-4" /> Cancel edit</Button> : null}
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="font-semibold">Images in this article</h3>
          {items.length === 0 ? <p className="text-sm text-muted-foreground">No inline article images yet.</p> : items.map((item) => (
            <div key={item.id} className="flex flex-col gap-4 rounded-xl border p-4 md:flex-row md:items-center">
              <img src={item.resolved_url || item.media_url || ""} alt="" className="h-24 w-full rounded-lg object-cover md:w-36" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.alt_text}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.storage_path ? "Private upload" : "External URL"}{" · "}{item.placement === "after_heading" ? `After: ${item.heading_text}` : item.placement === "before_body" ? "Before article body" : "End of article"}{" · "}{item.display_style}{" · order "}{item.sort_order}</p>
                {item.caption ? <p className="mt-2 text-sm text-muted-foreground">{item.caption}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => edit(item)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
                <Button type="button" size="sm" variant="destructive" onClick={() => void remove(item)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
