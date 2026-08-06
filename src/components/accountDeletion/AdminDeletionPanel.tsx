import { useState } from "react";
import {
  AlertTriangle,
  Database,
  FileAudio,
  Loader2,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  accountDeletionService,
  type DeletionPreview,
} from "@/services/accountDeletion/accountDeletionService";

interface AdminDeletionPanelProps {
  userId: string;
  email: string | null;
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function AdminDeletionPanel({
  userId,
  email,
}: AdminDeletionPanelProps) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [open, setOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function loadPreview() {
    setLoadingPreview(true);

    try {
      const result = await accountDeletionService.preview(userId);

      setPreview(result);
      setConfirmation("");
      setOpen(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load the account deletion preview.",
      );
    } finally {
      setLoadingPreview(false);
    }
  }

  async function executeDeletion() {
    if (!preview) {
      return;
    }

    const expectedEmail = preview.email?.trim().toLowerCase() ?? "";
    const enteredEmail = confirmation.trim().toLowerCase();

    if (!expectedEmail || enteredEmail !== expectedEmail) {
      toast.error("Type the exact account email address to continue.");
      return;
    }

    setDeleting(true);

    try {
      const result = await accountDeletionService.execute(
        preview.userId,
        confirmation,
      );

      if (result.status === "execution_disabled") {
        toast.info(
          "The deletion workflow passed validation, but permanent deletion is disabled by the local safety setting.",
        );
        return;
      }

      toast.success("The account was permanently deleted.");
      setOpen(false);

      window.setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The account could not be deleted.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const tableEntries = preview
    ? Object.entries(preview.tableCounts)
    : [];

  const storageEntries = preview
    ? Object.entries(preview.storageCounts)
    : [];

  const tableWarnings = preview?.warnings?.tables
    ? Object.entries(preview.warnings.tables)
    : [];

  const storageWarnings = preview?.warnings?.storage
    ? Object.entries(preview.warnings.storage)
    : [];

  const hasWarnings =
    tableWarnings.length > 0 ||
    storageWarnings.length > 0 ||
    Boolean(preview?.warnings?.profile);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loadingPreview}
        onClick={loadPreview}
      >
        {loadingPreview ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ShieldAlert className="mr-2 h-4 w-4" />
        )}

        {loadingPreview ? "Loading preview..." : "Deletion preview"}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!deleting) {
            setOpen(nextOpen);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Account deletion review</DialogTitle>

            <DialogDescription>
              Review all known account records and Storage objects before
              continuing. No permanent deletion occurs while the local safety
              setting remains disabled.
            </DialogDescription>
          </DialogHeader>

          {preview ? (
            <div className="space-y-6">
              <section className="rounded-xl border bg-muted/20 p-4">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">
                      {preview.displayName || "Unnamed account"}
                    </p>

                    <p className="break-all text-sm text-muted-foreground">
                      {preview.email || email || "No email available"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {preview.roles.length ? (
                      preview.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {formatLabel(role)}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">No role assigned</Badge>
                    )}
                  </div>
                </div>

                {preview.blockedReason ? (
                  <div className="mt-4 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

                    <p className="text-sm text-destructive">
                      {preview.blockedReason}
                    </p>
                  </div>
                ) : null}
              </section>

              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-xl border p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />

                    <div>
                      <h3 className="font-semibold">Database records</h3>
                      <p className="text-xs text-muted-foreground">
                        Records connected to this account
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {tableEntries.map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {formatLabel(name)}
                        </span>

                        <span className="min-w-8 text-right text-sm font-semibold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <FileAudio className="h-5 w-5 text-primary" />

                    <div>
                      <h3 className="font-semibold">Storage objects</h3>
                      <p className="text-xs text-muted-foreground">
                        Files located under this account ID
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {storageEntries.map(([name, count]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-4 border-b py-2 last:border-b-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {formatLabel(name)}
                        </span>

                        <span className="min-w-8 text-right text-sm font-semibold">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Total detected objects
                    </span>

                    <span className="text-sm font-semibold">
                      {preview.totalObjects}
                    </span>
                  </div>
                </section>
              </div>

              {hasWarnings ? (
                <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

                    <div className="min-w-0 space-y-3">
                      <div>
                        <h3 className="font-semibold">Review warnings</h3>

                        <p className="text-sm text-muted-foreground">
                          Permanent deletion should remain disabled until these
                          warnings are resolved.
                        </p>
                      </div>

                      {tableWarnings.map(([name, warning]) => (
                        <div key={`table-${name}`} className="text-sm">
                          <span className="font-medium">
                            {formatLabel(name)}:
                          </span>{" "}
                          <span className="break-words text-muted-foreground">
                            {warning}
                          </span>
                        </div>
                      ))}

                      {storageWarnings.map(([name, warning]) => (
                        <div key={`storage-${name}`} className="text-sm">
                          <span className="font-medium">
                            {formatLabel(name)}:
                          </span>{" "}
                          <span className="break-words text-muted-foreground">
                            {warning}
                          </span>
                        </div>
                      ))}

                      {preview.warnings?.profile ? (
                        <div className="text-sm">
                          <span className="font-medium">Profile:</span>{" "}
                          <span className="break-words text-muted-foreground">
                            {preview.warnings.profile}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}

              {!preview.blockedReason ? (
                <section className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                  <div className="flex gap-3">
                    <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-destructive">
                        Permanent deletion
                      </h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Type the exact account email address to confirm this
                        action.
                      </p>

                      <div className="mt-4 space-y-2">
                        <Label htmlFor={`delete-confirmation-${preview.userId}`}>
                          Account email
                        </Label>

                        <Input
                          id={`delete-confirmation-${preview.userId}`}
                          value={confirmation}
                          onChange={(event) =>
                            setConfirmation(event.target.value)
                          }
                          placeholder={preview.email || "Account email"}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setOpen(false)}
            >
              Close
            </Button>

            {preview && !preview.blockedReason ? (
              <Button
                type="button"
                variant="destructive"
                disabled={
                  deleting ||
                  confirmation.trim().toLowerCase() !==
                    (preview.email?.trim().toLowerCase() ?? "")
                }
                onClick={executeDeletion}
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}

                {deleting
                  ? "Processing..."
                  : "Permanently delete account"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}