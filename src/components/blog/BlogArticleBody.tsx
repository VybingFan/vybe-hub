import { Fragment } from "react";
import type { BlogPostMedia } from "@/services/blog/blogService";

type BlogArticleBodyProps = {
  body: string;
  media?: BlogPostMedia[];
};

type Block = { type: "h2" | "h3" | "quote" | "ul" | "ol" | "p"; text?: string; items?: string[] };

function normalizeHeading(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function parseBody(body: string): Block[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ").trim() });
    paragraph = [];
  };
  const flushList = () => {
    if (listType && listItems.length) blocks.push({ type: listType, items: listItems });
    listType = null;
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushParagraph(); flushList(); blocks.push({ type: "h2", text: line.slice(3).trim() }); continue;
    }
    if (line.startsWith("### ")) {
      flushParagraph(); flushList(); blocks.push({ type: "h3", text: line.slice(4).trim() }); continue;
    }
    if (line.startsWith("> ")) {
      flushParagraph(); flushList(); blocks.push({ type: "quote", text: line.slice(2).trim() }); continue;
    }
    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      if (listType && listType !== "ul") flushList();
      listType = "ul"; listItems.push(line.replace(/^[-*]\s+/, "")); continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      if (listType && listType !== "ol") flushList();
      listType = "ol"; listItems.push(line.replace(/^\d+\.\s+/, "")); continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

export function extractBlogHeadings(body: string): string[] {
  const seen = new Set<string>();
  return parseBody(body)
    .filter((block) => block.type === "h2" || block.type === "h3")
    .map((block) => block.text?.trim() ?? "")
    .filter((heading) => {
      const key = normalizeHeading(heading);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function InlineMediaFigure({ item }: { item: BlogPostMedia }) {
  return (
    <figure className={item.display_style === "wide" ? "my-6 md:-mx-12 md:my-8 lg:-mx-24" : "my-6 md:my-8"}>
      <img
        src={item.resolved_url || item.media_url || ""}
        alt={item.alt_text}
        loading="lazy"
        className="max-h-[720px] w-full rounded-2xl object-cover"
      />
      {item.caption ? <figcaption className="mt-3 text-sm leading-6 text-muted-foreground">{item.caption}</figcaption> : null}
    </figure>
  );
}

export function BlogArticleBody({ body, media = [] }: BlogArticleBodyProps) {
  const blocks = parseBody(body);
  const orderedMedia = [...media].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  const firstHeadingIndex = new Map<string, number>();

  blocks.forEach((block, index) => {
    if ((block.type === "h2" || block.type === "h3") && block.text) {
      const key = normalizeHeading(block.text);
      if (key && !firstHeadingIndex.has(key)) firstHeadingIndex.set(key, index);
    }
  });

  const beforeMedia = orderedMedia.filter((item) => item.placement === "before_body");
  const endMedia = orderedMedia.filter((item) => {
    if (item.placement === "end_body") return true;
    if (item.placement !== "after_heading") return false;
    return !firstHeadingIndex.has(normalizeHeading(item.heading_text));
  });

  return (
    <div className="space-y-4 text-[1.05rem] leading-8 text-foreground/90 md:space-y-5">
      {beforeMedia.map((item) => <InlineMediaFigure key={item.id} item={item} />)}
      {blocks.map((block, index) => {
        let content;
        if (block.type === "h2") content = <h2 className="pt-7 text-2xl font-semibold tracking-tight md:pt-8 md:text-3xl">{block.text}</h2>;
        else if (block.type === "h3") content = <h3 className="pt-5 text-xl font-semibold tracking-tight md:text-2xl">{block.text}</h3>;
        else if (block.type === "quote") content = <blockquote className="border-l-4 border-primary pl-5 text-xl font-medium italic leading-8 text-foreground">{block.text}</blockquote>;
        else if (block.type === "ul") content = <ul className="list-disc space-y-2 pl-6">{block.items?.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{item}</li>)}</ul>;
        else if (block.type === "ol") content = <ol className="list-decimal space-y-2 pl-6">{block.items?.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{item}</li>)}</ol>;
        else content = <p>{block.text}</p>;

        const afterMedia = (block.type === "h2" || block.type === "h3") && block.text
          ? orderedMedia.filter((item) =>
              item.placement === "after_heading"
              && firstHeadingIndex.get(normalizeHeading(item.heading_text)) === index
              && normalizeHeading(item.heading_text) === normalizeHeading(block.text),
            )
          : [];

        return (
          <Fragment key={index}>
            {content}
            {afterMedia.map((item) => <InlineMediaFigure key={item.id} item={item} />)}
          </Fragment>
        );
      })}
      {endMedia.map((item) => <InlineMediaFigure key={item.id} item={item} />)}
    </div>
  );
}
