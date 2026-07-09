import { Link } from "@tanstack/react-router";
import { APP_NAME, COMPANY } from "@/constants/app";
import { Logo } from "@/components/common/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A modern creator platform for independent music artists.
          </p>
        </div>
        <FooterCol title="Platform" links={[["Discover", "/"], ["Pricing", "/#pricing"]]} />
        <FooterCol
          title="Company"
          links={[["About", "/#about"], ["Contact", "/#contact"]]}
        />
        <FooterCol
          title="Legal"
          links={[["Privacy", "/#privacy"], ["Terms", "/#terms"]]}
        />
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {COMPANY} · {APP_NAME}. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="transition-colors hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
