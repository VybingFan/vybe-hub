import { useEffect, useState } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { accountDeletionService, type DeletionRequest } from "@/services/accountDeletion/accountDeletionService";

export function SelfServiceDeletionCard() {
  const [request, setRequest] = useState<DeletionRequest | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void accountDeletionService.getMine().then(setRequest).catch(() => undefined);
  }, []);

  async function requestDeletion() {
    if (confirm !== "DELETE MY ACCOUNT") {
      toast.error('Type "DELETE MY ACCOUNT" exactly.');
      return;
    }
    setBusy(true);
    try {
      const created = await accountDeletionService.requestMine();
      setRequest(created);
      setConfirm("");
      toast.success("Account deletion scheduled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not schedule deletion.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletion() {
    setBusy(true);
    try {
      await accountDeletionService.cancelMine();
      setRequest(null);
      toast.success("Deletion request cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel deletion.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardContent className="space-y-4 p-6">
        <div className="flex gap-3">
          <AlertTriangle className="mt-1 h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold">Delete account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your public profile and content will be hidden when processing begins. Permanent deletion
              includes eligible profile data and uploaded files. Some legal, billing, rights, fraud, or
              safety records may be retained in restricted form.
            </p>
          </div>
        </div>

        {request ? (
          <div className="rounded-xl border p-4">
            <p className="font-medium">Deletion is scheduled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Scheduled for {new Date(request.scheduled_for).toLocaleString()}.
            </p>
            <Button className="mt-4" variant="outline" disabled={busy} onClick={cancelDeletion}>
              <RotateCcw className="mr-2 h-4 w-4" /> Cancel deletion request
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm">
              Type <strong>DELETE MY ACCOUNT</strong> to schedule deletion.
            </p>
            <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} />
            <Button variant="destructive" disabled={busy} onClick={requestDeletion}>
              <Trash2 className="mr-2 h-4 w-4" />
              {busy ? "Scheduling..." : "Schedule account deletion"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
