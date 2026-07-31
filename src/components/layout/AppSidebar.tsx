import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Home,
  Compass,
  User,
  Settings,
  ShieldCheck,
  Music2,
  ListMusic,
  ShoppingBag,
  BellRing,
  BriefcaseBusiness,
  ContactRound,
  BookOpenText,
  CalendarDays,
  Clapperboard,
  Gamepad2,
  Heart,
  LayoutDashboard,
  LibraryBig,
  UsersRound,
  Upload,
  ClipboardList,
  ExternalLink,
  CreditCard,
  Gift,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/common/Logo";
import { useUser } from "@/hooks/useUser";
import type { AppRole } from "@/features/auth/roles";
import { adminNotificationService } from "@/services/admin/adminNotificationService";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  allow: AppRole[];
  badge?: number;
}

const exploreItems: NavItem[] = [
  { title: "Home", url: "/home", icon: Home, allow: ["supporter", "creator", "business", "admin"] },
  {
    title: "Discover",
    url: "/discover",
    icon: Compass,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Listen",
    url: "/listen",
    icon: Music2,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Watch",
    url: "/watch",
    icon: Clapperboard,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Read",
    url: "/read",
    icon: BookOpenText,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Play",
    url: "/play",
    icon: Gamepad2,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Communities",
    url: "/communities",
    icon: UsersRound,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Events",
    url: "/events",
    icon: CalendarDays,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "My VYBE",
    url: "/my-vybe",
    icon: Heart,
    allow: ["supporter", "creator", "business", "admin"],
  },
];

const creatorItems: NavItem[] = [
  {
    title: "Studio Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    allow: ["creator", "admin"],
  },
  { title: "Content", url: "/content", icon: LibraryBig, allow: ["creator", "admin"] },
  { title: "Music Library", url: "/music", icon: Music2, allow: ["creator", "admin"] },
  { title: "Upload Music", url: "/music/upload", icon: Upload, allow: ["creator", "admin"] },
  { title: "Video Library", url: "/videos", icon: Clapperboard, allow: ["creator", "admin"] },
  { title: "Playlists", url: "/playlists", icon: ListMusic, allow: ["creator", "admin"] },
  { title: "Activity", url: "/activity", icon: BellRing, allow: ["creator", "admin"] },
  { title: "Connections", url: "/connections", icon: ContactRound, allow: ["creator", "admin"] },
  { title: "Merch", url: "/merch", icon: ShoppingBag, allow: ["creator", "admin"] },
  { title: "Public Profile", url: "/profile", icon: User, allow: ["creator", "admin"] },
  { title: "Creator Settings", url: "/settings", icon: Settings, allow: ["creator", "admin"] },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { hasAnyRole } = useUser();
  const isAdmin = hasAnyRole(["admin"]);
  const [pendingWork, setPendingWork] = useState(0);
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");
  const visibleExplore = exploreItems.filter((item) => hasAnyRole(item.allow));
  const visibleCreator = creatorItems.filter((item) => hasAnyRole(item.allow));

  useEffect(() => {
    if (!isAdmin) return;
    void adminNotificationService
      .summary()
      .then((summary) => setPendingWork(summary.unread))
      .catch(() => undefined);
  }, [isAdmin, pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/auth/redirect">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <>
            <NavGroup
              label="Back Office"
              items={[
                {
                  title: "Operations Overview",
                  url: "/admin",
                  icon: LayoutDashboard,
                  allow: ["admin"],
                },
                {
                  title: "Work Queue",
                  url: "/admin/work-queue",
                  icon: ClipboardList,
                  allow: ["admin"],
                  badge: pendingWork,
                },
                {
                  title: "Members & Accounts",
                  url: "/admin/accounts",
                  icon: ContactRound,
                  allow: ["admin"],
                },
                {
                  title: "Business Operations",
                  url: "/admin/businesses",
                  icon: BriefcaseBusiness,
                  allow: ["admin"],
                },
                {
                  title: "Creator Operations",
                  url: "/admin/creators",
                  icon: UsersRound,
                  allow: ["admin"],
                },
                {
                  title: "Rights & Moderation",
                  url: "/admin/rights",
                  icon: ShieldCheck,
                  allow: ["admin"],
                },
                { title: "Play Operations", url: "/admin/play", icon: Gamepad2, allow: ["admin"] },
              ]}
              isActive={isActive}
            />
            <NavGroup
              label="Management"
              items={[
                {
                  title: "Memberships & Packages",
                  url: "/admin/memberships",
                  icon: CreditCard,
                  allow: ["admin"],
                },
                {
                  title: "Offers & Promotions",
                  url: "/admin/offers",
                  icon: Gift,
                  allow: ["admin"],
                },
                { title: "Analytics & Reports", url: "/admin", icon: BarChart3, allow: ["admin"] },
                {
                  title: "System Health",
                  url: "/admin/system-health",
                  icon: Activity,
                  allow: ["admin"],
                },
                { title: "System Settings", url: "/settings", icon: Settings, allow: ["admin"] },
              ]}
              isActive={isActive}
            />
            <NavGroup
              label="View VYBE"
              items={[
                { title: "Explore VYBE", url: "/home", icon: ExternalLink, allow: ["admin"] },
                { title: "Creator Studio", url: "/dashboard", icon: Music2, allow: ["admin"] },
                {
                  title: "Business Studio",
                  url: "/business",
                  icon: BriefcaseBusiness,
                  allow: ["admin"],
                },
              ]}
              isActive={isActive}
            />
          </>
        ) : (
          <NavGroup label="Explore VYBE" items={visibleExplore} isActive={isActive} />
        )}
        {!isAdmin && visibleCreator.length > 0 && (
          <NavGroup label="Creator Studio" items={visibleCreator} isActive={isActive} />
        )}
        {!isAdmin && hasAnyRole(["business"]) && (
          <NavGroup
            label="Business Studio"
            items={[
              {
                title: "Business Dashboard",
                url: "/business",
                icon: BriefcaseBusiness,
                allow: ["business", "admin"],
              },
            ]}
            isActive={isActive}
          />
        )}
        {hasAnyRole(["supporter"]) && !hasAnyRole(["creator", "admin"]) && (
          <NavGroup
            label="Account"
            items={[
              { title: "Profile", url: "/profile", icon: User, allow: ["supporter"] },
              { title: "Settings", url: "/settings", icon: Settings, allow: ["supporter"] },
            ]}
            isActive={isActive}
          />
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  isActive,
}: {
  label: string;
  items: NavItem[];
  isActive: (url: string) => boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                  {item.badge ? (
                    <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
