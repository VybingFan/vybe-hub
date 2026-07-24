import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  return (
    <InformationPage
      eyebrow="About VYBE"
      title="A home for creators, their work, and the people who care about it."
      description="VYBE begins with independent music and is being built to support a broader creator entertainment ecosystem."
      sections={[
        {
          title: "For fans",
          body: "Discover work, follow creators, build playlists, join conversations, and take part in the culture around each release.",
        },
        {
          title: "For creators",
          body: "Bring music, films, trailers, stories, merchandise, events, and community into one creator-controlled destination.",
        },
        {
          title: "For partners",
          body: "Businesses, venues, brands, and creative organizations can find thoughtful ways to collaborate with creators and communities.",
        },
        {
          id: "how-vybe-works",
          title: "How VYBE works",
          body: "Public discovery stays fan-friendly while creator and business tools live in clearly separated professional areas.",
        },
      ]}
    />
  );
}
