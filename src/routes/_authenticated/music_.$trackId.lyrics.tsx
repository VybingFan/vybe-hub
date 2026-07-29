import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Loader2, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks } from "@/hooks/useMusic";
import {
  lyricsService,
  type LyricsVisibility,
  type TrackLyrics,
} from "@/services/music/lyricsService";

export const Route = createFileRoute("/_authenticated/music_/$trackId/lyrics")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <LyricsWorkspace />
    </RoleGuard>
  ),
});

const VISIBILITY: Array<{
  value: LyricsVisibility;
  title: string;
  description: string;
}> = [
  {
    value: "public",
    title: "Open for viewing and search",
    description: "Fans may read the refined lyrics and find the song through lyric search.",
  },
  {
    value: "search_only",
    title: "Searchable, but never shown",
    description: "VYBE may match searches to the lyrics, but viewers cannot open the lyric text.",
  },
  {
    value: "private",
    title: "Private",
    description: "Lyrics remain in Creator Studio and are excluded from fan search.",
  },
];

function LyricsWorkspace() {
  const { trackId } = Route.useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { data: tracks = [], isLoading: tracksLoading } = useCreatorTracks(user?.id);
  const track = tracks.find((item) => item.id === trackId);
  const lyricsQuery = useQuery({
    queryKey: ["track-lyrics", trackId],
    queryFn: () => lyricsService.get(trackId),
    enabled: !!user?.id,
  });
  const [refinedLyrics, setRefinedLyrics] = useState("");
  const [visibility, setVisibility] = useState<LyricsVisibility>("private");

  useEffect(() => {
    setRefinedLyrics(lyricsQuery.data?.refined_lyrics ?? "");
    setVisibility(lyricsQuery.data?.visibility ?? "private");
  }, [lyricsQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      lyricsService.save({
        trackId,
        creatorId: user!.id,
        refinedLyrics: refinedLyrics.trim(),
        visibility,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["track-lyrics", trackId], data);
      toast.success("Lyrics and search preference saved.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save lyrics"),
  });

  const requestTranscription = useMutation({
    mutationFn: () => lyricsService.requestTranscription(trackId),
    onSuccess: (data) => {
      queryClient.setQueryData(["track-lyrics", trackId], data);
      toast.success("Transcription request added to the VYBE processing queue.");
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not request transcription"),
  });

  if (tracksLoading || lyricsQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!track) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border p-10 text-center">
        <h1 className="text-2xl font-semibold">Song not found</h1>
        <Button asChild className="mt-6">
          <Link to="/music">Return to Music Library</Link>
        </Button>
      </div>
    );
  }

  const lyrics = lyricsQuery.data;
  const transcriptionLabel = getTranscriptionLabel(lyrics);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <Button asChild variant="ghost" className="-ml-3 mb-3">
          <Link to="/music/$trackId" params={{ trackId }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to song
          </Link>
        </Button>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-primary">
          Lyrics workspace
        </p>
        <h1 className="mt-2 text-4xl font-semibold">{track.title}</h1>
        <p className="mt-2 text-muted-foreground">{track.primary_artist_name}</p>
        <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">
          The song title and primary artist are linked directly to this uploaded track. Refine a
          transcription or enter lyrics yourself, then decide whether fans may read them, search
          them, or neither.
        </p>
      </header>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Transcription draft</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{transcriptionLabel}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={
              requestTranscription.isPending || lyrics?.transcription_status === "processing"
            }
            onClick={() => requestTranscription.mutate()}
          >
            {requestTranscription.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {lyrics?.transcription_status === "ready"
              ? "Request a new transcription"
              : "Request transcription"}
          </Button>
        </div>

        {lyrics?.transcript_draft ? (
          <div className="mt-6 space-y-3">
            <Textarea
              readOnly
              value={lyrics.transcript_draft}
              className="min-h-52 bg-muted/40"
              aria-label="Machine transcription draft"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setRefinedLyrics(lyrics.transcript_draft)}
            >
              Use this draft as my starting point
            </Button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">
            No transcription is available yet. The VYBE queue and creator workspace are ready; the
            private speech-to-text processor must be connected before queued requests produce
            drafts. You can enter or paste your lyrics below now.
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Refine your lyrics</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Review spelling, names, repeated sections, ad-libs, and line breaks before making lyrics
          searchable or visible.
        </p>
        <Label htmlFor="refined-lyrics" className="mt-6 block">
          Creator-reviewed lyrics
        </Label>
        <Textarea
          id="refined-lyrics"
          value={refinedLyrics}
          onChange={(event) => setRefinedLyrics(event.target.value)}
          className="mt-2 min-h-80 font-mono text-sm leading-6"
          placeholder="Enter or paste the lyrics here…"
        />
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">Choose how VYBE may use these lyrics</h2>
        </div>
        <div className="mt-6 grid gap-3">
          {VISIBILITY.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-2xl border p-4 ${
                visibility === option.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="lyrics-visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={() => setVisibility(option.value)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <div>
                  <p className="font-medium">{option.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="bg-gradient-brand text-primary-foreground"
        >
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save lyrics and preference
        </Button>
      </div>
    </div>
  );
}

function getTranscriptionLabel(lyrics: TrackLyrics | null | undefined) {
  switch (lyrics?.transcription_status) {
    case "queued":
      return "Queued for transcription. The private transcription processor is not connected yet.";
    case "processing":
      return "VYBE is transcribing this song.";
    case "ready":
      return "A machine-generated draft is ready for your review.";
    case "failed":
      return lyrics.transcription_error || "The transcription could not be completed.";
    default:
      return "Request a machine-generated starting point, or enter lyrics manually.";
  }
}
