import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MailPlus,
  RotateCcw,
  ShieldOff,
  Trash2,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreatePlaylistAccessGrant,
  usePlaylistAccessGrants,
  useRemovePlaylistAccessGrant,
  useRestorePlaylistAccessGrant,
  useRevokePlaylistAccessGrant,
} from "@/hooks/usePlaylistAccessGrants";
import type { PlaylistAccessGrant } from "@/services/access/accessGrantService";

interface Props {
  playlistId: string;
  userId: string;
}

export function PlaylistAccessGrantManager({
  playlistId,
  userId,
}: Props) {
  const { data: grants = [], isLoading } =
    usePlaylistAccessGrants(playlistId);

  const createGrant =
    useCreatePlaylistAccessGrant(
      playlistId,
      userId,
    );

  const revokeGrant =
    useRevokePlaylistAccessGrant(playlistId);

  const restoreGrant =
    useRestorePlaylistAccessGrant(playlistId);

  const removeGrant =
    useRemovePlaylistAccessGrant(playlistId);

  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] =
    useState("");
  const [maxPlays, setMaxPlays] =
    useState("");

  const activeCount = useMemo(
    () =>
      grants.filter(
        (grant) =>
          !grant.revoked_at &&
          !isExpired(grant),
      ).length,
    [grants],
  );

  const submit = async (
    event: FormEvent,
  ) => {
    event.preventDefault();

    try {
      await createGrant.mutateAsync({
        email,
        expiresAt: expiresAt
          ? new Date(expiresAt).toISOString()
          : null,
        maxPlays: maxPlays
          ? Number(maxPlays)
          : null,
      });

      setEmail("");
      setExpiresAt("");
      setMaxPlays("");

      toast.success(
        "Approved listener added.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not add the listener.",
      );
    }
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <UsersRound className="h-5 w-5" />
            Approved listeners
          </div>

          <h2 className="mt-2 text-2xl font-semibold">
            Control who can listen
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Add the exact email address each
            listener uses for their VYBE account.
            Forwarding the playlist link will not
            transfer access to another account.
          </p>
        </div>

        <Badge variant="secondary">
          {activeCount} active
        </Badge>
      </div>

      <form
        onSubmit={submit}
        className="mt-7 grid gap-4 rounded-2xl border border-border/70 p-5 md:grid-cols-3"
      >
        <div className="md:col-span-3">
          <Label htmlFor="listener-email">
            Listener email
          </Label>

          <Input
            id="listener-email"
            className="mt-2"
            type="email"
            value={email}
            placeholder="listener@example.com"
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="listener-expiration">
            Access expiration
          </Label>

          <Input
            id="listener-expiration"
            className="mt-2"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) =>
              setExpiresAt(
                event.target.value,
              )
            }
          />
        </div>

        <div>
          <Label htmlFor="listener-max-plays">
            Maximum plays
          </Label>

          <Input
            id="listener-max-plays"
            className="mt-2"
            type="number"
            min={1}
            step={1}
            value={maxPlays}
            placeholder="Unlimited"
            onChange={(event) =>
              setMaxPlays(
                event.target.value,
              )
            }
          />
        </div>

        <div className="flex items-end">
          <Button
            className="w-full"
            disabled={
              createGrant.isPending ||
              !email.trim()
            }
          >
            {createGrant.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailPlus className="mr-2 h-4 w-4" />
            )}

            Add listener
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border/70 p-5 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading approved listeners…
          </div>
        ) : null}

        {!isLoading && !grants.length ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No approved listeners have been
              added yet.
            </CardContent>
          </Card>
        ) : null}

        {grants.map((grant) => (
          <GrantRow
            key={grant.id}
            grant={grant}
            busy={
              revokeGrant.isPending ||
              restoreGrant.isPending ||
              removeGrant.isPending
            }
            onRevoke={async () => {
              try {
                await revokeGrant.mutateAsync(
                  grant.id,
                );
                toast.success(
                  "Listener access revoked.",
                );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not revoke access.",
                );
              }
            }}
            onRestore={async () => {
              try {
                await restoreGrant.mutateAsync(
                  grant.id,
                );
                toast.success(
                  "Listener access restored.",
                );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not restore access.",
                );
              }
            }}
            onRemove={async () => {
              try {
                await removeGrant.mutateAsync(
                  grant.id,
                );
                toast.success(
                  "Listener removed.",
                );
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Could not remove the listener.",
                );
              }
            }}
          />
        ))}
      </div>
    </section>
  );
}

function GrantRow({
  grant,
  busy,
  onRevoke,
  onRestore,
  onRemove,
}: {
  grant: PlaylistAccessGrant;
  busy: boolean;
  onRevoke: () => Promise<void>;
  onRestore: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const expired = isExpired(grant);
  const revoked = !!grant.revoked_at;

  const status = revoked
    ? "revoked"
    : expired
      ? "expired"
      : "active";

  return (
    <Card>
      <CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
        <div className="min-w-0">
          <p className="truncate font-semibold">
            {grant.email_normalized ||
              "Invitation link"}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {grant.play_count} plays
            </span>

            <span>
              {grant.max_plays
                ? `${grant.max_plays} maximum`
                : "Unlimited plays"}
            </span>

            <span>
              {grant.expires_at
                ? `Expires ${new Date(
                    grant.expires_at,
                  ).toLocaleString()}`
                : "No expiration"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />

          {revoked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                void onRestore()
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || expired}
              onClick={() =>
                void onRevoke()
              }
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Revoke
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive"
            disabled={busy}
            aria-label="Remove listener"
            onClick={() => void onRemove()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "active" | "expired" | "revoked";
}) {
  if (status === "active") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }

  if (status === "expired") {
    return (
      <Badge
        variant="outline"
        className="gap-1"
      >
        <Clock3 className="h-3 w-3" />
        Expired
      </Badge>
    );
  }

  return (
    <Badge
      variant="destructive"
      className="gap-1"
    >
      <ShieldOff className="h-3 w-3" />
      Revoked
    </Badge>
  );
}

function isExpired(
  grant: PlaylistAccessGrant,
): boolean {
  return Boolean(
    grant.expires_at &&
      new Date(
        grant.expires_at,
      ).getTime() <= Date.now(),
  );
}