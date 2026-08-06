import { supabase } from "@/integrations/supabase/client";

export interface DeletionRequest {
  id: string;
  user_id: string;
  request_type:
    | "self_service"
    | "administrator";
  status:
    | "pending"
    | "cancelled"
    | "processing"
    | "completed"
    | "failed";
  scheduled_for: string;
  reason: string | null;
}

export interface DeletionPreview {
  userId: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  protected: boolean;
  blockedReason: string | null;
  tableCounts: Record<string, number>;
  storageCounts: Record<string, number>;
  totalObjects: number;
  warnings?: {
    tables?: Record<string, string>;
    storage?: Record<string, string>;
    profile?: string | null;
  };
}

interface ApiResult {
  preview?: DeletionPreview;
  status?: string;
  warning?: string;
  error?: string;
  details?: Record<string, unknown>;
}

async function authHeaders() {
  const { data } =
    await supabase.auth.getSession();

  const token =
    data.session?.access_token;

  if (!token) {
    throw new Error(
      "Your session has expired. Sign in again.",
    );
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function readApiResponse(
  response: Response,
): Promise<ApiResult> {
  const contentType =
    response.headers.get(
      "content-type",
    ) ?? "";

  const body =
    await response.text();

  if (
    !contentType.includes(
      "application/json",
    )
  ) {
    const beginning = body
      .slice(0, 160)
      .replace(/\s+/g, " ")
      .trim();

    throw new Error(
      `Account deletion API returned ${response.status} ${response.statusText} instead of JSON. Response began with: ${beginning}`,
    );
  }

  let result: ApiResult;

  try {
    result = JSON.parse(
      body,
    ) as ApiResult;
  } catch {
    throw new Error(
      "The account deletion API returned malformed JSON.",
    );
  }

  if (!response.ok) {
    const details =
      result.details
        ? ` Details: ${JSON.stringify(
            result.details,
          )}`
        : "";

    throw new Error(
      `${result.error || "The account deletion request failed."}${details}`,
    );
  }

  return result;
}

export const accountDeletionService = {
  async getMine(): Promise<DeletionRequest | null> {
    const { data: auth } =
      await supabase.auth.getUser();

    if (!auth.user) {
      return null;
    }

    const { data, error } =
      await supabase
        .from(
          "account_deletion_requests",
        )
        .select("*")
        .eq(
          "user_id",
          auth.user.id,
        )
        .in("status", [
          "pending",
          "processing",
        ])
        .maybeSingle();

    if (error) {
      throw error;
    }

    return data as
      | DeletionRequest
      | null;
  },

  async requestMine(
    reason?: string,
  ): Promise<DeletionRequest> {
    const graceDays =
      Number(
        import.meta.env
          .VITE_ACCOUNT_DELETION_GRACE_DAYS ??
          7,
      );

    const { data, error } =
      await supabase.rpc(
        "request_my_account_deletion_v24_34",
        {
          _reason:
            reason?.trim() || null,
          _grace_days:
            Number.isFinite(
              graceDays,
            )
              ? graceDays
              : 7,
        },
      );

    if (error) {
      throw error;
    }

    return data as DeletionRequest;
  },

  async cancelMine(): Promise<void> {
    const { data, error } =
      await supabase.rpc(
        "cancel_my_account_deletion_v24_34",
      );

    if (error) {
      throw error;
    }

    if (data !== true) {
      throw new Error(
        "No pending deletion request was found.",
      );
    }
  },

  async preview(
    userId: string,
  ): Promise<DeletionPreview> {
    const response = await fetch(
      "/api/account-deletion",
      {
        method: "POST",
        headers:
          await authHeaders(),
        body: JSON.stringify({
          action: "preview",
          userId,
        }),
      },
    );

    const result =
      await readApiResponse(response);

    if (!result.preview) {
      throw new Error(
        "The server did not return an account deletion preview.",
      );
    }

    return result.preview;
  },

  async execute(
    userId: string,
    emailConfirmation: string,
  ) {
    const response = await fetch(
      "/api/account-deletion",
      {
        method: "POST",
        headers:
          await authHeaders(),
        body: JSON.stringify({
          action: "execute",
          userId,
          emailConfirmation,
        }),
      },
    );

    return readApiResponse(
      response,
    );
  },
};