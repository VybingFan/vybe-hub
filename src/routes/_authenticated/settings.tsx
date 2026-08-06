import { FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CreditCard,
  Crown,
  ExternalLink,
  LockKeyhole,
  Moon,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Section } from "@/components/common/Section";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

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
  const { data: membership } = useMembership(primaryRole === "creator" || primaryRole === "admin");
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
    setThemeState(window.localStorage.getItem("vybe:theme") === "light" ? "light" : "dark");
    const saved = window.localStorage.getItem("vybe:preview-preferences");
    if (saved) setPreferences((current) => ({ ...current, ...JSON.parse(saved) }));
  }, []);

  const setTheme = (next: "dark" | "light") => {
    setThemeState(next);
    window.localStorage.setItem("vybe:theme", next);
    document.documentElement.classList.toggle("light", next === "light");
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const saveAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get("displayName") || "");
    const parsed = displayNameSchema.safeParse(name);
    if (!parsed.success)
      return toast.error(parsed.error.issues[0]?.message || "Enter a display name");
    try {
      await authService.updateDisplayName(user!.id, parsed.data);
      await refresh();
      toast.success("Account name updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update account");
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
      return toast.error(parsed.error.issues[0]?.message || "Password is not valid");
    try {
      await updatePassword(parsed.data.password);
      form.reset();
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
    }
  };

  const updatePreference = (key: string, checked: boolean) => {
    const next = { ...preferences, [key]: checked };
    setPreferences(next);
    window.localStorage.setItem("vybe:preview-preferences", JSON.stringify(next));
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
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Billing management could not be opened.");
      }
      window.location.assign(result.url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Billing management could not be opened.",
      );
      setIsOpeningBilling(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, membership, security, and app experience.
        </p>
      </header>

      <Section title="Membership">
        <Card className="overflow-hidden border-primary/30 bg-gradient-hero">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Crown className="h-4 w-4" /> CURRENT MEMBERSHIP
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {membership?.plan_code === "founding_beta"
                    ? "Founding Creator · Creator Pro Access"
                    : membership?.recognition_code === "vybe_pioneer"
                      ? `${membership.public_name} · VYBE Pioneer`
                      : membership?.public_name ||
                        (primaryRole === "creator" ? "Creator membership" : "VYBE Member")}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {membership?.description || "Membership details will appear here."}
                </p>
                {membership?.recognition_code === "vybe_pioneer" ? (
                  <p className="mt-2 text-xs font-medium text-primary">
                    Early public paying-creator recognition
                  </p>
                ) : null}
              </div>
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
            </div>

            {membership ? (
              <>
                <div className="mt-6 grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-2">
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
                <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-4">
                  <p className="font-medium">Membership readiness</p>
                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      AI assistance: {membership.future_allowances.ai_actions} actions/month ·
                      Coming Soon
                    </p>
                    <p>
                      Video storage: {membership.future_allowances.video_storage_minutes} minutes ·
                      Coming Soon
                    </p>
                    <p>
                      Written creator posts: {membership.future_allowances.written_posts} · Coming
                      Soon
                    </p>
                    <p>
                      Team members: {membership.future_allowances.team_members} ·{" "}
                      {membership.future_allowances.team_members > 1
                        ? "Coming Soon"
                        : "Single owner"}
                    </p>
                  </div>
                  <p className="mt-4 text-xs leading-5 text-muted-foreground">
                    Stripe billing changes are applied only after a verified billing event.
                    Paid-to-Free downgrades include a {membership.downgrade.adjustment_period_days}
                    -day adjustment period with no automatic deletion.
                  </p>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </Section>

      <Section title="Appearance">
        <Card>
          <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              <Moon className="mr-2 h-4 w-4" /> Dark
            </Button>
            <Button
              type="button"
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              <Sun className="mr-2 h-4 w-4" /> Light
            </Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Account">
        <Card>
          <CardContent className="space-y-5 p-6">
            <form onSubmit={saveAccount} className="space-y-4">
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
                Role: <span className="capitalize text-foreground">{primaryRole || "Member"}</span>
              </p>
              <Button>Save account name</Button>
            </form>
            {primaryRole === "creator" && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline">
                    <Link to="/profile">
                      <UserRound className="mr-2 h-4 w-4" /> Edit creator profile
                    </Link>
                  </Button>
                  {creator?.username && (
                    <Button asChild variant="outline">
                      <a href={`/artist/${creator.username}`} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> View public page
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Section>

      <Section title="Password and security">
        <Card>
          <CardContent className="space-y-5 p-6">
            <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>New password</Label>
                <Input name="password" type="password" minLength={8} required />
              </div>
              <div className="space-y-2">
                <Label>Confirm new password</Label>
                <Input name="confirmPassword" type="password" minLength={8} required />
              </div>
              <Button className="sm:col-span-2 sm:w-fit">
                <LockKeyhole className="mr-2 h-4 w-4" /> Update password
              </Button>
            </form>
            <Separator />
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Notifications">
        <Card>
          <CardContent className="space-y-1 p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              In-app activity and the optional sound work now. Other preferences are saved on this
              device while delivery services are being evaluated.
            </p>
            {preferenceItems.map(([key, label]) => (
              <div
                key={key}
                className="flex items-center justify-between border-b border-border/60 py-3 last:border-0"
              >
                <Label htmlFor={`pref-${key}`}>{label}</Label>
                <Switch
                  id={`pref-${key}`}
                  checked={preferences[key]}
                  onCheckedChange={(checked) => updatePreference(key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="mt-4">
          <CardContent className="flex items-start justify-between gap-5 p-6">
            <div className="flex gap-3">
              <BellRing className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Phone and computer background alerts</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Not connected in the alpha. This will require device permission and a secure
                  push-delivery provider.
                </p>
              </div>
            </div>
            <Button disabled variant="outline">
              Coming later
            </Button>
          </CardContent>
        </Card>
      </Section>

      <Section title="Creator AI roadmap">
        <Card className="border-primary/20">
          <CardContent className="flex gap-4 p-6">
            <Sparkles className="mt-1 h-6 w-6 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">VYBE Creator Assistant — planned</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Planned assistance includes drafting bios and product descriptions, organizing
                releases and playlists, improving profile completeness, and guiding creators through
                available tools. Nothing will publish without creator review.
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Account management">
        <SelfServiceDeletionCard />
      </Section>
    </div>
  );
}
