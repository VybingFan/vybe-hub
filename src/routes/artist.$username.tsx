import { createFileRoute } from "@tanstack/react-router";
import { PublicArtistHome } from "@/routes/creator.$username";

export const Route = createFileRoute("/artist/$username")({
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
