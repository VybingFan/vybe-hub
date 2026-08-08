import { useState } from "react";
import { KeyRound, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureMediaService } from "@/services/media/secureMediaService";

export function PlaylistPasswordManager({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);

  async function save() {
    if (password.length < 8) return toast.error("Use at least 8 characters.");
    if (password !== confirmation) return toast.error("The passwords do not match.");
    setPending(true);
    try {
      await secureMediaService.setPlaylistPassword(slug, password);
      setPassword("");
      setConfirmation("");
      toast.success("Playlist password saved securely.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the password.");
    } finally {
      setPending(false);
    }
  }

  async function clear() {
    setPending(true);
    try {
      await secureMediaService.clearPlaylistPassword(slug);
      setPassword("");
      setConfirmation("");
      toast.success("Playlist password removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 font-medium">
        <KeyRound className="h-4 w-4" /> Playlist password
      </div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Share the normal playlist link and provide this password separately. VYBE stores only a
        secure password hash.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="playlist-password">New password</Label>
          <Input
            id="playlist-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="playlist-password-confirmation">Confirm password</Label>
          <Input
            id="playlist-password-confirmation"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            className="mt-2"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || !password || !confirmation}
          onClick={() => void save()}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          Save password
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => void clear()}>
          <Trash2 className="mr-2 h-4 w-4" /> Remove password
        </Button>
      </div>
    </div>
  );
}
