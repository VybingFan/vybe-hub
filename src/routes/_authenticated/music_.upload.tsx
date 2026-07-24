import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MusicUploadForm, type SingleUploadValues } from "@/components/musicUpload/MusicUploadForm";
import { AlbumUploadForm, type AlbumUploadValues } from "@/components/musicUpload/AlbumUploadForm";
import { useUser } from "@/hooks/useUser";
import { useCreateAlbum, useUploadTrack } from "@/hooks/useMusic";
import { musicService } from "@/services/music/musicService";
import { useMembership } from "@/hooks/useMembership";
import { UsageMeter } from "@/components/membership/UsageMeter";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/music_/upload")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <UploadPage />
    </RoleGuard>
  ),
});

function UploadPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const upload = useUploadTrack(user?.id);
  const createAlbum = useCreateAlbum(user?.id);
  const { data: membership } = useMembership(!!user?.id);

  const submitSingle = async (values: SingleUploadValues) => {
    if (!values.audio) throw new Error("Audio file required");
    if (membership && values.duration_sec > membership.limits.track_duration_sec) {
      throw new Error(
        `Songs on your plan must be ${membership.limits.track_duration_sec / 60} minutes or shorter`,
      );
    }
    await upload.mutateAsync({
      input: {
        title: values.title,
        primary_artist_name: values.primary_artist_name,
        featured_artist_names: values.featured_artists
          .split(",")
          .map((name) => name.trim())
          .filter(Boolean),
        description: values.description,
        genre: values.genre,
        release_date: values.release_date,
        duration_sec: values.duration_sec,
        is_featured: values.is_featured,
        status: values.status,
        track_number: null,
        album_id: null,
      },
      audio: values.audio,
      cover: values.cover,
    });
    navigate({ to: "/music" });
  };

  const submitAlbum = async (values: AlbumUploadValues) => {
    if (!user?.id) throw new Error("Not authenticated");
    if (membership) {
      const remaining = membership.limits.uploaded_tracks - membership.usage.uploaded_tracks;
      if (values.tracks.length > remaining)
        throw new Error(
          `Your plan has room for ${remaining} more song${remaining === 1 ? "" : "s"}`,
        );
      if (
        values.tracks.some((track) => track.duration_sec > membership.limits.track_duration_sec)
      ) {
        throw new Error(
          `Every song must be ${membership.limits.track_duration_sec / 60} minutes or shorter`,
        );
      }
    }
    const album = await createAlbum.mutateAsync({
      input: {
        title: values.title,
        description: values.description,
        genre: values.genre,
        release_date: values.release_date,
        status: values.status,
      },
      cover: values.cover,
    });
    for (let i = 0; i < values.tracks.length; i++) {
      const t = values.tracks[i];
      await musicService.createTrack({
        userId: user.id,
        audio: t.audio,
        cover: null,
        albumId: album.id,
        input: {
          title: t.title,
          primary_artist_name: values.primary_artist_name,
          featured_artist_names: values.featured_artists
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean),
          description: "",
          genre: values.genre,
          release_date: values.release_date,
          duration_sec: t.duration_sec,
          is_featured: false,
          status: values.status,
          track_number: i + 1,
          album_id: album.id,
        },
      });
    }
    navigate({ to: "/music" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/music">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to library
            </Link>
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Upload music</h1>
          <p className="text-sm text-muted-foreground">Release a single track or a full album.</p>
        </div>
      </div>

      {membership && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div>
              <p className="font-medium">
                {membership.recognition_code === "vybe_pioneer"
                  ? `${membership.public_name} · VYBE Pioneer`
                  : membership.public_name}
              </p>
              <p className="text-sm text-muted-foreground">
                MP3 only · up to {membership.limits.track_duration_sec / 60} minutes · up to{" "}
                {Math.round(membership.limits.audio_bytes / 1024 / 1024)}MB per song
              </p>
            </div>
            <UsageMeter
              label="Songs in library"
              used={membership.usage.uploaded_tracks}
              limit={membership.limits.uploaded_tracks}
            />
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="single">
        <TabsList>
          <TabsTrigger value="single">Single</TabsTrigger>
          <TabsTrigger value="album">Album</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-6">
          <MusicUploadForm onSubmit={submitSingle} submitting={upload.isPending} />
        </TabsContent>
        <TabsContent value="album" className="mt-6">
          <AlbumUploadForm onSubmit={submitAlbum} submitting={createAlbum.isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
