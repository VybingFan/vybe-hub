import { supabase } from "@/integrations/supabase/client";

export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  category: string | null;
  tags: string[];
  author_name: string;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  status: BlogStatus;
  is_featured: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostInput = Omit<BlogPost, "id" | "created_at" | "updated_at">;

export type BlogPostMediaPlacement = "before_body" | "after_heading" | "end_body";
export type BlogPostMediaDisplayStyle = "standard" | "wide";

export type BlogPostMedia = {
  id: string;
  post_id: string;
  media_type: "image";
  media_url: string | null;
  storage_path: string | null;
  resolved_url: string;
  alt_text: string;
  caption: string | null;
  placement: BlogPostMediaPlacement;
  heading_text: string | null;
  display_style: BlogPostMediaDisplayStyle;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type BlogPostMediaInput = Omit<BlogPostMedia, "id" | "created_at" | "updated_at" | "resolved_url">;

const BLOG_MEDIA_BUCKET = "blog-media";
const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const BLOG_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const table = () => (supabase as any).from("blog_posts");
const mediaTable = () => (supabase as any).from("blog_post_media");

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function hydrateMedia(row: any): Promise<BlogPostMedia> {
  let resolvedUrl = row.media_url?.trim() || "";
  if (row.storage_path) {
    const { data, error } = await supabase.storage.from(BLOG_MEDIA_BUCKET).createSignedUrl(row.storage_path, 60 * 60);
    if (error) throw error;
    resolvedUrl = data?.signedUrl || "";
  }
  return { ...row, media_url: row.media_url ?? null, storage_path: row.storage_path ?? null, resolved_url: resolvedUrl } as BlogPostMedia;
}

async function hydrateMediaRows(rows: any[]): Promise<BlogPostMedia[]> {
  return Promise.all(rows.map((row) => hydrateMedia(row)));
}

export const blogService = {
  async listPublished(): Promise<BlogPost[]> {
    const { data, error } = await table()
      .select("*")
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  },

  async getPublishedBySlug(slug: string): Promise<BlogPost | null> {
    const { data, error } = await table()
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    return (data as BlogPost | null) ?? null;
  },

  async listAdmin(): Promise<BlogPost[]> {
    const { data, error } = await table().select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BlogPost[];
  },

  async save(input: BlogPostInput, id?: string): Promise<BlogPost> {
    const payload = { ...input, slug: input.slug.trim().toLowerCase() };
    const query = id ? table().update(payload).eq("id", id) : table().insert(payload);
    const { data, error } = await query.select("*").single();
    if (error) throw error;
    return data as BlogPost;
  },

  async remove(id: string): Promise<void> {
    const { error } = await table().delete().eq("id", id);
    if (error) throw error;
  },

  async listPublicMedia(postId: string): Promise<BlogPostMedia[]> {
    const { data, error } = await mediaTable()
      .select("*")
      .eq("post_id", postId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return hydrateMediaRows(data ?? []);
  },

  async listAdminMedia(postId: string): Promise<BlogPostMedia[]> {
    const { data, error } = await mediaTable()
      .select("*")
      .eq("post_id", postId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return hydrateMediaRows(data ?? []);
  },

  async uploadMediaFile(postId: string, file: File): Promise<string> {
    if (file.size > BLOG_IMAGE_MAX_BYTES) throw new Error("Blog images must be 5MB or smaller.");
    if (!BLOG_IMAGE_TYPES.includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
    const path = `${postId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(BLOG_MEDIA_BUCKET).upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return path;
  },

  async removeUploadedMedia(storagePath: string): Promise<void> {
    const { error } = await supabase.storage.from(BLOG_MEDIA_BUCKET).remove([storagePath]);
    if (error) throw error;
  },

  async saveMedia(input: BlogPostMediaInput, id?: string): Promise<BlogPostMedia> {
    const storagePath = input.storage_path?.trim() || null;
    const mediaUrl = storagePath ? null : input.media_url?.trim() || null;
    if (!storagePath && !mediaUrl) throw new Error("Upload an image or provide an image URL.");
    const payload = {
      ...input,
      media_url: mediaUrl,
      storage_path: storagePath,
      alt_text: input.alt_text.trim(),
      caption: input.caption?.trim() || null,
      heading_text: input.placement === "after_heading" ? input.heading_text?.trim() || null : null,
      sort_order: Math.max(0, Math.trunc(input.sort_order || 0)),
    };
    const query = id ? mediaTable().update(payload).eq("id", id) : mediaTable().insert(payload);
    const { data, error } = await query.select("*").single();
    if (error) throw error;
    return hydrateMedia(data);
  },

  async removeMedia(id: string): Promise<void> {
    const { error } = await mediaTable().delete().eq("id", id);
    if (error) throw error;
  },
};
