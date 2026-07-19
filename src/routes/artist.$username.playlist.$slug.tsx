import { createFileRoute } from "@tanstack/react-router";
import { SharedPlaylistExperience } from "@/routes/playlist.$slug";

export const Route = createFileRoute("/artist/$username/playlist/$slug")({
  component: ArtistPlaylistPage,
});

function ArtistPlaylistPage() {
  const { slug } = Route.useParams();
  return <SharedPlaylistExperience slug={slug} />;
}
