import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  BellRing,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  Clapperboard,
  ClipboardList,
  Compass,
  ContactRound,
  CreditCard,
  ExternalLink,
  FolderKanban,
  Gamepad2,
  Gift,
  Heart,
  Home,
  LayoutDashboard,
  LibraryBig,
  ListMusic,
  Music2,
  Settings,
  ShieldCheck,
  ShoppingBag,
  User,
  UsersRound,
  Workflow,
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
import {
  adminTeamService,
  type AdminAccess,
} from "@/services/admin/adminTeamService";

interface NavItem {
  title: string;
  url: string;
  icon: typeof Home;
  allow: AppRole[];
  badge?: number;
  permissionAnyOf?: string[];
}

const memberPrimary: NavItem[] = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Discover",
    url: "/discover",
    icon: Compass,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "Listen",
    url: "/experience/listen",
    icon: Music2,
    allow: ["supporter", "creator", "business", "admin"],
  },
  {
    title: "My VYBE",
    url: "/my-vybe",
    icon: Heart,
    allow: ["supporter", "creator", "business", "admin"],
  },
];

const memberMore: NavItem[] = [
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
];

const creatorStudio: NavItem[] = [
  {
    title: "Creator Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    allow: ["creator", "admin"],
  },
  {
    title: "Create & Manage",
    url: "/content",
    icon: LibraryBig,
    allow: ["creator", "admin"],
  },
  {
    title: "Music Library",
    url: "/music",
    icon: Music2,
    allow: ["creator", "admin"],
  },
  {
    title: "Playlists",
    url: "/playlists",
    icon: ListMusic,
    allow: ["creator", "admin"],
  },  {
    title: "Upload Music",
    url: "/music/upload",
    icon: Music2,
    allow: ["creator", "admin"],
  },
  {
    title: "Video Library",
    url: "/videos",
    icon: Clapperboard,
    allow: ["creator", "admin"],
  },
];

const creatorAudience: NavItem[] = [
  {
    title: "Activity",
    url: "/activity",
    icon: BellRing,
    allow: ["creator", "admin"],
  },
  {
    title: "Analytics",
    url: "/creator-analytics",
    icon: BarChart3,
    allow: ["creator", "admin"],
  },
  {
    title: "Connections",
    url: "/connections",
    icon: ContactRound,
    allow: ["creator", "admin"],
  },
];

const creatorGrowth: NavItem[] = [
  {
    title: "Public Profile & Discovery",
    url: "/profile",
    icon: User,
    allow: ["creator", "admin"],
  },
  {
    title: "Merchandise",
    url: "/merch",
    icon: ShoppingBag,
    allow: ["creator", "admin"],
  },  {
    title: "Music Sales",
    url: "/commerce",
    icon: CreditCard,
    allow: ["creator", "admin"],
  },  {
    title: "Rights Review",
    url: "/admin/commerce-rights",
    icon: CreditCard,
    allow: ["admin"],
  },  {
    title: "Copyright Center",
    url: "/creator-compliance",
    icon: CreditCard,
    allow: ["creator", "admin"],
  },
{
    title: "Industry Kit & EPK",
    url: "/epk",
    icon: BriefcaseBusiness,
    allow: ["creator", "admin"],
  },
  {
    title: "Creator Settings",
    url: "/settings",
    icon: Settings,
    allow: ["creator", "admin"],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const { hasAnyRole } = useUser();
  const isAdmin = hasAnyRole(["admin"]);
  const [pendingWork, setPendingWork] = useState(0);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const isActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");
  const visible = (items: NavItem[]) =>
    items.filter((item) => hasAnyRole(item.allow));

  useEffect(() => {
    if (!isAdmin) {
      setAdminAccess(null);
      return;
    }
    void adminTeamService
      .getMyAccess()
      .then(setAdminAccess)
      .catch(() => setAdminAccess(null));
  }, [isAdmin, pathname]);

  useEffect(() => {
    if (!isAdmin || !adminAccess?.permissions.includes("admin.work_queue.read"))
      return;
    void adminNotificationService
      .summary()
      .then((summary) => setPendingWork(summary.unread))
      .catch(() => undefined);
  }, [isAdmin, pathname, adminAccess]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/auth/redirect">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent className="pb-5">
        {isAdmin ? (
          <>
            <NavGroup
              label="Operations"
              items={[
                {
                  title: "Overview",
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
                  permissionAnyOf: ["admin.work_queue.read"],
                },
                {
                  title: "Accounts",
                  url: "/admin/accounts",
                  icon: ContactRound,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.accounts.read"],
                },
                {
                  title: "Creators",
                  url: "/admin/creators",
                  icon: UsersRound,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.creator.read"],
                },
                {
                  title: "Rights & Content",
                  url: "/admin/rights",
                  icon: ShieldCheck,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.rights.read", "admin.content.read"],
                },
                {
                  title: "Music Rights Review",
                  url: "/admin/commerce-rights",
                  icon: ShieldCheck,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.rights.read", "admin.content.read"],
                },
                {
                  title: "Copyright & DMCA",
                  url: "/admin/copyright",
                  icon: ShieldCheck,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.rights.read", "admin.content.read"],
                },
                {
                  title: "Seller Payout Readiness",
                  url: "/admin/seller-readiness",
                  icon: CreditCard,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.finance.read", "admin.content.read"],
                },
              ]}
              isActive={isActive}
              adminPermissions={adminAccess?.permissions ?? []}
            />
            <NavGroup
              label="Business"
              items={[
                {
                  title: "Business Operations",
                  url: "/admin/businesses",
                  icon: BriefcaseBusiness,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.business.read"],
                },
                {
                  title: "Business Pilot",
                  url: "/admin/business-pilot",
                  icon: Workflow,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.business.pilot"],
                },
                {
                  title: "Partner Center",
                  url: "/admin/partner-center",
                  icon: FolderKanban,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.business.read"],
                },
                {
                  title: "Offers",
                  url: "/admin/offers",
                  icon: Gift,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.business.read"],
                },
              ]}
              isActive={isActive}
              adminPermissions={adminAccess?.permissions ?? []}
            />
            <NavGroup
              label="Management"
              items={[
                {
                  title: "Memberships",
                  url: "/admin/memberships",
                  icon: CreditCard,
                  allow: ["admin"],
                  permissionAnyOf: [
                    "admin.finance.read",
                    "admin.creator.membership",
                  ],
                },
                {
                  title: "Membership & Privacy Audit",
                  url: "/admin/membership-audit",
                  icon: ShieldCheck,
                  allow: ["admin"],
                  permissionAnyOf: [
                    "admin.finance.read",
                    "admin.creator.membership",
                  ],
                },
                {
                  title: "Reports",
                  url: "/admin/reports",
                  icon: BarChart3,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.analytics.read"],
                },
                {
                  title: "Play Operations",
                  url: "/admin/play",
                  icon: Gamepad2,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.content.read"],
                },
                {
                  title: "System Health",
                  url: "/admin/system-health",
                  icon: Activity,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.system.read"],
                },
                {
                  title: "Admin Team",
                  url: "/admin/team",
                  icon: UsersRound,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.team.manage"],
                },
                {
                  title: "System Settings",
                  url: "/settings",
                  icon: Settings,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.team.manage"],
                },
              ]}
              isActive={isActive}
              adminPermissions={adminAccess?.permissions ?? []}
            />
            <NavGroup
              label="View VYBE"
              items={[
                {
                  title: "Member Experience",
                  url: "/home",
                  icon: ExternalLink,
                  allow: ["admin"],
                },
                {
                  title: "Creator Studio",
                  url: "/dashboard",
                  icon: Music2,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.creator.manage"],
                },
                {
                  title: "Business Studio",
                  url: "/business",
                  icon: BriefcaseBusiness,
                  allow: ["admin"],
                  permissionAnyOf: ["admin.business.manage"],
                },
              ]}
              isActive={isActive}
              adminPermissions={adminAccess?.permissions ?? []}
            />
          </>
        ) : (
          <>
            {!hasAnyRole(["creator"]) ? (
              <>
                <NavGroup label="Your VYBE" items={visible(memberPrimary)} isActive={isActive} />
                <NavGroup label="Explore More" items={visible(memberMore)} isActive={isActive} />
              </>
            ) : null}
            {visible(creatorStudio).length ? (
              <NavGroup
                label="Creator Studio"
                items={visible(creatorStudio)}
                isActive={isActive}
              />
            ) : null}
            {visible(creatorAudience).length ? (
              <NavGroup
                label="Audience"
                items={visible(creatorAudience)}
                isActive={isActive}
              />
            ) : null}
            {visible(creatorGrowth).length ? (
              <NavGroup
                label="Profile & Growth"
                items={visible(creatorGrowth)}
                isActive={isActive}
              />
            ) : null}            {hasAnyRole(["creator"]) ? (
              <NavGroup
                label="Browse VYBE"
                items={[{ title: "Explore the VYBE app", url: "/home", icon: Compass, allow: ["creator"] }]}
                isActive={isActive}
              />
            ) : null}
            {hasAnyRole(["business"]) ? (
              <NavGroup
                label="Business Studio"
                items={[
                  {
                    title: "Business Overview",
                    url: "/business",
                    icon: BriefcaseBusiness,
                    allow: ["business", "admin"],
                  },
                ]}
                isActive={isActive}
              />
            ) : null}
            {hasAnyRole(["supporter"]) && !hasAnyRole(["creator", "admin"]) ? (
              <NavGroup
                label="Account"
                items={[
                  {
                    title: "Profile",
                    url: "/supporter-profile",
                    icon: User,
                    allow: ["supporter"],
                  },
                  {
                    title: "Settings",
                    url: "/settings",
                    icon: Settings,
                    allow: ["supporter"],
                  },
                ]}
                isActive={isActive}
              />
            ) : null}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  isActive,
  adminPermissions,
}: {
  label: string;
  items: NavItem[];
  isActive: (url: string) => boolean;
  adminPermissions?: string[];
}) {
  const visibleItems = items.filter(
    (item) =>
      !item.permissionAnyOf ||
      item.permissionAnyOf.some((permission) =>
        adminPermissions?.includes(permission),
      ),
  );
  if (!visibleItems.length) return null;
  return (
    <SidebarGroup className="py-1">
      <SidebarGroupLabel className="h-7">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                tooltip={item.title}
              >
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
