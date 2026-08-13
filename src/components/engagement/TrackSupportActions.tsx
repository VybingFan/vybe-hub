import { useEffect, useState } from "react";
import { BookmarkPlus, Heart, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getActiveIdentity } from "@/components/identity/IdentityModeBar";
import {
  savedMusicService,
  type SupporterMusicList,
} from "@/services/engagement/savedMusicService";
import { cn } from "@/lib/utils";

export function TrackSupportActions({ trackId }: { trackId: string }) {
  const [hearted, setHearted] = useState(false);
  const [lists, setLists] = useState<SupporterMusicList[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const load = async () => {
      const identity = getActiveIdentity();
      if (!identity || identity.identity_type !== "supporter") {
        setHearted(false);
        setLists([]);
        return;
      }
      try {
        const [isHearted, availableLists] = await Promise.all([
          savedMusicService.hearted(trackId),
          savedMusicService.lists(),
        ]);
        setHearted(isHearted);
        setLists(availableLists);
      } catch {
        setHearted(false);
      }
    };
    void load();
    window.addEventListener("vybe:identity-changed", load);
    return () => window.removeEventListener("vybe:identity-changed", load);
  }, [trackId]);

  const requireSupporter = () => {
    const identity = getActiveIdentity();
    if (!identity) {
      location.assign("/auth/sign-up");
      return false;
    }
    if (identity.identity_type !== "supporter") {
      toast.error("Switch to Supporter Mode to interact with music.");
      return false;
    }
    return true;
  };

  const toggleHeart = async () => {
    if (!requireSupporter()) return;
    setBusy(true);
    try {
      const next = await savedMusicService.toggleHeart(trackId, hearted);
      setHearted(next);
      toast.success(next ? "Song hearted." : "Heart removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this song.");
    } finally {
      setBusy(false);
    }
  };

  const openSave = async () => {
    if (!requireSupporter()) return;
    setBusy(true);
    try {
      let available = await savedMusicService.lists();
      if (!available.length) {
        await savedMusicService.ensureDefault();
        available = await savedMusicService.lists();
      }
      setLists(available);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open saved lists.");
    } finally {
      setBusy(false);
    }
  };

  const saveTo = async (list: SupporterMusicList) => {
    setBusy(true);
    try {
      await savedMusicService.saveTrack(list.id, trackId);
      toast.success(`Saved to ${list.name}.`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this song.");
    } finally {
      setBusy(false);
    }
  };

  const createAndSave = async () => {
    setBusy(true);
    try {
      const list = await savedMusicService.createList(newName);
      await savedMusicService.saveTrack(list.id, trackId);
      setNewName("");
      setLists((current) => [...current, list]);
      toast.success(`Created ${list.name} and saved this song.`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create this list.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          aria-pressed={hearted}
          onClick={() => void toggleHeart()}
          className={cn(hearted && "text-rose-500")}
        >
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Heart className={cn("mr-2 h-4 w-4", hearted && "fill-current")} />}
          {hearted ? "Hearted" : "Heart"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void openSave()}>
          <BookmarkPlus className="mr-2 h-4 w-4" /> Save
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save this song</DialogTitle>
            <DialogDescription>Choose a private list or create a new one.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {lists.map((list) => (
              <Button key={list.id} type="button" variant="outline" className="justify-start" disabled={busy} onClick={() => void saveTo(list)}>
                <BookmarkPlus className="mr-2 h-4 w-4" /> {list.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 border-t pt-4">
            <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="New list name" maxLength={80} />
            <Button type="button" size="icon" disabled={busy || !newName.trim()} onClick={() => void createAndSave()} aria-label="Create list and save">
              <Plus />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
