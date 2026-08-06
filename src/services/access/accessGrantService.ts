import { supabase } from "@/integrations/supabase/client";

export interface PlaylistAccessGrant {
  id: string;
  playlist_id: string;
  email_normalized: string | null;
  expires_at: string | null;
  max_plays: number | null;
  play_count: number;
  revoked_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CreatePlaylistAccessGrantInput {
  playlistId: string;
  email: string;
  expiresAt?: string | null;
  maxPlays?: number | null;
}

interface QueryError {
  message: string;
}

interface QueryResult<T> {
  data: T | null;
  error: QueryError | null;
}

interface QueryBuilder<T> {
  select(columns?: string): QueryBuilder<T>;
  insert(values: Record<string, unknown>): QueryBuilder<T>;
  update(values: Record<string, unknown>): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  eq(column: string, value: string): QueryBuilder<T>;
  is(column: string, value: null): QueryBuilder<T>;
  order(
    column: string,
    options?: {
      ascending?: boolean;
    },
  ): Promise<QueryResult<T[]>>;
  single(): Promise<QueryResult<T>>;
}

interface AccessGrantClient {
  from<T>(table: string): QueryBuilder<T>;
}

const client = supabase as unknown as AccessGrantClient;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateInput(input: CreatePlaylistAccessGrantInput) {
  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("Enter the listener’s email address.");
  }

  if (!email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  if (
    input.maxPlays !== undefined &&
    input.maxPlays !== null &&
    (!Number.isInteger(input.maxPlays) || input.maxPlays < 1)
  ) {
    throw new Error("Maximum plays must be a whole number greater than zero.");
  }

  return {
    email,
    expiresAt: input.expiresAt || null,
    maxPlays: input.maxPlays ?? null,
  };
}

export const accessGrantService = {
  async listForPlaylist(
    playlistId: string,
  ): Promise<PlaylistAccessGrant[]> {
    const { data, error } = await client
      .from<PlaylistAccessGrant>("playlist_access_grants")
      .select("*")
      .eq("playlist_id", playlistId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async create(
    userId: string,
    input: CreatePlaylistAccessGrantInput,
  ): Promise<PlaylistAccessGrant> {
    const validated = validateInput(input);

    const { data, error } = await client
      .from<PlaylistAccessGrant>("playlist_access_grants")
      .insert({
        playlist_id: input.playlistId,
        email_normalized: validated.email,
        expires_at: validated.expiresAt,
        max_plays: validated.maxPlays,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error) {
      if (
        error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("unique")
      ) {
        throw new Error("This listener already has an invitation.");
      }

      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("The listener invitation could not be created.");
    }

    return data;
  },

  async revoke(grantId: string): Promise<void> {
    const { error } = await client
      .from<PlaylistAccessGrant>("playlist_access_grants")
      .update({
        revoked_at: new Date().toISOString(),
      })
      .eq("id", grantId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }
  },

  async restore(grantId: string): Promise<void> {
    const { error } = await client
      .from<PlaylistAccessGrant>("playlist_access_grants")
      .update({
        revoked_at: null,
      })
      .eq("id", grantId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }
  },

  async remove(grantId: string): Promise<void> {
    const { error } = await client
      .from<PlaylistAccessGrant>("playlist_access_grants")
      .delete()
      .eq("id", grantId)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }
  },
};