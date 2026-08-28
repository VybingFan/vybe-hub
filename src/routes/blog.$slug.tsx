import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpenText, Clock3, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlogArticleBody } from "@/components/blog/BlogArticleBody";
import { blogService, type BlogPost } from "@/services/blog/blogService";

export const Route = createFileRoute("/blog/$slug")({ component: BlogArticlePage });

function estimateReadingMinutes(body: string) {
  return Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 220));
}

function BlogArticlePage() {
  const { slug } = Route.useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogService.getPublishedBySlug(slug).then(setPost).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><p className="text-muted-foreground">Loading article...</p></main>;
  if (!post) return <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6"><BookOpenText className="mx-auto h-10 w-10 text-primary" /><h1 className="mt-4 text-3xl font-semibold">Article not found</h1><p className="mt-2 text-muted-foreground">This VYBE Blog article is unavailable or has not been published.</p><Button asChild className="mt-6"><Link to="/blog">Back to the Blog</Link></Button></main>;

  const minutes = estimateReadingMinutes(post.body);
  const share = async () => {
    const data = { title: post.title, text: post.excerpt ?? post.title, url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else await navigator.clipboard.writeText(window.location.href);
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
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14"><BlogArticleBody body={post.body} /></div>
      </article>
    </main>
  );
}
