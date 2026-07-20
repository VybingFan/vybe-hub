import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Section } from "@/components/common/Section";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MusicCard } from "@/components/music/MusicCard";
import { MusicTable } from "@/components/music/MusicTable";
import { useUser } from "@/hooks/useUser";
import { useCreatorTracks, useDeleteTrack, useUpdateTrack } from "@/hooks/useMusic";
import type { ContentStatus, Track } from "@/features/music/schema";

export const Route = createFileRoute("/_authenticated/music")({
  component: () => (
    <RoleGuard allow={["creator", "admin"]}>
      <MusicLibrary />
    </RoleGuard>
  ),
});

function MusicLibrary() {
  const openUpload = () => window.location.assign("/music/upload");
  const { user } = useUser();
  const { data: tracks = [], isLoading, error } = useCreatorTracks(user?.id);
  const del = useDeleteTrack(user?.id);
  const upd = useUpdateTrack(user?.id);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | ContentStatus>("all");
  const [sort, setSort] = useState<"newest" | "title" | "duration">("newest");

  const filtered = useMemo(() => {
    let list = tracks;
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(needle) || (t.genre || "").toLowerCase().includes(needle),
      );
    }
    const sorted = [...list];
    if (sort === "title") sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "duration") sorted.sort((a, b) => b.duration_sec - a.duration_sec);
    else sorted.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return sorted;
  }, [tracks, q, status, sort]);

  const onDelete = async (t: Track) => {
    try {
      await del.mutateAsync(t.id);
      toast.success("Track deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const onToggleFeatured = async (t: Track) => {
    try {
      await upd.mutateAsync({ id: t.id, patch: { is_featured: !t.is_featured } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const onEdit = async (t: Track) => {
    const next = t.status === "published" ? "draft" : "published";
    try {
      await upd.mutateAsync({ id: t.id, patch: { status: next } });
      toast.success(`Marked as ${next}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Section
        title="Music library"
        description="Manage every song you've uploaded to VYBE."
        action={
          <Button
            type="button"
            onClick={openUpload}
            className="bg-gradient-brand text-primary-foreground shadow-glow"
          >
            <Plus className="mr-2 h-4 w-4" /> Upload
          </Button>
        }
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title or genre"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="title">Title A–Z</SelectItem>
              <SelectItem value="duration">Longest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <ErrorState title="Couldn't load library" message={(error as Error).message} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tracks.length ? "No matches" : "No tracks yet"}
            description={
              tracks.length
                ? "Try a different search or filter."
                : "Upload your first song to get started."
            }
            action={
              tracks.length
                ? undefined
                : {
                    label: "Upload your first song",
                    onClick: openUpload,
                  }
            }
          />
        ) : (
          <Tabs defaultValue="grid">
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
            <TabsContent value="grid" className="mt-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map((t) => (
                  <MusicCard key={t.id} track={t} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="table" className="mt-4">
              <MusicTable
                tracks={filtered}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleFeatured={onToggleFeatured}
              />
            </TabsContent>
          </Tabs>
        )}
      </Section>
    </div>
  );
}
