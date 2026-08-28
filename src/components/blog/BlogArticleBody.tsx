type BlogArticleBodyProps = { body: string };

type Block = { type: "h2" | "h3" | "quote" | "ul" | "ol" | "p"; text?: string; items?: string[] };

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

export function BlogArticleBody({ body }: BlogArticleBodyProps) {
  const blocks = parseBody(body);
  return (
    <div className="space-y-6 text-[1.05rem] leading-8 text-foreground/90">
      {blocks.map((block, index) => {
        if (block.type === "h2") return <h2 key={index} className="pt-5 text-2xl font-semibold tracking-tight md:text-3xl">{block.text}</h2>;
        if (block.type === "h3") return <h3 key={index} className="pt-3 text-xl font-semibold tracking-tight md:text-2xl">{block.text}</h3>;
        if (block.type === "quote") return <blockquote key={index} className="border-l-4 border-primary pl-5 text-xl font-medium italic leading-8 text-foreground">{block.text}</blockquote>;
        if (block.type === "ul") return <ul key={index} className="list-disc space-y-2 pl-6">{block.items?.map((item) => <li key={item}>{item}</li>)}</ul>;
        if (block.type === "ol") return <ol key={index} className="list-decimal space-y-2 pl-6">{block.items?.map((item) => <li key={item}>{item}</li>)}</ol>;
        return <p key={index}>{block.text}</p>;
      })}
    </div>
  );
}
