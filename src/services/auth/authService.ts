import { supabase } from "@/integrations/supabase/client";
import type { AppRole, SelectableRole } from "@/features/auth/roles";

const REMEMBER_KEY = "vybe:remember";
const SESSION_ALIVE_KEY = "vybe:session-alive";

export interface Profile {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  appearance_theme: "system" | "vybe-dark" | "vybe-light" | "midnight-blue" | "warm-stage";
}

export const authService = {
  async signIn(email: string, password: string, rememberMe: boolean) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    persistRememberPreference(rememberMe);
    return data;
  },

  async signUp(email: string, password: string, displayName: string, legalPolicyVersion: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/redirect`,
        data: {
          display_name: displayName,
          legal_accepted: true,
          legal_policy_version: legalPolicyVersion,
        },
      },
    });
    if (error) throw error;
    persistRememberPreference(true);
    return {
      userId: data.user?.id ?? null,
      requiresEmailConfirmation: !data.session,
    };
  },

  async signOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REMEMBER_KEY);
      window.sessionStorage.removeItem(SESSION_ALIVE_KEY);
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async updateDisplayName(userId: string, displayName: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId);
    if (error) throw error;
  },

  async updateAppearanceTheme(userId: string, appearanceTheme: Profile["appearance_theme"]) {
    const { error } = await supabase
      .from("profiles")
      .update({ appearance_theme: appearanceTheme })
      .eq("id", userId);
    if (error) throw error;
  },

  async fetchProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, avatar_url, bio, appearance_theme")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async fetchRoles(userId: string): Promise<AppRole[]> {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((r) => r.role as AppRole);
  },

  async assignInitialRole(userId: string, role: SelectableRole) {
    if (!userId) throw new Error("Not signed in");
    // Generated database types are refreshed after the business-role migration is remote.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).rpc("select_initial_role", { _role: role });
    if (error) throw error;
  },
};

/**
 * "Remember me" semantics:
 * - When checked (default), the Supabase session persists in localStorage as normal.
 * - When unchecked, we sign out at the start of any new browser session
 *   (a marker in sessionStorage keeps the current tab session alive).
 */
export function persistRememberPreference(remember: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_KEY, remember ? "true" : "false");
  window.sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
}

export function shouldSignOutOnBoot(): boolean {
  if (typeof window === "undefined") return false;
  const remember = window.localStorage.getItem(REMEMBER_KEY);
  const alive = window.sessionStorage.getItem(SESSION_ALIVE_KEY);
  return remember === "false" && !alive;
}

export function markSessionAlive() {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(SESSION_ALIVE_KEY, "1");
  }
}
