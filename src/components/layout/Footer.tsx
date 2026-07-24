import { APP_NAME, COMPANY } from "@/constants/app";
import { Logo } from "@/components/common/Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="horizontal" />
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            A creator-first entertainment community for discovering music, stories, films, and the
            people behind them.
          </p>
        </div>

        <FooterCol
          title="Explore"
          links={[
            ["Discover", "/explore"],
            ["Community", "/#community"],
            ["Merch", "/#merch"],
          ]}
        />
        <FooterCol
          title="Build on VYBE"
          links={[
            ["For Creators", "/for-artists"],
            ["Creator Memberships", "/creator-memberships"],
            ["For Businesses", "/for-businesses"],
            ["Creator sign in", "/auth/sign-in"],
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            ["About VYBE", "/about"],
            ["FAQ", "/faq"],
            ["Help Center", "/help"],
            ["Trust & Safety", "/trust"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["Terms", "/terms"],
            ["Privacy", "/privacy"],
            ["Copyright", "/copyright"],
            ["Community Guidelines", "/community-guidelines"],
          ]}
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
            <a href={to} className="transition-colors hover:text-foreground">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
