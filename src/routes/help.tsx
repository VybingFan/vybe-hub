import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenText, Compass, Gamepad2, Heart, ListMusic, ShieldCheck, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({ component: HelpPage });

const sections = [
  { title: "Accounts & getting started", icon: User, body: "Choose your role, complete your profile, understand the main navigation, and return to the VYBE Guide whenever you need it." },
  { title: "Creator profiles", icon: User, body: "Your public creator page brings your identity, music, playlists, video, updates, links, community activity, and other public experiences together." },
  { title: "Music & playlists", icon: ListMusic, body: "Creators upload and manage music, choose what appears publicly, build playlists, and share direct links. Supporters can listen and move through a creator's available music." },
  { title: "Watch & video", icon: Video, body: "Creators with eligible access can add hosted or native video. Supporters use Watch and creator pages to discover published video." },
  { title: "Discover & My VYBE", icon: Compass, body: "Discover helps supporters find creators and experiences. My VYBE keeps saved and followed experiences easier to return to." },
  { title: "Play", icon: Gamepad2, body: "Play includes music games plus creator-focus experiences for film, acting, comedy, podcasting, writing, dance, and more as packs are released." },
  { title: "Supporter activity", icon: Heart, body: "Following, saving, sharing, comments, and other participation tools help supporters keep up with creators without searching through disconnected feeds." },
  { title: "Safety, privacy & rights", icon: ShieldCheck, body: "VYBE includes reporting, copyright, privacy, community standards, rights confirmation, and content-review guidance." },
];

function HelpPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">VYBE Help Center</p>
      <h1 className="mt-2 max-w-3xl text-4xl font-semibold">What it is, what it does, and where to find it.</h1>
      <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">Use this page as the permanent reference for the main parts of VYBE. Signed-in members can also open the step-by-step VYBE Guide.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild className="bg-gradient-brand text-white"><Link to="/guide">Open VYBE Guide</Link></Button>
        <Button asChild variant="outline"><Link to="/discover">Explore VYBE</Link></Button>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="rounded-3xl border bg-card p-6">
              <Icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
            </section>
          );
        })}
      </div>
      <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/5 p-6">
        <BookOpenText className="h-5 w-5 text-primary" />
        <h2 className="mt-3 text-xl font-semibold">Need a quick orientation?</h2>
        <p className="mt-2 text-sm text-muted-foreground">Open the VYBE Guide for a role-based step-by-step path through the platform.</p>
      </section>
    </main>
  );
}
