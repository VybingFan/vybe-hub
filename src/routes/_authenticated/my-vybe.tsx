import type { ReactNode } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CalendarDays, ChevronRight, Gamepad2, Heart, Headphones, MapPin,
  MessageCircle, Pencil, Play, Radio, Sparkles, Users,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { SavedMusicLists } from "@/components/engagement/SavedMusicLists";
import { SupporterCreatorUpdates } from "@/components/engagement/SupporterCreatorUpdates";
import { SupporterFollowingCreators } from "@/components/engagement/SupporterFollowingCreators";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useUser } from "@/hooks/useUser";
import { useSupporterProfile } from "@/hooks/useSupporterProfile";

export const Route = createFileRoute("/_authenticated/my-vybe")({ component: MyVybePage });

function MyVybePage() {
  const { user } = useUser();
  const { data: supporterProfile } = useSupporterProfile(user?.id);

  return (
    <RoleGuard allow={["supporter", "creator", "business", "admin"]}>
      <div className="mx-auto max-w-7xl space-y-5 pb-8 sm:space-y-8 sm:pb-12">
        <WorkspacePageHeader
          eyebrow="My VYBE"
          title="Your VYBE starts here."
          description="Catch up with creators you care about, keep what moves you close, and jump back into everything VYBE has waiting for you."
        />

        <SupporterIdentityCard profile={supporterProfile} />

        <SupporterFollowingCreators />

        <SupporterCreatorUpdates />

        <section className="grid gap-3 sm:gap-4 lg:grid-cols-[1.4fr_.8fr]">
          <Card className="overflow-hidden border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,.18),transparent_46%)]">
            <CardContent className="flex min-h-0 flex-col justify-between p-4 sm:min-h-56 sm:p-7">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary sm:h-11 sm:w-11 sm:rounded-2xl">
                  <Headphones className="h-5 w-5" />
                </div>
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.16em] text-primary sm:mt-5 sm:text-xs sm:tracking-[.2em]">Pick up your VYBE</p>
                <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Keep listening. Keep discovering.</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Return to music, creators, and experiences you were already enjoying.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap">
                <Button asChild size="sm" className="w-full sm:w-auto sm:h-10"><Link to="/listen"><Play className="mr-2 h-4 w-4 fill-current" />Continue listening</Link></Button>
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto sm:h-10"><Link to="/discover">Discover creators</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex h-full flex-col p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Daily VYBE</p>
                  <h2 className="mt-1 text-lg font-semibold sm:text-xl">Something to do today</h2>
                </div>
                <Gamepad2 className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Jump into trivia, creator-focus games, and Connect the VYBE.</p>
              <Button asChild variant="outline" size="sm" className="mt-4 justify-between sm:mt-auto sm:h-10">
                <Link to="/play">Play your VYBE<ChevronRight className="h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary sm:text-xs sm:tracking-[.2em]">Your world</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Your creators, communities, and events</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Music, film, theater, comedy, podcasts, writing, dance, visual art, and more all belong in your personal VYBE.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            <DashboardLink to="/discover" icon={<Users className="h-5 w-5" />} eyebrow="Your creators" title="See who you follow" description="Return to creators across every focus." />
            <DashboardLink to="/communities" icon={<MessageCircle className="h-5 w-5" />} eyebrow="Community" title="Join the conversation" description="Keep up with communities and creator conversations." />
            <DashboardLink to="/events" icon={<CalendarDays className="h-5 w-5" />} eyebrow="Events" title="See what is happening" description="Find creator events and experiences around VYBE." />
            <DashboardLink to="/discover" icon={<Sparkles className="h-5 w-5" />} eyebrow="Next VYBE" title="Find something new" description="Move beyond your usual lane and discover another focus." />
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary sm:text-xs sm:tracking-[.2em]">Explore your VYBE</p>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Choose what you want to do</h2>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3">
            <ExperienceCard to="/listen" icon={<Headphones className="h-5 w-5" />} title="Listen" description="Music from creators you know and creators you have not met yet." />
            <ExperienceCard to="/watch" icon={<Radio className="h-5 w-5" />} title="Watch" description="Film, video, performance, and visual creator experiences." />
            <ExperienceCard to="/play" icon={<Gamepad2 className="h-5 w-5" />} title="Play" description="Trivia, challenges, daily activities, and cross-focus games." />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-primary">Your collection</p>
              <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Keep what moves you close</h2>
            </div>
          </div>
          <SavedMusicLists />
        </section>
      </div>
    </RoleGuard>
  );
}

function SupporterIdentityCard({ profile }: {
  profile: { display_name?: string | null; username?: string | null; bio?: string | null; location?: string | null; avatar_url?: string | null } | null | undefined;
}) {
  const hasIdentity = Boolean(profile?.display_name || profile?.username);
  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <img
            src={profile?.avatar_url || "/avatars/default-avatar.png"}
            alt={profile?.display_name ? `${profile.display_name} profile` : "Supporter profile"}
            className="h-16 w-16 shrink-0 rounded-2xl border object-cover shadow-elevated sm:h-24 sm:w-24 sm:rounded-3xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary sm:text-xs sm:tracking-[.2em]">Your supporter identity</p>
            <h2 className="mt-1 truncate text-xl font-semibold sm:text-2xl">{profile?.display_name || "Make My VYBE yours"}</h2>
            {profile?.username ? <p className="mt-1 text-sm font-medium text-primary">@{profile.username}</p> : null}
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {profile?.bio || "Add a profile photo, VYBE tag, and short bio so your supporter identity feels like you."}
            </p>
            {profile?.location ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />{profile.location}
              </p>
            ) : null}
          </div>
          <Button asChild size="sm" className="w-full sm:w-auto sm:h-10" variant={hasIdentity ? "outline" : "default"}>
            <Link to="/supporter-profile"><Pencil className="mr-2 h-4 w-4" />{hasIdentity ? "Edit profile" : "Create profile"}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardLink({ to, icon, eyebrow, title, description }: {
  to: string; icon: ReactNode; eyebrow: string; title: string; description: string;
}) {
  return (
    <Link to={to} className="group min-w-0 rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:bg-muted/20 sm:rounded-2xl sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10 sm:rounded-xl">{icon}</span>
        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
      </div>
      <p className="mt-2.5 text-[9px] font-semibold uppercase tracking-[.12em] text-primary sm:mt-4 sm:text-xs sm:tracking-[.16em]">{eyebrow}</p>
      <h3 className="mt-1 text-sm font-semibold sm:text-base">{title}</h3>
      <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-normal">{description}</p>
    </Link>
  );
}

function ExperienceCard({ to, icon, title, description }: {
  to: string; icon: ReactNode; title: string; description: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10 sm:rounded-xl">{icon}</span>
        <h3 className="mt-2.5 text-sm font-semibold sm:mt-4 sm:text-lg">{title}</h3>
        <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-normal">{description}</p>
        <Button asChild variant="ghost" size="sm" className="mt-2 h-8 px-0 text-xs text-primary hover:bg-transparent sm:mt-4 sm:h-9 sm:text-sm">
          <Link to={to}>Open {title}<ChevronRight className="ml-1 h-4 w-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
