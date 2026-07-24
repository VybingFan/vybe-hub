import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  User,
  Settings,
  ShieldCheck,
  Music2,
  ListMusic,
  ShoppingBag,
  BellRing,
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

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  allow: AppRole[];
}

const exploreItems: NavItem[] = [
  { title: "Home", url: "/home", icon: Home, allow: ["supporter", "creator", "admin"] },
  { title: "Discover", url: "/discover", icon: Compass, allow: ["supporter", "creator", "admin"] },
  { title: "Listen", url: "/listen", icon: Music2, allow: ["supporter", "creator", "admin"] },
  { title: "Watch", url: "/watch", icon: Clapperboard, allow: ["supporter", "creator", "admin"] },
  { title: "Read", url: "/read", icon: BookOpenText, allow: ["supporter", "creator", "admin"] },
  { title: "Play", url: "/play", icon: Gamepad2, allow: ["supporter", "creator", "admin"] },
  {
    title: "Communities",
    url: "/communities",
    icon: UsersRound,
    allow: ["supporter", "creator", "admin"],
  },
  { title: "Events", url: "/events", icon: CalendarDays, allow: ["supporter", "creator", "admin"] },
  { title: "My VYBE", url: "/my-vybe", icon: Heart, allow: ["supporter", "creator", "admin"] },
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
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");
  const visibleExplore = exploreItems.filter((item) => hasAnyRole(item.allow));
  const visibleCreator = creatorItems.filter((item) => hasAnyRole(item.allow));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/auth/redirect">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Explore VYBE" items={visibleExplore} isActive={isActive} />
        {visibleCreator.length > 0 && (
          <NavGroup label="Creator Studio" items={visibleCreator} isActive={isActive} />
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
        {hasAnyRole(["admin"]) && (
          <NavGroup
            label="Administration"
            items={[{ title: "Admin", url: "/admin", icon: ShieldCheck, allow: ["admin"] }]}
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
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
