import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { accountDeletionService, type DeletionPreview } from "@/services/accountDeletion/accountDeletionService";

export function AdminDeletionPanel(props: { userId: string; email: string | null }) {
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadPreview() {
    setBusy(true);
    try {
      setPreview(await accountDeletionService.preview(props.userId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load deletion preview.");
    } finally {
      setBusy(false);
    }
  }

  async function execute() {
    if (!preview || confirm !== (preview.email || "")) {
      toast.error("Type the exact account email.");
      return;
    }
    setBusy(true);
    try {
      const result = await accountDeletionService.execute(preview.userId, confirm);
      if (result.status === "execution_disabled") {
        toast.info("Preview succeeded. Permanent execution is disabled by the local safety flag.");
      } else {
        toast.success("Account deleted.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" size="sm" disabled={busy} onClick={loadPreview}>
        <ShieldAlert className="mr-2 h-4 w-4" /> Deletion preview
      </Button>
      {preview ? (
        <Card className="border-destructive/40">
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="font-semibold">{preview.displayName || "Unnamed account"}</p>
              <p className="text-sm text-muted-foreground">{preview.email || "No email"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {preview.roles.map((role) => <Badge key={role}>{role}</Badge>)}
              </div>
            </div>
            {preview.blockedReason ? (
              <p className="text-sm font-medium text-destructive">{preview.blockedReason}</p>
            ) : (
              <>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  {Object.entries(preview.tableCounts).map(([name, count]) => (
                    <p key={name}>{name}: <strong>{count}</strong></p>
                  ))}
                  {Object.entries(preview.storageCounts).map(([name, count]) => (
                    <p key={name}>{name} files: <strong>{count}</strong></p>
                  ))}
                </div>
                <p className="text-sm">Type the exact email to confirm.</p>
                <Input value={confirm} onChange={(event) => setConfirm(event.target.value)} />
                <Button variant="destructive" disabled={busy || preview.protected} onClick={execute}>
                  <Trash2 className="mr-2 h-4 w-4" /> Permanently delete account
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
