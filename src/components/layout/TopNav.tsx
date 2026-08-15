import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { useUser } from "@/hooks/useUser";
import { useMyActivity } from "@/hooks/useActivity";
import { playNotificationChime } from "@/lib/notificationSound";
import { useMyConnections } from "@/hooks/useConnections";
import {
  adminNotificationService,
  type AdminNotification,
} from "@/services/admin/adminNotificationService";

export function TopNav() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { signOut } = useAuth();
  const { profile, user, hasRole } = useUser();
  const { data: creatorProfile } = useCreatorProfile(hasRole("creator") ? user?.id : undefined);
  const { data: activity = [] } = useMyActivity(hasRole("creator") ? user?.id : undefined);
  const { data: connections = [] } = useMyConnections(hasRole("creator") ? user?.id : undefined);
  const isAdmin = hasRole("admin") && pathname.startsWith("/admin");
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [lastSeen, setLastSeen] = useState(() =>
    typeof window === "undefined"
      ? 0
      : Number(window.localStorage.getItem("vybe:activity-seen") || 0),
  );
  const creatorUnread = [...activity, ...connections].filter(
    (item) => new Date(item.created_at).getTime() > lastSeen,
  ).length;
  const adminUnread = adminNotifications.filter((item) => item.status === "unread").length;
  const unread = isAdmin ? adminUnread : creatorUnread;
  const latestActivity = useRef<string | null>(null);
  useEffect(() => {
    const latestItem = [...activity, ...connections].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )[0];
    const latest = latestItem?.id;
    if (!latest) return;
    if (latestActivity.current && latestActivity.current !== latest) {
      const saved = window.localStorage.getItem("vybe:preview-preferences");
      const soundEnabled = saved ? JSON.parse(saved).sound === true : false;
      if (soundEnabled) playNotificationChime();
    }
    latestActivity.current = latest;
  }, [activity, connections]);
  useEffect(() => {
    if (!isAdmin) return;
    const load = () => {
      void adminNotificationService
        .list()
        .then(setAdminNotifications)
        .catch(() => undefined);
    };
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [isAdmin]);
  const displayName =
    creatorProfile?.display_name || profile?.display_name || user?.email?.split("@")[0] || "You";
  const avatarUrl = creatorProfile?.avatar_url || profile?.avatar_url || undefined;
  const initials = displayName
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-3 backdrop-blur-xl">
      <SidebarTrigger />
      <form
        className="relative hidden max-w-md flex-1 md:block"
        onSubmit={(event) => {
          event.preventDefault();
          const query = new FormData(event.currentTarget).get("q")?.toString().trim() ?? "";
          if (isAdmin) {
            navigate({ to: "/admin/search", search: { q: query } });
          } else {
            navigate({ to: "/explore", search: { q: query } });
          }
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          placeholder={
            isAdmin
              ? "Search accounts, creators, rights, memberships, operations…"
              : "Search artists, songs, cities, genres…"
          }
          className="h-9 rounded-full border-border/60 bg-muted/40 pl-9"
        />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="rounded-full md:hidden">
          <Link
            to={isAdmin ? "/admin/search" : "/explore"}
            search={{ q: "" }}
            aria-label={isAdmin ? "Search Back Office" : "Search VYBE"}
          >
            <Search className="h-4 w-4" />
          </Link>
        </Button>
        <DropdownMenu
          onOpenChange={(open) => {
            if (open && !isAdmin) {
              const now = Date.now();
              setLastSeen(now);
              window.localStorage.setItem("vybe:activity-seen", String(now));
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full"
              aria-label={`${unread} unread notifications`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {Math.min(unread, 99)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-80">
            <DropdownMenuLabel>
              {isAdmin ? "Back Office alerts" : "Creator activity"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isAdmin &&
              adminNotifications.slice(0, 8).map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  className="items-start py-3"
                  asChild
                  onSelect={() => {
                    if (item.status === "unread") void adminNotificationService.markRead(item.id);
                  }}
                >
                  <Link to={item.action_path || "/admin/work-queue"}>
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{item.message}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            {isAdmin && !adminNotifications.length ? (
              <DropdownMenuItem disabled>No pending Back Office alerts.</DropdownMenuItem>
            ) : null}
            {!isAdmin && (
              <>
                {connections.slice(0, 3).map((connection) => (
                  <DropdownMenuItem key={connection.id} className="items-start py-3" asChild>
                    <Link to="/connections">
                      <div>
                        <p className="text-sm font-medium">New listener connection</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {connection.display_name || connection.email} •{" "}
                          {connection.playlists?.title || "Shared playlist"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(connection.created_at).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))}
                {!activity.length && !connections.length && (
                  <DropdownMenuItem disabled>No creator activity yet.</DropdownMenuItem>
                )}
                {activity.slice(0, 10).map((item) => (
                  <DropdownMenuItem key={item.id} className="items-start py-3">
                    <div>
                      <p className="text-sm font-medium">
                        {item.event_type === "link_opened"
                          ? "Playlist link opened"
                          : "Track playback started"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.tracks?.title ? `${item.tracks.title} • ` : ""}
                        {item.playlists?.title || "Shared playlist"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            {isAdmin ? (
              <DropdownMenuItem asChild>
                <Link to="/admin/work-queue">Open Work Queue</Link>
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/activity">View all activity and totals</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/connections">View listener connections</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Anonymous activity only. Refreshes every 30 seconds.
                </DropdownMenuLabel>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={`${displayName} profile photo`} />
                ) : null}
                <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {displayName}
              <p className="text-xs font-normal text-muted-foreground">
                {user?.email ?? "Not signed in"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
