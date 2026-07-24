import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { BUILD_ON_VYBE_LINKS, MORE_LINKS, NAV_LINKS } from "@/constants/app";
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
  const appLabel =
    primaryRole === "admin"
      ? "Open Admin"
      : primaryRole === "creator"
        ? "Open Creator Studio"
        : "Open VYBE";

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" aria-label="VYBE home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.to}
              href={link.to}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === link.to && "text-foreground",
              )}
            >
              {link.label}
            </a>
          ))}

          <NavDropdown label="Build on VYBE" items={BUILD_ON_VYBE_LINKS} detailed />
          <NavDropdown label="More" items={MORE_LINKS} />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {!isLoading && user ? (
            <Button asChild className="bg-gradient-brand text-primary-foreground shadow-glow">
              <a href={defaultRoute}>{appLabel}</a>
            </Button>
          ) : !isLoading ? (
            <>
              <Button asChild variant="ghost">
                <Link to="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild className="bg-gradient-brand text-primary-foreground shadow-glow">
                <Link to="/auth/sign-up">Join VYBE</Link>
              </Button>
            </>
          ) : null}
        </div>

        <button
          className="rounded-full p-2 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="space-y-5 px-6 py-5">
            <MobileSection
              title="Explore VYBE"
              items={NAV_LINKS.map((item) => ({ label: item.label, to: item.to }))}
            />
            <MobileSection title="Build on VYBE" items={BUILD_ON_VYBE_LINKS} />
            <MobileSection title="More" items={MORE_LINKS} />

            {!isLoading && user ? (
              <Button asChild className="w-full bg-gradient-brand text-primary-foreground">
                <a href={defaultRoute}>{appLabel}</a>
              </Button>
            ) : !isLoading ? (
              <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-4">
                <Button asChild variant="outline">
                  <Link to="/auth/sign-in">Sign in</Link>
                </Button>
                <Button asChild className="bg-gradient-brand text-primary-foreground">
                  <Link to="/auth/sign-up">Join VYBE</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
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
            className="rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted"
          >
            {item.label}
          </a>
        ))}
      </div>
    </section>
  );
}
