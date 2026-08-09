import { Link, useRouterState } from "@tanstack/react-router";
import {
  Compass,
  Heart,
  Home,
  LayoutDashboard,
  Menu,
  UserRound,
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function MobilePrimaryNav() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { hasAnyRole } = useUser();
  const { setOpenMobile } = useSidebar();
  const creator = hasAnyRole(["creator"]);
  const admin = hasAnyRole(["admin"]);
  const business = hasAnyRole(["business"]);

  const items = admin
    ? [
        { title: "Overview", url: "/admin", icon: LayoutDashboard },
        { title: "Queue", url: "/admin/work-queue", icon: Compass },
        { title: "Accounts", url: "/admin/accounts", icon: UserRound },
      ]
    : creator
      ? [
          { title: "Studio", url: "/dashboard", icon: LayoutDashboard },
          { title: "Discover", url: "/discover", icon: Compass },
          { title: "My VYBE", url: "/my-vybe", icon: Heart },
          { title: "Profile", url: "/profile", icon: UserRound },
        ]
      : business
        ? [
            { title: "Home", url: "/home", icon: Home },
            { title: "Business", url: "/business", icon: LayoutDashboard },
            { title: "Discover", url: "/discover", icon: Compass },
          ]
        : [
            { title: "Home", url: "/home", icon: Home },
            { title: "Discover", url: "/discover", icon: Compass },
            { title: "My VYBE", url: "/my-vybe", icon: Heart },
            { title: "Profile", url: "/profile", icon: UserRound },
          ];

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const active =
            pathname === item.url || pathname.startsWith(item.url + "/");
          return (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex min-w-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
                active && "text-primary",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="flex min-w-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
          aria-label="Open all navigation"
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
