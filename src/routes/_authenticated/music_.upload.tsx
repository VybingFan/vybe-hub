import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  MusicUploadForm,
  type SingleUploadValues,
} from "@/components/musicUpload/MusicUploadForm";
import {
  AlbumUploadForm,
  type AlbumUploadValues,
} from "@/components/musicUpload/AlbumUploadForm";
import { useUser } from "@/hooks/useUser";
import { useCreateAlbum, useUploadTrack } from "@/hooks/useMusic";
import { musicService } from "@/services/music/musicService";
import { useMembership } from "@/hooks/useMembership";
import { UsageMeter } from "@/components/membership/UsageMeter";
import { Card, CardContent } from "@/components/ui/card";
import { MUSIC_RIGHTS_POLICY_VERSION } from "@/constants/legal";
import { creatorRightsService } from "@/services/rights/creatorRightsService";
import { CreatorRightsCertificationGate } from "@/components/musicUpload/CreatorRightsCertificationGate";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { hasCreatorCapability } from "@/features/membership/access";

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
  const queryClient = useQueryClient();
  const rightsStatus = useQuery({
    queryKey: ["creator-music-rights-status", user?.id],
    queryFn: () => creatorRightsService.getMusicStatus(),
    enabled: !!user?.id,
  });
  const activeRights =
    rightsStatus.data?.active === true ? rightsStatus.data : null;
  const advancedWorkflow = hasCreatorCapability(membership?.plan_code, "music.workflow");

  const submitSingle = async (values: SingleUploadValues) => {
    if (!values.audio) throw new Error("Audio file required");
    if (
      membership &&
      values.duration_sec > membership.limits.track_duration_sec
    ) {
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
        rights_basis: values.rights_basis,
        rights_confirmed: true,
        rights_policy_version: MUSIC_RIGHTS_POLICY_VERSION,
        rights_confirmed_at:
          activeRights?.certified_at ?? new Date().toISOString(),
        discovery_metadata: values.discovery_metadata,
        visibility: values.visibility,
        playback_mode: values.playback_mode,
        preview_duration_sec: values.preview_duration_sec,
        preview_start_sec: values.preview_start_sec,
        allow_download: values.allow_download,
        workspace_category: advancedWorkflow ? values.workspace_category : "work_in_progress",
        production_stage: advancedWorkflow ? values.production_stage : "recording",
      },
      audio: values.audio,
      cover: values.cover,
    });
    await queryClient.invalidateQueries({
      queryKey: ["creator-music-rights-status", user?.id],
    });
    navigate({ to: "/music" });
  };

  const submitAlbum = async (values: AlbumUploadValues) => {
    if (!user?.id) throw new Error("Not authenticated");
    if (
      activeRights &&
      values.tracks.length > activeRights.uploads_until_renewal
    ) {
      throw new Error(
        `Your current certification covers ${activeRights.uploads_until_renewal} more songs. Renew it before uploading this ${values.tracks.length}-song album.`,
      );
    }
    if (membership) {
      const remaining =
        membership.limits.uploaded_tracks - membership.usage.uploaded_tracks;
      if (values.tracks.length > remaining)
        throw new Error(
          `Your plan has room for ${remaining} more song${remaining === 1 ? "" : "s"}`,
        );
      if (
        values.tracks.some(
          (track) => track.duration_sec > membership.limits.track_duration_sec,
        )
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
          rights_basis: values.rights_basis,
          rights_confirmed: true,
          rights_policy_version: MUSIC_RIGHTS_POLICY_VERSION,
          rights_confirmed_at:
            activeRights?.certified_at ?? new Date().toISOString(),
          visibility: "public",
          playback_mode: "full",
          preview_duration_sec: 30,
          preview_start_sec: 0,
          allow_download: false,
          workspace_category: "work_in_progress",
          production_stage: "recording",
          discovery_metadata: {
            mood_tags: [],
            location: "",
            placement_platform: "",
            placement_title: "",
            placement_details: "",
          },
        },
      });
    }
    await queryClient.invalidateQueries({
      queryKey: ["creator-music-rights-status", user?.id],
    });
    navigate({ to: "/music" });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <WorkspacePageHeader
        eyebrow="Music workspace"
        title="Upload music"
        description="Add a single or album. Required files and details come first; optional discovery, release, and promotion information can be added now or later."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/music">
              <ChevronLeft className="mr-1 h-4 w-4" /> Music library
            </Link>
          </Button>
        }
      />

      {membership && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="font-medium">
                {membership.plan_code === "founding_beta"
                  ? "Founding Creator · Creator Pro Access"
                  : membership.recognition_code === "vybe_pioneer"
                    ? `${membership.public_name} · VYBE Pioneer`
                    : membership.public_name}
              </p>
              <p className="text-sm text-muted-foreground">
                MP3 only · up to {membership.limits.track_duration_sec / 60}{" "}
                minutes · up to{" "}
                {Math.round(membership.limits.audio_bytes / 1024 / 1024)}MB per
                song
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

      {rightsStatus.isLoading ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your music
            upload certification…
          </CardContent>
        </Card>
      ) : activeRights ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="font-medium">
              Your music upload certification is active.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You confirm that you own or have permission or licenses for every
              song you upload. VYBE will ask you to renew after{" "}
              {activeRights.uploads_until_renewal} more{" "}
              {activeRights.uploads_until_renewal === 1 ? "song" : "songs"}.
            </p>
          </div>
        </div>
      ) : (
        <CreatorRightsCertificationGate
          renewing={!!rightsStatus.data}
          onCertify={async (basis) => {
            await creatorRightsService.certifyMusic(basis);
            await queryClient.invalidateQueries({
              queryKey: ["creator-music-rights-status", user?.id],
            });
          }}
        />
      )}

      {!rightsStatus.isLoading && activeRights && (
        <Tabs defaultValue="single">
          <TabsList className="grid w-full grid-cols-2 sm:w-72">
            <TabsTrigger value="single">Single</TabsTrigger>
            <TabsTrigger value="album">Album</TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="mt-4">
            <MusicUploadForm
              onSubmit={submitSingle}
              submitting={upload.isPending}
              defaultRightsBasis={activeRights.default_rights_basis}
              advancedWorkflow={advancedWorkflow}
            />
          </TabsContent>
          <TabsContent value="album" className="mt-4">
            <AlbumUploadForm
              onSubmit={submitAlbum}
              submitting={createAlbum.isPending}
              defaultRightsBasis={activeRights.default_rights_basis}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
