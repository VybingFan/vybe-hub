import { createFileRoute } from "@tanstack/react-router";
import { PublicArtistHome } from "@/routes/creator.$username";

export const Route = createFileRoute("/artist/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} on VYBE | Creator Profile` },
      { name: "description", content: `Explore ${params.username} on VYBE and discover their public creator content, updates and links.` },
    ],
    links: [{ rel: "canonical", href: `https://vybewithvybe.com/artist/${encodeURIComponent(params.username)}` }],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    track: typeof search.track === "string" ? search.track : "",
    autoplay: search.autoplay === true || search.autoplay === "1",
  }),
  component: ArtistPage,
});

function ArtistPage() {
  const { username } = Route.useParams();
  const { track, autoplay } = Route.useSearch();
  return (
    <PublicArtistHome
      username={username}
      selectedTrackId={track || undefined}
      autoPlayOnOpen={autoplay}
    />
  );
}
