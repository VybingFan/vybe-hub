import { createFileRoute } from "@tanstack/react-router";
import { CalendarHeart, Clapperboard, MapPin, Mic2, PartyPopper, Radio } from "lucide-react";
import { PublicExperiencePage } from "@/components/experience/PublicExperiencePage";

export const Route = createFileRoute("/experience/events")({ component: EventsPreview });

function EventsPreview() {
  return (
    <PublicExperiencePage
      eyebrow="VYBE Events · Preview"
      title="Show up for the moments surrounding the work."
      description="Discover digital and local experiences—from release nights and listening parties to screenings, performances, and community contests."
      accent="#06b6d4"
      cards={[
        {
          title: "Listening parties",
          description: "Scheduled shared listening with creator context and participation.",
          icon: Radio,
        },
        {
          title: "Screenings",
          description: "Film screenings, trailer premieres, and director conversations.",
          icon: Clapperboard,
        },
        {
          title: "Performances",
          description: "Concerts, poetry readings, showcases, and appearances.",
          icon: Mic2,
        },
        {
          title: "Release events",
          description: "Bring creative work, merchandise, stories, and community together.",
          icon: PartyPopper,
        },
        {
          title: "Local discovery",
          description: "Find events, creators, venues, and communities in your area.",
          icon: MapPin,
        },
        {
          title: "Your calendar",
          description: "Save experiences and eventually receive reminders.",
          icon: CalendarHeart,
        },
      ]}
      note="Event creation, ticketing, RSVPs, reminders, payments, and venue tools remain planned."
    />
  );
}
