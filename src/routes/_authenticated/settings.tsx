import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Section } from "@/components/common/Section";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <RoleGuard allow={["creator", "supporter", "admin"]}>
      <SettingsContent />
    </RoleGuard>
  );
}

function SettingsContent() {
  const { profile, user } = useUser();
  const { signOut } = useAuth();
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </header>

      <Section title="Account">
        <Card className="border-border/50">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" defaultValue={profile?.display_name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email ?? ""} readOnly />
            </div>
            <Separator />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => signOut()}>
                Sign out
              </Button>
              <Button className="bg-gradient-brand text-primary-foreground">Save changes</Button>
            </div>
          </CardContent>
        </Card>
      </Section>
    </div>
  );
}
