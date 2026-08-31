import { Link } from "@tanstack/react-router";
import { BookOpenText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WORK_TYPES, type WrittenWorkType } from "@/features/writing/schema";

export interface PublicCreatorWrittenWorkCard {
  id: string;
  slug: string;
  title: string;
  work_type: string;
  excerpt: string;
  cover_url: string | null;
  project_title: string | null;
}

export function PublicCreatorWriting({
  works,
  creatorName,
  compactProfile = false,
}: {
  works: PublicCreatorWrittenWorkCard[];
  creatorName: string;
  compactProfile?: boolean;
}) {
  if (!works.length) return null;

  return (
    <section
      id="writing"
      className={
        compactProfile
          ? "mx-auto max-w-5xl scroll-mt-24 px-4 pb-10 sm:px-6"
          : "mx-auto max-w-7xl scroll-mt-28 px-4 pb-16 sm:px-6"
      }
    >
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
        Writing, poetry & stories
      </p>
      <h2 className="mt-2 text-3xl font-semibold">Writing from {creatorName}</h2>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Read the published work this creator has chosen to feature on their VYBE profile.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {works.map((work) => {
          const typeLabel =
            WORK_TYPES.find(([value]) => value === (work.work_type as WrittenWorkType))?.[1] ||
            "Written work";

          return (
            <article
              key={work.id}
              className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
            >
              {work.cover_url ? (
                <img
                  src={work.cover_url}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-primary/15 to-violet-500/10">
                  <BookOpenText className="h-12 w-12 text-primary/70" />
                </div>
              )}

              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-primary">
                  {typeLabel}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{work.title}</h3>
                {work.project_title ? (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    From {work.project_title}
                  </p>
                ) : null}
                {work.excerpt ? (
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {work.excerpt}
                  </p>
                ) : null}

                <Button asChild className="mt-5" variant="outline">
                  <Link to="/work/$slug" params={{ slug: work.slug }}>
                    Read work
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
