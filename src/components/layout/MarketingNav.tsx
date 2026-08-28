import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Menu, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import {
  COMMUNITY_LINKS,
  EXPERIENCE_LINKS,
  MORE_LINKS,
  NAV_LINKS,
} from "@/constants/app";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, primaryRole, defaultRoute, isLoading } = useUser();
  const professionalCta =
    primaryRole === "creator"
      ? { label: "Open Creator Studio", href: defaultRoute }
      : primaryRole === "business"
        ? { label: "Open Business Portal", href: defaultRoute }
        : null;
  const memberName = String(user?.user_metadata?.display_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "VYBE member");

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="VYBE home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary navigation">
          <PublicLink link={NAV_LINKS[0]} pathname={pathname} />
          <NavDropdown label="Explore" items={EXPERIENCE_LINKS.filter((item) => item.to !== "/discover/music")} />
          <NavDropdown label="Community" items={COMMUNITY_LINKS} />
          <PublicLink link={{ label: "Blog", to: "/blog" }} pathname={pathname} />
          <PublicLink link={NAV_LINKS[1]} pathname={pathname} />
          <NavDropdown label="More" items={[...MORE_LINKS, { label: "Build With VYBE", to: "/build-with-vybe" }]} />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {!isLoading && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-44 items-center gap-2 truncate rounded-full border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground xl:flex" title={user.email ?? memberName}>
                <UserRound className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">Signed in as {memberName}</span>
              </span>
              <Button asChild variant="outline">
                <Link to="/my-vybe">My VYBE</Link>
              </Button>
              {professionalCta ? (
                <Button asChild className="bg-gradient-brand text-primary-foreground shadow-glow">
                  <a href={professionalCta.href}>{professionalCta.label}</a>
                </Button>
              ) : null}
            </div>
          ) : !isLoading ? (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth/sign-in">Supporter Sign In</Link>
              </Button>
              <Button asChild className="bg-gradient-brand text-primary-foreground shadow-glow">
                <Link to="/auth/sign-up">Create Free Account</Link>
              </Button>
            </>
          ) : null}
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border/40 bg-background md:hidden">
          <div className="space-y-5 px-4 py-5 sm:px-6">
            <MobileSection
              title="Discover"
              items={NAV_LINKS.map((item) => ({ label: item.label, to: item.to }))}
            />
            <MobileSection title="Explore VYBE" items={EXPERIENCE_LINKS.filter((item) => item.to !== "/discover/music")} />
            <MobileSection title="Community" items={COMMUNITY_LINKS} />
            <MobileSection title="VYBE Editorial" items={[{ label: "Blog", to: "/blog" }]} />
            <MobileSection title="More" items={[...MORE_LINKS, { label: "Build With VYBE", to: "/build-with-vybe" }]} />
            <div className="border-t border-border/50 pt-4">
              <ThemeToggle showLabel />
            </div>

            {!isLoading && user ? (
              <div className="space-y-2 border-t border-border/50 pt-4">
                <p className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                  <UserRound className="h-4 w-4 text-primary" /> Signed in as {memberName}
                </p>
                <Button asChild variant="outline" className="w-full"><Link to="/my-vybe">My VYBE</Link></Button>
                {professionalCta ? (
                  <Button asChild className="w-full bg-gradient-brand text-primary-foreground">
                    <a href={professionalCta.href}>{professionalCta.label}</a>
                  </Button>
                ) : null}
              </div>
            ) : !isLoading ? (
              <div className="space-y-2 border-t border-border/50 pt-4">
                <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                  <Button asChild variant="outline">
                    <Link to="/auth/sign-in">Supporter Sign In</Link>
                  </Button>
                  <Button asChild className="bg-gradient-brand text-primary-foreground">
                    <Link to="/auth/sign-up">Create Free Account</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
}

function PublicLink({ link, pathname }: { link: { label: string; to: string }; pathname: string }) {
  return (
    <a
      href={link.to}
      className={cn(
        "text-sm text-muted-foreground transition-colors hover:text-foreground",
        pathname === link.to && "text-foreground",
      )}
    >
      {link.label}
    </a>
  );
}

function NavDropdown({
  label,
  items,
  detailed = false,
}: {
  label: string;
  items: ReadonlyArray<{ label: string; to: string; description?: string }>;
  detailed?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground data-[state=open]:text-foreground">
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className={detailed ? "w-80" : "w-56"}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.to} asChild className={detailed ? "items-start py-3" : ""}>
            <a href={item.to}>
              <div>
                <p className="font-medium">{item.label}</p>
                {detailed && item.description ? (
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileSection({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ label: string; to: string }>;
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </p>
      <div className="grid gap-1">
        {items.map((item) => (
          <a
            key={item.to}
            href={item.to}
            className="flex min-h-11 items-center rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            {item.label}
          </a>
        ))}
      </div>
    </section>
  );
}
