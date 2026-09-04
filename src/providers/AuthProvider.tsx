import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  authService,
  markSessionAlive,
  shouldSignOutOnBoot,
  type Profile,
} from "@/services/auth/authService";
import type { AppRole, SelectableRole } from "@/features/auth/roles";
import type { CreatorRightsProtectionAcceptance } from "@/constants/creatorRightsProtection";
import { operationsSessionService } from "@/services/admin/operationsSessionService";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    legalPolicyVersion: string,
    signupRole?: SelectableRole,
    creatorRightsProtection?: CreatorRightsProtectionAcceptance,
  ) => Promise<{ userId: string | null; requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  assignInitialRole: (role: SelectableRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserContext = useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      setRoles([]);
      return;
    }
    try {
      const [p, r] = await Promise.all([
        authService.fetchProfile(uid),
        authService.fetchRoles(uid),
      ]);
      setProfile(p);
      setRoles(r);
    } catch (err) {
      console.error("Failed to load user context", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Listener FIRST — synchronous state updates only, defer async work
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRoles([]);
      } else if (newSession?.user) {
        setTimeout(() => loadUserContext(newSession.user.id), 0);
      }
    });

    // THEN check for existing session, honoring "Remember me"
    (async () => {
      if (shouldSignOutOnBoot()) {
        await supabase.auth.signOut();
      }
      markSessionAlive();
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadUserContext(data.session.user.id);
      setIsLoading(false);
    })();

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadUserContext]);

  const refresh = useCallback(async () => {
    if (user) await loadUserContext(user.id);
  }, [user, loadUserContext]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      roles,
      isLoading,
      isAuthenticated: !!user,
      hasRole: (role) => roles.includes(role),
      hasAnyRole: (r) => r.some((role) => roles.includes(role)),
      refresh,
      signIn: async (email, password, rememberMe) => {
        await authService.signIn(email, password, rememberMe);
      },
      signUp: async (
        email,
        password,
        displayName,
        legalPolicyVersion,
        signupRole,
        creatorRightsProtection,
      ) => {
        return authService.signUp(
          email,
          password,
          displayName,
          legalPolicyVersion,
          signupRole,
          creatorRightsProtection,
        );
      },
      signOut: async () => {
        await operationsSessionService.end().catch(() => undefined);
        await authService.signOut();
      },
      sendPasswordReset: (email) => authService.sendPasswordReset(email),
      updatePassword: (password) => authService.updatePassword(password),
      assignInitialRole: async (role) => {
        if (!user) throw new Error("Not signed in");
        await authService.assignInitialRole(user.id, role);
        await loadUserContext(user.id);
      },
    }),
    [user, session, profile, roles, isLoading, refresh, loadUserContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
