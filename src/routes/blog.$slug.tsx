import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpenText, Clock3, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";
import { blogService } from "@/services/blog/blogService";
import { toast } from "sonner";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await blogService.getPublishedBySlug(params.slug);
    if (!post) return { post: null, media: [] };
    const media = await blogService.listPublicMedia(post.id);
    return { post, media };
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) return {};
    const title = post.seo_title?.trim() || post.title;
    const description = post.seo_description?.trim() || post.excerpt?.trim() || "Read this story from the VYBE Blog.";
    const canonical = `https://vybewithvybe.com/blog/${post.slug}`;
    const image = post.hero_image_url?.trim() || "https://vybewithvybe.com/pwa/icon-512-v24-38.png";
    return {
      meta: [
        { title: `${title} | VYBE Blog` },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: canonical }],
    };
  },
  component: BlogArticlePage,
});

function estimateReadingMinutes(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 220));
}

function BlogArticlePage() {
  const { post, media } = Route.useLoaderData();

  if (!post) return <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6"><BookOpenText className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-3xl font-semibold">Article not found</h1><p className="mt-2 text-muted-foreground">This VYBE Blog article is unavailable or has not been published.</p><Button asChild className="mt-6"><Link to="/blog">Back to the Blog</Link></Button></main>;

  const minutes = estimateReadingMinutes(post.body);
  const share = async () => {
    const data = { title: post.title, text: post.excerpt ?? post.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Article link copied");
    } catch {
      toast.error("Could not share this article");
    }
  };

  return (
    <main>
      <article>
        <header className="mx-auto max-w-4xl px-4 pb-10 pt-12 sm:px-6 md:pt-16">
          <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-4 w-4" /> Back to VYBE Blog</Link>
          <div className="mt-8 flex flex-wrap gap-2">{post.category ? <Badge>{post.category}</Badge> : null}{post.tags?.slice(0, 3).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">{post.title}</h1>
          {post.excerpt ? <p className="mt-5 text-lg leading-8 text-muted-foreground md:text-xl">{post.excerpt}</p> : null}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y py-4 text-sm text-muted-foreground"><div>By <span className="font-medium text-foreground">{post.author_name}</span>{post.published_at ? ` · ${new Date(post.published_at).toLocaleDateString()}` : ""}<span className="ml-3 inline-flex items-center"><Clock3 className="mr-1 h-4 w-4" /> {minutes} min read</span></div><Button variant="ghost" size="sm" onClick={() => void share()}><Share2 className="mr-2 h-4 w-4" /> Share</Button></div>
        </header>
        {post.hero_image_url ? <div className="mx-auto max-w-6xl px-4 sm:px-6"><img src={post.hero_image_url} alt={post.hero_image_alt || post.title} className="max-h-[680px] w-full rounded-3xl object-cover" /></div> : null}
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14"><BlogArticleBody body={post.body} media={media} /></div>
      </article>
    </main>
  );
}
