import { createFileRoute } from "@tanstack/react-router";
import { PublicArtistHome } from "@/routes/creator.$username";

export const Route = createFileRoute("/artist/$username")({ component: ArtistPage });

function ArtistPage() {
  const { username } = Route.useParams();
  return <PublicArtistHome username={username} />;
}
