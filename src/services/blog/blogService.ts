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

const table = () => (supabase as any).from("blog_posts");

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
};
