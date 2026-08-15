import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "vybe:operations-session:v24.44b";

type StartResult = { session_id: string; expires_at: string; idle_timeout_minutes: number; mfa_required: boolean };
export type OperationsValidation = { valid: boolean; expires_at?: string; mfa_verified?: boolean; idle_timeout_minutes?: number };

async function rpc<T>(name: string, args?: Record<string, unknown>) {
  const { data, error } = await (supabase.rpc as any)(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const operationsSessionService = {
  getSessionId() { return window.sessionStorage.getItem(SESSION_KEY); },
  async start() {
    const result = await rpc<StartResult>("start_operations_session_v24_44b", { _user_agent: navigator.userAgent });
    window.sessionStorage.setItem(SESSION_KEY, result.session_id);
    return result;
  },
  async validate(): Promise<OperationsValidation> {
    const sessionId = this.getSessionId();
    if (!sessionId) return { valid: false };
    try {
      const result = await rpc<OperationsValidation>("validate_operations_session_v24_44b", { _session_id: sessionId });
      if (!result.valid) window.sessionStorage.removeItem(SESSION_KEY);
      return result;
    } catch {
      window.sessionStorage.removeItem(SESSION_KEY);
      return { valid: false };
    }
  },
  async end() {
    const sessionId = this.getSessionId();
    window.sessionStorage.removeItem(SESSION_KEY);
    if (sessionId) await rpc<void>("end_operations_session_v24_44b", { _session_id: sessionId });
  },
};

export function operationsHostUrl(path = "/operations/sign-in") {
  const configured = String(import.meta.env.VITE_OPERATIONS_HOST || "").trim();
  if (!configured || typeof window === "undefined") return path;
  const protocol = window.location.protocol;
  return `${protocol}//${configured}${path}`;
}

export function isAllowedOperationsHost() {
  const configured = String(import.meta.env.VITE_OPERATIONS_HOST || "").trim();
  return !configured || typeof window === "undefined" || window.location.host === configured;
}
