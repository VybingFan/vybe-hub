import { createFileRoute } from "@tanstack/react-router";
import { InformationPage } from "@/components/layout/InformationPage";

export const Route = createFileRoute("/copyright")({ component: CopyrightPage });

function CopyrightPage() {
  return (
    <InformationPage
      eyebrow="Copyright"
      title="Share only work you created or have permission to use."
      description="Music, lyrics, recordings, films, artwork, performances, and video can involve multiple rights holders."
      sections={[
        { title: "Creator responsibility", body: "Uploaders must own the content or have the permissions and licenses needed to publish it on VYBE." },
        { title: "Music rights", body: "A track may involve separate rights in the composition, lyrics, samples, featured performances, and sound recording." },
        { title: "Film and video rights", body: "Trailers, scenes, artwork, dialogue, music, performances, and promotional materials may each require authorization." },
        { title: "Reporting infringement", body: "A formal copyright notice, review, removal, and counter-notification process will be published before open public uploads expand." },
      ]}
    />
  );
}
