import { useAuthContext } from "@/providers/AuthProvider";

/** Auth actions + session state. */
export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    assignInitialRole,
  } = useAuthContext();
  return {
    isAuthenticated,
    isLoading,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    assignInitialRole,
  };
}
