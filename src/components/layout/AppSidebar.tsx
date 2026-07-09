import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Compass, User, Settings, ShieldCheck, Music2 } from "lucide-react";
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

const items: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home, allow: ["creator", "admin"] },
  { title: "Music", url: "/music", icon: Music2, allow: ["creator", "admin"] },
  { title: "Discover", url: "/discover", icon: Compass, allow: ["supporter", "creator", "admin"] },
  { title: "Profile", url: "/profile", icon: User, allow: ["creator", "supporter", "admin"] },
  { title: "Admin", url: "/admin", icon: ShieldCheck, allow: ["admin"] },
  { title: "Settings", url: "/settings", icon: Settings, allow: ["creator", "supporter", "admin"] },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { hasAnyRole } = useUser();
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");
  const visible = items.filter((i) => hasAnyRole(i.allow));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/auth/redirect">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Studio</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
