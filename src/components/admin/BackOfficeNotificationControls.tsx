import { useCallback, useEffect, useState } from "react";
import { BellRing, BellOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  adminDeviceNotificationService,
  type AdminNotificationPreferences,
} from "@/services/admin/adminDeviceNotificationService";

export function BackOfficeNotificationControls() {
  const [prefs, setPrefs] = useState<AdminNotificationPreferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    adminDeviceNotificationService.permission(),
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setPrefs(await adminDeviceNotificationService.getPreferences());
      setPermission(adminDeviceNotificationService.permission());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load notification settings");
    }
  }, []);

  useEffect(() => void load(), [load]);

  async function enable() {
    setSaving(true);
    try {
      const result = await adminDeviceNotificationService.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        if (result === "denied") {
          toast.error("Notifications are blocked in this browser. Allow them in site settings to continue.");
        } else if (result === "unsupported") {
          toast.error("This browser does not support Back Office device notifications.");
        }
        return;
      }
      setPrefs(await adminDeviceNotificationService.updatePreferences({ enabled: true }));
      toast.success("Back Office device alerts enabled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enable notifications");
    } finally {
      setSaving(false);
    }
  }

  async function update(input: {
    enabled?: boolean;
    notifyAssigned?: boolean;
    notifyUrgent?: boolean;
    notifyOverdue?: boolean;
  }) {
    setSaving(true);
    try {
      setPrefs(await adminDeviceNotificationService.updatePreferences(input));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update notification settings");
    } finally {
      setSaving(false);
    }
  }

  const enabled = Boolean(prefs?.enabled && permission === "granted");

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {enabled ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            </span>
            <div>
              <p className="font-semibold">Back Office device alerts</p>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Receive focused alerts for your assigned, urgent, and overdue work while the
                Back Office app is running or minimized on this device.
              </p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Alerts never bypass the Operations authorization boundary.
              </p>
            </div>
          </div>

          {!enabled ? (
            <Button onClick={() => void enable()} disabled={saving || permission === "denied"}>
              <BellRing className="mr-2 h-4 w-4" />
              {permission === "denied" ? "Blocked in browser" : "Enable device alerts"}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => void update({ enabled: false })}
            >
              Turn off alerts
            </Button>
          )}
        </div>

        {prefs ? (
          <div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-3">
            <PreferenceToggle
              label="New assignments"
              checked={prefs.notify_assigned}
              disabled={saving || !prefs.enabled}
              onChange={(checked) => void update({ notifyAssigned: checked })}
            />
            <PreferenceToggle
              label="Urgent work"
              checked={prefs.notify_urgent}
              disabled={saving || !prefs.enabled}
              onChange={(checked) => void update({ notifyUrgent: checked })}
            />
            <PreferenceToggle
              label="Overdue work"
              checked={prefs.notify_overdue}
              disabled={saving || !prefs.enabled}
              onChange={(checked) => void update({ notifyOverdue: checked })}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PreferenceToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
