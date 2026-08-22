import { FormEvent, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Eye,
  Globe2,
  ImagePlus,
  Link2,
  ListMusic,
  LockKeyhole,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks } from "@/hooks/useMusic";
import {
  useCreatePlaylist,
  useDeletePlaylist,
  useMyPlaylists,
  useReplacePlaylistCover,
} from "@/hooks/usePlaylists";
import { formatDuration, MAX_COVER_BYTES } from "@/features/music/schema";
import {
  PLAYLIST_PURPOSES,
  PLAYLIST_WORKSPACE_CATEGORIES,
  PLAYLIST_WORKSPACE_CATEGORY_LABELS,
  type Playlist,
  type PlaylistAccessMode,
  type PlaylistWorkspaceCategory,
} from "@/features/playlists/schema";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { Badge } from "@/components/ui/badge";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { useMembership } from "@/hooks/useMembership";
import { getCreatorEntitlements, hasCreatorFeature } from "@/features/membership/entitlements";
import { LockedFeatureCard } from "@/components/membership/LockedFeatureCard";
import {
  TRACK_PRODUCTION_STAGE_LABELS,
  TRACK_WORKSPACE_CATEGORY_LABELS,
} from "@/features/music/workflow";import { publicMusicSetupService } from "@/services/music/publicMusicSetupService";


export const Route = createFileRoute("/_authenticated/playlists")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <PlaylistStudio />
    </RoleGuard>
  ),
});

function PlaylistStudio() {
  const { user } = useUser();
  const { data: tracks = [], isLoading } = useCreatorTracks(user?.id);
  const { data: creatorProfile } = useCreatorProfile(user?.id);
  const { data: playlists = [] } = useMyPlaylists(user?.id);
  const queryClient = useQueryClient();
  const { data: membership } = useMembership();
  const creatorEntitlements = getCreatorEntitlements(membership?.plan_code);
  const canUsePasswords = hasCreatorFeature(membership?.plan_code, "playlist.password");
  const canUseApprovedListeners = hasCreatorFeature(membership?.plan_code, "playlist.approved_listeners");
  const create = useCreatePlaylist(user?.id);
  const replaceCover = useReplacePlaylistCover(user?.id);
  const deletePlaylist = useDeletePlaylist(user?.id);
  const [publicDisplayBusyId, setPublicDisplayBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [songQuery, setSongQuery] = useState("");
  const [songGenre, setSongGenre] = useState("all");
  const [playlistQuery, setPlaylistQuery] = useState("");
  const [playlistCategory, setPlaylistCategory] = useState<
    "all" | PlaylistWorkspaceCategory
  >("all");
  const [playlistSort, setPlaylistSort] = useState<"newest" | "title">(
    "newest",
  );
  const [createAccessMode, setCreateAccessMode] =
    useState<PlaylistAccessMode>("unlisted");
  const [createWorkspaceCategory, setCreateWorkspaceCategory] =
    useState<PlaylistWorkspaceCategory>("released");
  const [createRequireSignIn, setCreateRequireSignIn] = useState(false);
  const [createAccessExpiresAt, setCreateAccessExpiresAt] = useState("");
  const [visiblePlaylistCount, setVisiblePlaylistCount] = useState(8);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [playlistCover, setPlaylistCover] = useState<File | null>(null);
  const playlistCoverPreview = useMemo(
    () => (playlistCover ? URL.createObjectURL(playlistCover) : null),
    [playlistCover],
  );
  useEffect(
    () => () => {
      if (playlistCoverPreview) URL.revokeObjectURL(playlistCoverPreview);
    },
    [playlistCoverPreview],
  );
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const songGenres = useMemo(
    () =>
      Array.from(
        new Set(
          tracks
            .map((track) => track.genre?.trim())
            .filter(Boolean) as string[],
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [tracks],
  );
  const visibleTracks = useMemo(() => {
    const query = songQuery.trim().toLowerCase();
    return tracks.filter(
      (track) =>
        (songGenre === "all" || track.genre === songGenre) &&
        (!query ||
          track.title.toLowerCase().includes(query) ||
          (track.genre || "").toLowerCase().includes(query) ||
          (track.description || "").toLowerCase().includes(query)),
    );
  }, [createAccessMode, songGenre, songQuery, tracks]);
  const filteredPlaylists = useMemo(() => {
    const query = playlistQuery.trim().toLowerCase();
    const matches = playlists.filter((playlist) => {
      const category = playlist.workspace_category ?? "released";
      return (
        (playlistCategory === "all" || category === playlistCategory) &&
        (!query ||
          playlist.title.toLowerCase().includes(query) ||
          PLAYLIST_WORKSPACE_CATEGORY_LABELS[category]
            .toLowerCase()
            .includes(query) ||
          (playlist.occasion || "").toLowerCase().includes(query) ||
          (playlist.description || "").toLowerCase().includes(query))
      );
    });
    return [...matches].sort((a, b) =>
      playlistSort === "title"
        ? a.title.localeCompare(b.title)
        : b.created_at.localeCompare(a.created_at),
    );
  }, [playlistCategory, playlistQuery, playlistSort, playlists]);
  const playlistCategories = useMemo(
    () =>
      PLAYLIST_WORKSPACE_CATEGORIES.map(
        (category) =>
          [
            category,
            playlists.filter(
              (playlist) =>
                (playlist.workspace_category ?? "released") === category,
            ).length,
          ] as const,
      ).filter(([, count]) => count > 0),
    [playlists],
  );
  const visiblePlaylists = filteredPlaylists.slice(0, visiblePlaylistCount);
  const publicPagePlaylists = playlists
    .filter(
      (playlist) =>
        playlist.is_published &&
        playlist.access_mode === "public" &&
        (!playlist.access_expires_at ||
          new Date(playlist.access_expires_at).getTime() > Date.now()) &&
        playlist.show_on_public_profile === true,
    )
    .sort(
      (a, b) =>
        (a.profile_display_order ?? 999) -
          (b.profile_display_order ?? 999) || a.title.localeCompare(b.title),
    );

  const updatePlaylistPublicDisplay = async (
    playlistId: string,
    shown: boolean,
  ) => {
    if (!user?.id) return;
    setPublicDisplayBusyId(playlistId);
    try {
      await publicMusicSetupService.setPlaylistShown(
        playlistId,
        user.id,
        shown,
      );
      if (shown) {
        await publicMusicSetupService.setPlaylistDisplayOrder(
          user.id,
          [...publicPagePlaylists.map((playlist) => playlist.id), playlistId],
        );
      }
      await queryClient.invalidateQueries({
        queryKey: ["playlists", user.id],
      });
      if (creatorProfile?.username) {
        await queryClient.invalidateQueries({
          queryKey: ["public-creator", creatorProfile.username],
        });
      }
      toast.success(
        shown
          ? "Playlist added to your public creator page."
          : "Playlist remains public by link but is hidden from your creator page.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Public display update failed.",
      );
    } finally {
      setPublicDisplayBusyId(null);
    }
  };

  const movePlaylistOnPublicPage = async (
    playlistId: string,
    nextPosition: number,
  ) => {
    if (!user?.id) return;
    const selectedPlaylist = publicPagePlaylists.find(
      (playlist) => playlist.id === playlistId,
    );
    if (!selectedPlaylist) return;
    const reordered = publicPagePlaylists.filter(
      (playlist) => playlist.id !== playlistId,
    );
    reordered.splice(nextPosition - 1, 0, selectedPlaylist);
    setPublicDisplayBusyId(playlistId);
    try {
      await publicMusicSetupService.setPlaylistDisplayOrder(
        user.id,
        reordered.map((playlist) => playlist.id),
      );
      await queryClient.invalidateQueries({
        queryKey: ["playlists", user.id],
      });
      if (creatorProfile?.username) {
        await queryClient.invalidateQueries({
          queryKey: ["public-creator", creatorProfile.username],
        });
      }
      toast.success(`Playlist moved to public position ${nextPosition}.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Playlist order update failed.",
      );
    } finally {
      setPublicDisplayBusyId(null);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!selected.length)
      return toast.error("Choose at least one published song from your Music Library.");
    const selectedTracks = tracks.filter((track) => selected.includes(track.id));
    const nonPublicTracks = selectedTracks.filter(
      (track) => track.visibility !== "public",
    );
    if (
      createAccessMode === "public" &&
      nonPublicTracks.length > 0 &&
      !window.confirm(
        `This public playlist includes ${nonPublicTracks.length} private or shareable song${nonPublicTracks.length === 1 ? "" : "s"}. People with playlist access may be able to hear those songs without making them public in your catalog. Continue?`,
      )
    )
      return;
    if (playlists.length >= creatorEntitlements.limits.playlists)
      return toast.error(`Your membership includes ${creatorEntitlements.limits.playlists} playlists. Upgrade or remove an existing playlist to continue.`);
    if (createAccessMode === "approved_listeners" && !canUseApprovedListeners)
      return toast.error("Approved listeners requires Creator Pro.");
    try {
      const playlist = await create.mutateAsync({
        title: String(form.get("title") || ""),
        description: String(form.get("description") || ""),
        occasion: String(form.get("occasion") || ""),
        trackIds: selected,
        access_mode: createAccessMode,
        workspace_category: createWorkspaceCategory,
        access_expires_at: createAccessExpiresAt
          ? new Date(createAccessExpiresAt).toISOString()
          : null,
        require_sign_in:
          createAccessMode === "approved_listeners" ||
          createAccessMode === "membership_only" ||
          createRequireSignIn,
      });
      if (!playlist?.slug)
        throw new Error(
          "Playlist published without a share link. Refresh and try again.",
        );
      if (playlistCover) {
        try {
          await replaceCover.mutateAsync({
            playlistId: playlist.id,
            file: playlistCover,
          });
        } catch (coverError) {
          toast.error(
            coverError instanceof Error
              ? `Playlist created, but its cover was not saved: ${coverError.message}`
              : "Playlist created, but its cover was not saved. Add it from Manage playlist.",
          );
        }
      }
      setCreatedSlug(playlist.slug);
      setSelected([]);
      setPlaylistCover(null);
      setSongQuery("");
      setCreateAccessMode("unlisted");
      setCreateWorkspaceCategory("released");
      setCreateRequireSignIn(false);
      setCreateAccessExpiresAt("");
      setShowCreate(false);
      formElement.reset();
      toast.success("Playlist published. Your share link is ready.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create playlist",
      );
    }
  };
  const playlistPath = (slug: string) =>
    creatorProfile?.username
      ? `/artist/${creatorProfile.username}/playlist/${slug}`
      : `/playlist/${slug}`;
  const shareUrl = (slug: string) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}${playlistPath(slug)}`;
  const copy = async (slug: string) => {
    if (!slug)
      return toast.error("This playlist does not have a share link yet.");
    const url = shareUrl(slug);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement("textarea");
        input.value = url;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        if (!copied) throw new Error("Clipboard access was denied");
      }
      toast.success("Share link copied");
    } catch {
      window.prompt("Copy this playlist link:", url);
      toast.error(
        "Automatic copy was blocked. Copy the displayed link instead.",
      );
    }
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlaylist.mutateAsync(deleteTarget.id);
      if (createdSlug === deleteTarget.slug) setCreatedSlug(null);
      setDeleteTarget(null);
      toast.success(
        "Playlist deleted. Your uploaded songs are still in your music library.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete playlist",
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <WorkspacePageHeader
        eyebrow="Creator Studio"
        title="Playlist Workspace"
        description="Build public releases, private reviews, pitches, and listening experiences from songs already in your Music Library. Playlist access does not change a song's own visibility."
        status={<Badge variant="secondary">{playlists.length} total</Badge>}
        action={
          <Button onClick={() => setShowCreate((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />{" "}
            {showCreate ? "Close builder" : "New playlist"}
          </Button>
        }
      />
      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">Membership playlist allowance</p>
          <p className="text-muted-foreground">
            {playlists.length} of {creatorEntitlements.limits.playlists} playlists used
          </p>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {creatorEntitlements.limits.activePasswordPlaylists
            ? `${creatorEntitlements.limits.activePasswordPlaylists} active password links · maximum ${creatorEntitlements.limits.passwordExpiryDays}-day expiration`
            : "Password links require Creator Plus. Public and unlisted sharing remain available."}
          {canUseApprovedListeners ? " · Approved listeners and sign-in controls included" : " · Approved listeners require Creator Pro"}
        </p>
      </div>
      {!canUsePasswords ? <LockedFeatureCard title="Password-protected playlist links" description="Keep the option visible while learning how controlled preview links can support pitches, releases, and private reviews." requiredPlan="creator_plus" educationKey="playlist_password" compact /> : null}
      {!canUseApprovedListeners ? <LockedFeatureCard title="Approved-listener playlist access" description="Learn when recipient-level access is more appropriate than a public, unlisted, or password-protected link." requiredPlan="creator_pro" educationKey="playlist_approved_listeners" compact /> : null}

      {createdSlug && (
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <Check className="h-5 w-5 text-primary" /> Ready to send
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your new playlist link is ready to copy or preview.
            </p>
          </div>
          <Button onClick={() => copy(createdSlug)}>
            <Copy className="mr-2 h-4 w-4" /> Copy link
          </Button>
        </div>
      )}
      <div className="space-y-6">
        {showCreate ? (
          <form
            onSubmit={submit}
            className="rounded-2xl border border-primary/20 bg-card p-4 pb-20 shadow-lg shadow-primary/5 md:p-5"
          >
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Plus className="text-primary" /> Create a playlist
            </h2>
            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="title">Playlist title</Label>
                <Input
                  className="mt-2"
                  id="title"
                  name="title"
                  required
                  maxLength={120}
                  placeholder="Songs for the ride home"
                />
              </div>
              <div>
                <Label>Playlist category</Label>
                <Select
                  value={createWorkspaceCategory}
                  onValueChange={(value) =>
                    setCreateWorkspaceCategory(
                      value as PlaylistWorkspaceCategory,
                    )
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYLIST_WORKSPACE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {PLAYLIST_WORKSPACE_CATEGORY_LABELS[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">
                  Uses the same workspace organization as your Music Library.
                </p>
              </div>
              <div>
                <Label htmlFor="occasion">Playlist purpose</Label>
                <Select name="occasion">
                  <SelectTrigger className="mt-2" id="occasion">
                    <SelectValue placeholder="Choose a playlist type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYLIST_PURPOSES.map((purpose) => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <Label>Who can open this playlist?</Label>

                <Select
                  value={createAccessMode}
                  onValueChange={(value) => {
                    const next = value as PlaylistAccessMode;
                    setCreateAccessMode(next);
                    setSelected([]);

                    if (next === "approved_listeners") {
                      setCreateRequireSignIn(true);
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="public">
                      Public - listed and open to everyone
                    </SelectItem>
                    <SelectItem value="unlisted">
                      Shareable - hidden, only people with the link
                    </SelectItem>
                    <SelectItem value="password" disabled={!canUsePasswords}>
                      Password protected{canUsePasswords ? "" : " - Creator Plus"}
                    </SelectItem>
                    <SelectItem value="approved_listeners" disabled={!canUseApprovedListeners}>
                      Approved listeners{canUseApprovedListeners ? " - invitation required" : " - Creator Pro"}
                    </SelectItem>
                  </SelectContent>
                </Select>

                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Every published song in your library appears below. Private and
                  shareable songs stay hidden from your public song catalog. VYBE
                  asks you to confirm before placing one in a public playlist.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="create-playlist-expiration">
                      Link expiration (optional)
                    </Label>

                    <Input
                      id="create-playlist-expiration"
                      className="mt-2"
                      type="datetime-local"
                      value={createAccessExpiresAt}
                      onChange={(event) =>
                        setCreateAccessExpiresAt(event.target.value)
                      }
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-border p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={
                        createAccessMode === "approved_listeners" ||
                        createRequireSignIn
                      }
                      disabled={createAccessMode === "approved_listeners"}
                      onChange={(event) =>
                        setCreateRequireSignIn(event.target.checked)
                      }
                    />
                    Require listeners to sign in
                  </label>
                </div>

                {createAccessMode === "approved_listeners" ? (
                  <p className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground">
                    Create the playlist first, then use Manage playlist to add
                    the exact listener email addresses.
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="description">A note to your listeners</Label>
                <Textarea
                  className="mt-2"
                  id="description"
                  name="description"
                  maxLength={600}
                  placeholder="Tell fans why you chose these songs."
                />
              </div>
              <div>
                <Label htmlFor="playlist-cover">
                  Playlist cover art (optional)
                </Label>
                <label
                  htmlFor="playlist-cover"
                  className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border p-4 transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {playlistCoverPreview ? (
                    <img
                      src={playlistCoverPreview}
                      alt="Selected playlist cover preview"
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {playlistCover ? playlistCover.name : "Choose cover art"}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      JPG, PNG, or WebP - up to 2MB
                    </span>
                  </span>
                </label>
                <Input
                  id="playlist-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > MAX_COVER_BYTES) {
                      toast.error("Playlist cover must be 2MB or smaller.");
                      event.target.value = "";
                      setPlaylistCover(null);
                      return;
                    }
                    setPlaylistCover(file);
                  }}
                />
              </div>
              <div>
                <Label>Choose songs in play order</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={songQuery}
                    onChange={(event) => setSongQuery(event.target.value)}
                    placeholder="Search your uploaded songs by title or genre"
                    className="pl-9"
                  />
                </div>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Select value={songGenre} onValueChange={setSongGenre}>
                    <SelectTrigger className="sm:w-56">
                      <SelectValue placeholder="All genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All genres</SelectItem>
                      {songGenres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>{selected.length} selected</span>
                    {!!selected.length && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected([])}
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-2 max-h-80 space-y-2 overflow-auto rounded-2xl border border-border p-2">
                  {isLoading ? (
                    <Loader2 className="m-6 animate-spin" />
                  ) : visibleTracks.length ? (
                    visibleTracks.map((track) => {
                      const checked = selected.includes(track.id);
                      const isPublished = track.status === "published";
                      return (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/5"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
                            {checked ? selected.indexOf(track.id) + 1 : "-"}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {track.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {track.genre || "No genre"} -{" "}
                              {isPublished ? "Published" : "Draft"}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                              <span className="rounded-full bg-muted px-2 py-0.5">
                                {
                                  TRACK_WORKSPACE_CATEGORY_LABELS[
                                    track.workspace_category ??
                                      "work_in_progress"
                                  ]
                                }
                              </span>
                              <span className="rounded-full bg-muted px-2 py-0.5">
                                {
                                  TRACK_PRODUCTION_STAGE_LABELS[
                                    track.production_stage ?? "idea"
                                  ]
                                }
                              </span>
                              <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
                                {track.visibility === "unlisted" ? "Shareable" : track.visibility}
                              </span>
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDuration(track.duration_sec)}
                          </span>
                          {isPublished ? (
                            <Button
                              type="button"
                              size="sm"
                              variant={checked ? "secondary" : "outline"}
                              onClick={() =>
                                setSelected((current) =>
                                  checked
                                    ? current.filter((id) => id !== track.id)
                                    : [...current, track.id],
                                )
                              }
                            >
                              {checked ? (
                                <>
                                  <Check className="mr-2 h-4 w-4" /> Added -
                                  Remove
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" /> Add to
                                  playlist
                                </>
                              )}
                            </Button>
                          ) : null}
                        </div>
                      );
                    })
                  ) : tracks.length ? (
                    <p className="p-5 text-sm text-muted-foreground">
                      No songs match "{songQuery}" and the selected genre. Clear
                      the search or choose All genres.
                    </p>
                  ) : (
                    <div className="p-5 text-sm text-muted-foreground">
                      <p>
                        A playlist needs at least one published song. Upload
                        music first, choose Published, then return here.
                      </p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="mt-4"
                      >
                        <Link to="/music/upload">
                          <Upload className="mr-2 h-4 w-4" /> Upload your first
                          song
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <Button
                disabled={
                  create.isPending || replaceCover.isPending || !selected.length
                }
                size="lg"
                className="fixed bottom-20 right-4 z-40 bg-gradient-brand text-white shadow-elevated md:bottom-6 md:right-8"
              >
                {create.isPending || replaceCover.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ListMusic className="mr-2 h-4 w-4" />
                )}{" "}
                Publish and get link
              </Button>
            </div>
          </form>
        ) : null}
        <section>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-semibold">Your playlists</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {playlists.length}{" "}
                {playlists.length === 1 ? "playlist" : "playlists"} in this
                workspace Â· {publicPagePlaylists.length} shown on your public page
              </p>
            </div>
            {creatorProfile?.username ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  window.open(
                    `/artist/${encodeURIComponent(creatorProfile.username!)}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview my public creator page
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_10rem] lg:grid-cols-1 xl:grid-cols-[1fr_10rem]">
            <Input
              value={playlistQuery}
              onChange={(event) => {
                setPlaylistQuery(event.target.value);
                setVisiblePlaylistCount(8);
              }}
              placeholder="Search playlist titles or types"
            />
            <Select
              value={playlistSort}
              onValueChange={(value) =>
                setPlaylistSort(value as typeof playlistSort)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {playlistCategories.length ? (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              <Button
                size="sm"
                variant={playlistCategory === "all" ? "default" : "outline"}
                onClick={() => {
                  setPlaylistCategory("all");
                  setVisiblePlaylistCount(8);
                }}
              >
                All {playlists.length}
              </Button>
              {playlistCategories.map(([category, count]) => (
                <Button
                  key={category}
                  size="sm"
                  className="shrink-0"
                  variant={
                    playlistCategory === category ? "default" : "outline"
                  }
                  onClick={() => {
                    setPlaylistCategory(category);
                    setVisiblePlaylistCount(8);
                  }}
                >
                  {PLAYLIST_WORKSPACE_CATEGORY_LABELS[category]} {count}
                </Button>
              ))}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visiblePlaylists.length ? (
              visiblePlaylists.map((playlist) => (
                <article
                  key={playlist.id}
                  className="group flex min-w-0 overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="relative w-24 shrink-0 overflow-hidden bg-gradient-to-br from-primary/25 via-muted to-background sm:w-28">
                    {playlist.cover_url ? (
                      <img
                        src={playlist.cover_url}
                        alt={`${playlist.title} cover`}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <ListMusic className="h-8 w-8 text-primary/70" />
                      </span>
                    )}
                    <Badge className="absolute left-2 top-2 h-6 gap-1 bg-background/90 px-2 text-[10px] text-foreground backdrop-blur">
                      {playlist.access_mode === "public" ? (
                        <Globe2 className="h-3 w-3" />
                      ) : playlist.access_mode === "unlisted" ? (
                        <Link2 className="h-3 w-3" />
                      ) : (
                        <LockKeyhole className="h-3 w-3" />
                      )}
                      {playlist.access_mode === "approved_listeners"
                        ? "Approved listeners"
                        : playlist.access_mode === "membership_only"
                          ? "Members only"
                          : playlist.access_mode === "password"
                            ? "Password"
                            : playlist.access_mode === "public"
                              ? "Public"
                              : "Unlisted"}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1 p-3 sm:p-4">
                    <p className="truncate font-semibold">{playlist.title}</p>
                    <div className="mt-1 flex min-w-0 items-center gap-1.5">
                      <p className="truncate text-[11px] font-medium text-primary">
                        {
                          PLAYLIST_WORKSPACE_CATEGORY_LABELS[
                            playlist.workspace_category ?? "released"
                          ]
                        }
                      </p>
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px]"
                      >
                        {playlist.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {(playlist.trackIds ?? []).length}{" "}
                      {(playlist.trackIds ?? []).length === 1
                        ? "song"
                        : "songs"}{" "}
                      - {playlist.occasion || "Other"} -{" "}
                      {new Date(
                        playlist.updated_at || playlist.created_at,
                      ).toLocaleDateString()}
                    </p>
                    {playlist.is_published &&
                    playlist.access_mode === "public" &&
                    (!playlist.access_expires_at ||
                      new Date(playlist.access_expires_at).getTime() >
                        Date.now()) ? (
                      <div className="mt-3 rounded-xl border bg-muted/30 p-2.5">
                        <label className="flex items-center gap-2 text-xs font-medium">
                          <Checkbox
                            checked={playlist.show_on_public_profile === true}
                            disabled={publicDisplayBusyId === playlist.id}
                            onCheckedChange={(checked) =>
                              void updatePlaylistPublicDisplay(
                                playlist.id,
                                checked === true,
                              )
                            }
                          />
                          Show on public creator page
                        </label>
                        {playlist.show_on_public_profile === true ? (
                          <Select
                            value={String(
                              publicPagePlaylists.findIndex(
                                (item) => item.id === playlist.id,
                              ) + 1,
                            )}
                            disabled={publicDisplayBusyId === playlist.id}
                            onValueChange={(value) =>
                              void movePlaylistOnPublicPage(
                                playlist.id,
                                Number(value),
                              )
                            }
                          >
                            <SelectTrigger className="mt-2 h-8 w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {publicPagePlaylists.map((_, index) => (
                                <SelectItem
                                  key={index + 1}
                                  value={String(index + 1)}
                                >
                                  Public position {index + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            Public by link only Â· not promoted on your creator page
                          </p>
                        )}
                      </div>
                    ) : null}
                    <div className="mt-3 flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Copy playlist link"
                        title="Copy link"
                        onClick={() => copy(playlist.slug)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Preview playlist"
                        title="Preview"
                        onClick={() =>
                          window.open(
                            playlistPath(playlist.slug),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5"
                      >
                        <Link
                          to="/playlists/$playlistId"
                          params={{ playlistId: playlist.id }}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Manage
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete playlist"
                        title="Delete"
                        onClick={() => setDeleteTarget(playlist)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete playlist</span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            ) : playlists.length ? (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center text-muted-foreground">
                No playlists match that search.
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-7 text-center text-muted-foreground">
                Your first shareable playlist will appear here.
              </div>
            )}
            {visiblePlaylistCount < filteredPlaylists.length && (
              <Button
                variant="outline"
                className="w-full md:col-span-2 xl:col-span-3"
                onClick={() => setVisiblePlaylistCount((value) => value + 8)}
              >
                Load 8 more playlists
              </Button>
            )}
          </div>
        </section>
      </div>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deletePlaylist.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the playlist and its share link. Your
              uploaded songs will remain in your music library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlaylist.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePlaylist.isPending}
              onClick={(event) => {
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deletePlaylist.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
