import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/Logo";
import { NAV_LINKS } from "@/constants/app";
import { cn } from "@/lib/utils";

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.to}
              href={l.to}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === l.to && "text-foreground",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost">
            <Link to="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild className="bg-gradient-brand text-primary-foreground shadow-glow">
            <Link to="/auth/sign-up">Get started</Link>
          </Button>
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border/40 bg-background md:hidden">
          <div className="flex flex-col gap-2 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <a key={l.to} href={l.to} className="py-1 text-sm">
                {l.label}
              </a>
            ))}
            <Button asChild variant="outline" className="mt-2">
              <Link to="/auth/sign-in">Sign in</Link>
            </Button>
            <Button asChild className="bg-gradient-brand text-primary-foreground">
              <Link to="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
