import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CreditCard,
  Crown,
  ExternalLink,
  LockKeyhole,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { WorkspacePageHeader } from "@/components/workspace/WorkspacePageHeader";
import { WorkspaceSection } from "@/components/workspace/WorkspaceSection";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { authService } from "@/services/auth/authService";
import { displayNameSchema, resetPasswordSchema } from "@/features/auth/roles";
import { playNotificationChime } from "@/lib/notificationSound";
import { useMembership } from "@/hooks/useMembership";
import { UsageMeter } from "@/components/membership/UsageMeter";
import { supabase } from "@/integrations/supabase/client";
import { SelfServiceDeletionCard } from "@/components/accountDeletion/SelfServiceDeletionCard";
import { MembershipAdjustmentNotice } from "@/components/membership/MembershipAdjustmentNotice";
import { ContentContinuityCard } from "@/components/membership/ContentContinuityCard";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});
function SettingsPage() {
  return (
    <RoleGuard allow={["creator", "supporter", "business", "admin"]}>
      <SettingsContent />
    </RoleGuard>
  );
}

const preferenceItems = [
  ["email", "VYBE product updates"],
  ["followers", "New follower activity"],
  ["playlists", "Playlist activity"],
  ["merch", "Merch interest"],
  ["sound", "Play a chime for new activity while VYBE is open"],
] as const;

function SettingsContent() {
  const { profile, user, primaryRole, refresh } = useUser();
  const { signOut, updatePassword } = useAuth();
  const { data: creator } = useCreatorProfile(user?.id);
  const { data: membership } = useMembership(
    primaryRole === "creator" || primaryRole === "admin",
  );
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [isOpeningBilling, setIsOpeningBilling] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    email: true,
    followers: true,
    playlists: true,
    merch: true,
    sound: false,
  });

  useEffect(() => {
    setThemeState(
      window.localStorage.getItem("vybe:theme") === "light" ? "light" : "dark",
    );
    const saved = window.localStorage.getItem("vybe:preview-preferences");
    if (saved)
      setPreferences((current) => ({ ...current, ...JSON.parse(saved) }));
  }, []);
  const setTheme = (next: "dark" | "light") => {
    setThemeState(next);
    window.localStorage.setItem("vybe:theme", next);
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
  };
  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(
      new FormData(event.currentTarget).get("displayName") || "",
    );
    const parsed = displayNameSchema.safeParse(name);
    if (!parsed.success)
      return toast.error(
        parsed.error.issues[0]?.message || "Enter a display name",
      );
    try {
      await authService.updateDisplayName(user!.id, parsed.data);
      await refresh();
      toast.success("Account name updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update account",
      );
    }
  };
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    if (password !== String(data.get("confirmPassword") || ""))
      return toast.error("Passwords do not match");
    const parsed = resetPasswordSchema.safeParse({ password });
    if (!parsed.success)
      return toast.error(
        parsed.error.issues[0]?.message || "Password is not valid",
      );
    try {
      await updatePassword(parsed.data.password);
      form.reset();
      toast.success("Password updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update password",
      );
    }
  };
  const updatePreference = (key: string, checked: boolean) => {
    const next = { ...preferences, [key]: checked };
    setPreferences(next);
    window.localStorage.setItem(
      "vybe:preview-preferences",
      JSON.stringify(next),
    );
    if (key === "sound" && checked) playNotificationChime();
    toast.success("Notification preference saved on this device");
  };
  const openBillingPortal = async () => {
    setIsOpeningBilling(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in again to manage billing.");
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(
          result.error || "Billing management could not be opened.",
        );
      window.location.assign(result.url);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Billing management could not be opened.",
      );
      setIsOpeningBilling(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <WorkspacePageHeader
        title="Settings"
        description="Manage your account, membership, notifications, security, appearance, and account status."
      />
      <Tabs defaultValue="account" className="space-y-5">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto min-w-max justify-start">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account" className="space-y-4">
          <WorkspaceSection
            title="Account identity"
            description="Your login identity and role."
          >
            <form
              onSubmit={saveAccount}
              className="grid gap-4 p-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  defaultValue={profile?.display_name ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ""} readOnly />
              </div>
              <p className="text-sm text-muted-foreground">
                Role:{" "}
                <span className="capitalize text-foreground">
                  {primaryRole || "Member"}
                </span>
              </p>
              <div className="sm:text-right">
                <Button>Save account name</Button>
              </div>
            </form>
          </WorkspaceSection>
          {primaryRole === "creator" ? (
            <WorkspaceSection
              title="Creator profile"
              description="Manage the private setup or open the public page."
            >
              <div className="flex flex-wrap gap-2 p-4">
                <Button asChild variant="outline">
                  <Link to="/profile">
                    <UserRound className="mr-2 h-4 w-4" />
                    Profile & Discovery
                  </Link>
                </Button>
                {creator?.username ? (
                  <Button asChild variant="outline">
                    <a
                      href={`/artist/${creator.username}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View public page
                    </a>
                  </Button>
                ) : null}
              </div>
            </WorkspaceSection>
          ) : null}
        </TabsContent>

        <TabsContent value="membership">
          <WorkspaceSection
            title={
              membership?.plan_code === "founding_beta"
                ? "Founding Creator · Creator Pro Access"
                : membership?.recognition_code === "vybe_pioneer"
                  ? `${membership.public_name} · VYBE Pioneer`
                  : membership?.public_name ||
                    (primaryRole === "creator"
                      ? "Creator membership"
                      : "VYBE Member")
            }
            description={
              membership?.description || "Membership details will appear here."
            }
            action={<Crown className="h-5 w-5 text-primary" />}
          >
            <div className="space-y-5 p-4 sm:p-5">
              <MembershipAdjustmentNotice />
              <ContentContinuityCard />
              <div className="flex flex-wrap gap-2">
                {membership?.billing.customer_ref ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isOpeningBilling}
                    onClick={openBillingPortal}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isOpeningBilling ? "Opening…" : "Manage billing"}
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link to="/creator-memberships">Compare memberships</Link>
                </Button>
              </div>
              {membership ? (
                <>
                  <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2">
                    <UsageMeter
                      label="Songs in library"
                      used={membership.usage.uploaded_tracks}
                      limit={membership.limits.uploaded_tracks}
                    />
                    <UsageMeter
                      label="Published songs"
                      used={membership.usage.published_tracks}
                      limit={membership.limits.published_tracks}
                    />
                    <UsageMeter
                      label="Published playlists"
                      used={membership.usage.published_playlists}
                      limit={membership.limits.published_playlists}
                    />
                    <UsageMeter
                      label="Merch showcase"
                      used={membership.usage.merch_items}
                      limit={membership.limits.merch_items}
                    />
                    <UsageMeter
                      label="Active connections"
                      used={membership.usage.active_connections}
                      limit={membership.limits.active_connections}
                    />
                  </div>
                  <details className="rounded-xl border border-border/70">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                      Coming-soon allowances and downgrade information
                    </summary>
                    <div className="grid gap-2 border-t border-border/60 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                      <p>
                        AI assistance: {membership.future_allowances.ai_actions}{" "}
                        actions/month · Coming Soon
                      </p>
                      <p>
                        Video storage:{" "}
                        {membership.future_allowances.video_storage_minutes}{" "}
                        minutes · Coming Soon
                      </p>
                      <p>
                        Written posts:{" "}
                        {membership.future_allowances.written_posts} · Coming
                        Soon
                      </p>
                      <p>
                        Team members:{" "}
                        {membership.future_allowances.team_members} ·{" "}
                        {membership.future_allowances.team_members > 1
                          ? "Coming Soon"
                          : "Single owner"}
                      </p>
                      <p className="sm:col-span-2">
                        Paid-to-Free downgrades include a{" "}
                        {membership.downgrade.adjustment_period_days}-day
                        adjustment period with no automatic deletion.
                      </p>
                    </div>
                  </details>
                </>
              ) : null}
            </div>
          </WorkspaceSection>
        </TabsContent>

        <TabsContent value="notifications">
          <WorkspaceSection
            title="Notification preferences"
            description="In-app activity and optional sound work now; other delivery services are still being evaluated."
          >
            <div className="p-2">
              {preferenceItems.map(([key, label]) => (
                <div
                  key={key}
                  className="flex min-h-12 items-center justify-between gap-4 border-b border-border/60 px-3 py-2 last:border-0"
                >
                  <Label
                    htmlFor={`pref-${key}`}
                    className="text-sm font-normal"
                  >
                    {label}
                  </Label>
                  <Switch
                    id={`pref-${key}`}
                    checked={preferences[key]}
                    onCheckedChange={(checked) =>
                      updatePreference(key, checked)
                    }
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 border-t border-border/60 p-4 text-sm text-muted-foreground">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Phone and computer background alerts are not connected in the
                current release.
              </p>
            </div>
          </WorkspaceSection>
        </TabsContent>

        <TabsContent value="security">
          <WorkspaceSection title="Password and security">
            <div className="space-y-5 p-4 sm:p-5">
              <form
                onSubmit={changePassword}
                className="grid gap-4 sm:grid-cols-2"
              >
                <div className="space-y-2">
                  <Label>New password</Label>
                  <Input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm new password</Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    minLength={8}
                    required
                  />
                </div>
                <Button className="sm:col-span-2 sm:w-fit">
                  <LockKeyhole className="mr-2 h-4 w-4" />
                  Update password
                </Button>
              </form>
              <div className="border-t border-border/60 pt-4">
                <Button variant="outline" onClick={() => signOut()}>
                  Sign out
                </Button>
              </div>
            </div>
          </WorkspaceSection>
        </TabsContent>

        <TabsContent value="appearance">
          <WorkspaceSection
            title="Appearance"
            description="Choose the interface theme stored on this device."
          >
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </Button>
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </Button>
            </div>
          </WorkspaceSection>
        </TabsContent>

        <TabsContent value="danger">
          <WorkspaceSection
            title="Account deletion"
            description="Schedule permanent deletion or cancel it during the seven-day grace period."
            className="border-destructive/40"
          >
            <SelfServiceDeletionCard />
          </WorkspaceSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
