import { createFileRoute } from "@tanstack/react-router";
import { CalendarHeart, Clapperboard, MapPin, Mic2, PartyPopper, Radio } from "lucide-react";
import { ExperiencePreviewPage } from "@/components/experience/ExperiencePreviewPage";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const Route = createFileRoute("/_authenticated/events")({ component: EventsPage });

function EventsPage() {
  return (
    <RoleGuard allow={["supporter", "creator", "admin"]}>
      <ExperiencePreviewPage
        eyebrow="VYBE Events · Preview"
        title="Show up for the moments surrounding the work."
        description="Discover digital and local experiences—from release nights and listening parties to screenings, performances, and community contests."
        accent="#06b6d4"
        cards={[
          {
            title: "Listening parties",
            description:
              "Scheduled shared listening with creator context and member participation.",
            icon: Radio,
          },
          {
            title: "Screenings & premieres",
            description:
              "Short-film screenings, trailer premieres, director conversations, and watch events.",
            icon: Clapperboard,
          },
          {
            title: "Live performances",
            description: "Concerts, poetry readings, showcases, and creator appearances.",
            icon: Mic2,
          },
          {
            title: "Release events",
            description:
              "Bring music, video, merchandise, stories, and community together around a launch.",
            icon: PartyPopper,
          },
          {
            title: "Local discovery",
            description: "Find events, creators, venues, and communities connected to your area.",
            icon: MapPin,
          },
          {
            title: "Your event calendar",
            description:
              "Save experiences and eventually receive reminders for the moments you choose.",
            icon: CalendarHeart,
          },
        ]}
        note="Event creation, ticketing, RSVPs, reminders, live synchronization, payments, and venue tools remain planned. This page shows the future member-facing structure."
      />
    </RoleGuard>
  );
}
