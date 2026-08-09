import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  accountDeletionService,
  type DeletionRequest,
} from "@/services/accountDeletion/accountDeletionService";

const REQUIRED_CONFIRMATION = "DELETE MY ACCOUNT";
function normalizeConfirmation(value: string) {
  return value
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

export function SelfServiceDeletionCard() {
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void accountDeletionService
      .getMine()
      .then(setRequest)
      .catch(() => undefined);
  }, []);

  async function requestDeletion() {
    if (normalizeConfirmation(confirm) !== REQUIRED_CONFIRMATION) {
      toast.error('Type "DELETE MY ACCOUNT" exactly.');
      return;
    }
    setBusy(true);
    try {
      const created = await accountDeletionService.requestMine();
      setRequest(created);
      setConfirm("");
      toast.success(
        "Account deletion scheduled. You have seven days to cancel.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not schedule deletion.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function cancelDeletion() {
    setBusy(true);
    try {
      await accountDeletionService.cancelMine();
      setRequest(null);
      toast.success(
        "Deletion request cancelled. Your account will remain active.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not cancel deletion.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <h3 className="font-semibold">Delete account</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Scheduling deletion starts a seven-day cancellation period. Your
            public profile and content may be hidden while deletion is pending.
            After processing, eligible profile data and uploaded files cannot be
            recovered. Limited legal, billing, rights, fraud, or safety records
            may be retained in restricted form.
          </p>
        </div>
      </div>
      {request ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold">Deletion is scheduled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can cancel until{" "}
                <strong className="text-foreground">
                  {new Date(request.scheduled_for).toLocaleString()}
                </strong>
                . After that time, recovery may no longer be possible.
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="mt-4"
            variant="outline"
            disabled={busy}
            onClick={cancelDeletion}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {busy ? "Cancelling..." : "Cancel deletion and keep account"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-border/70 p-4">
          <p className="text-sm">
            Type <strong>{REQUIRED_CONFIRMATION}</strong> to begin the seven-day
            cancellation period.
          </p>
          <Input
            value={confirm}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => setConfirm(event.target.value)}
            aria-label="Account deletion confirmation"
          />
          <Button
            type="button"
            variant="destructive"
            disabled={busy}
            onClick={requestDeletion}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {busy ? "Scheduling..." : "Schedule account deletion"}
          </Button>
        </div>
      )}
    </div>
  );
}
