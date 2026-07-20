import { createFileRoute } from "@tanstack/react-router";
import { SharedPlaylistExperience } from "@/routes/playlist.$slug";

// The trailing underscore after $username keeps this route out of the artist
// profile route's layout while preserving /artist/:username/playlist/:slug.
export const Route = createFileRoute("/artist/$username_/playlist/$slug")({
  component: ArtistPlaylistPage,
});

function ArtistPlaylistPage() {
  const { slug } = Route.useParams();
  return <SharedPlaylistExperience slug={slug} />;
}
