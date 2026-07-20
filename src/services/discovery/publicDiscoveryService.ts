import { supabase } from "@/integrations/supabase/client";

export interface DiscoveryCreator {
  user_id: string;
  username: string;
  artist_name: string;
  display_name: string;
  genre: string;
  genres: string[];
  location: string;
  bio: string;
  avatar_url: string | null;
  avatar_path: string | null;
}

export interface DiscoveryTrack {
  id: string;
  creator_id: string;
  title: string;
  genre: string;
  description: string;
  cover_url: string | null;
  creator: DiscoveryCreator | null;
}

async function signedCover(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("music-covers").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

async function signedAvatar(path: string | null, fallback: string | null) {
  if (!path) return fallback;
  const { data } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? fallback;
}

export const publicDiscoveryService = {
  async search(rawQuery: string) {
    const query = rawQuery
      .trim()
      .replace(/[(),.%*]/g, " ")
      .replace(/\s+/g, " ")
      .slice(0, 80);
    const term = `%${query}%`;

    let creatorsQuery = supabase
      .from("creator_profiles")
      .select(
        "user_id,username,artist_name,display_name,genre,genres,location,bio,avatar_url,avatar_path",
      )
      .not("username", "is", null)
      .limit(30);
    let tracksQuery = supabase
      .from("tracks")
      .select("id,creator_id,title,genre,description,cover_url")
      .eq("status", "published")
      .limit(40);

    if (query) {
      creatorsQuery = creatorsQuery.or(
        `artist_name.ilike.${term},display_name.ilike.${term},genre.ilike.${term},location.ilike.${term},bio.ilike.${term}`,
      );
      tracksQuery = tracksQuery.or(
        `title.ilike.${term},genre.ilike.${term},description.ilike.${term}`,
      );
    }

    const [{ data: creatorRows, error: creatorError }, { data: trackRows, error: trackError }] =
      await Promise.all([creatorsQuery, tracksQuery]);
    if (creatorError) throw creatorError;
    if (trackError) throw trackError;

    const directCreators = (creatorRows ?? []).filter(
      (creator): creator is typeof creator & { username: string } => Boolean(creator.username),
    );
    const creatorIds = [...new Set((trackRows ?? []).map((track) => track.creator_id))];
    const missingIds = creatorIds.filter(
      (id) => !directCreators.some((creator) => creator.user_id === id),
    );
    let relatedCreators: typeof directCreators = [];
    if (missingIds.length) {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          "user_id,username,artist_name,display_name,genre,genres,location,bio,avatar_url,avatar_path",
        )
        .in("user_id", missingIds)
        .not("username", "is", null);
      if (error) throw error;
      relatedCreators = (data ?? []).filter(
        (creator): creator is typeof creator & { username: string } => Boolean(creator.username),
      );
    }

    const creatorMap = new Map(
      [...directCreators, ...relatedCreators].map((creator) => [creator.user_id, creator]),
    );
    const creators = await Promise.all(
      directCreators.map(async (creator) => ({
        ...creator,
        avatar_url: await signedAvatar(creator.avatar_path, creator.avatar_url),
      })),
    );
    const tracks = await Promise.all(
      (trackRows ?? []).map(async (track) => ({
        ...track,
        cover_url: await signedCover(track.cover_url),
        creator: creatorMap.get(track.creator_id) ?? null,
      })),
    );

    return { creators, tracks: tracks.filter((track) => track.creator?.username) };
  },
};
