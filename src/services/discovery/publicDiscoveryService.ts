import { supabase } from "@/integrations/supabase/client";
import { isCreatorDiscoveryReady } from "@/features/discovery/readiness";

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
  primary_artist_name: string;
  featured_artist_names: string[];
  genre: string;
  description: string;
  cover_url: string | null;
  audio_url: string;
  playback_mode: string;
  duration_sec: number;
  created_at: string;
  creator: DiscoveryCreator | null;
}

export interface DiscoveryArtistCredit {
  name: string;
  songCount: number;
  uploaderCount: number;
}

function storageObjectPath(bucket: string, value: string | null) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.split("?")[0].replace(/^\/+/, "");
  try {
    const url = new URL(value);
    const markers = [
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
    ];
    const marker = markers.find((candidate) => url.pathname.includes(candidate));
    if (!marker) return null;
    return decodeURIComponent(url.pathname.slice(url.pathname.indexOf(marker) + marker.length));
  } catch {
    return null;
  }
}

async function signedCover(path: string | null) {
  const objectPath = storageObjectPath("music-covers", path);
  if (!objectPath) return null;
  const { data } = await supabase.storage
    .from("music-covers")
    .createSignedUrl(objectPath, 60 * 60);
  return data?.signedUrl ?? null;
}

async function signedAudio(bucket: "music-audio" | "music-previews", path: string | null) {
  const objectPath = storageObjectPath(bucket, path);
  if (!objectPath) return "";
  const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 60 * 3);
  return data?.signedUrl ?? "";
}

async function signedAvatar(path: string | null, fallback: string | null) {
  const objectPath = storageObjectPath("avatars", path);
  if (!objectPath) return fallback;
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(objectPath, 60 * 60);
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
      .select(
        "id,creator_id,title,primary_artist_name,featured_artist_names,genre,description,cover_url,audio_url,playback_mode,preview_audio_path,duration_sec,created_at",
      )
      .eq("status", "published")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(40);

    if (query) {
      creatorsQuery = creatorsQuery.or(
        `artist_name.ilike.${term},display_name.ilike.${term},genre.ilike.${term},location.ilike.${term},bio.ilike.${term}`,
      );
      tracksQuery = tracksQuery.or(
        `title.ilike.${term},artist_credit_search.ilike.${term},genre.ilike.${term},description.ilike.${term}`,
      );
    }

    const [
      { data: creatorRows, error: creatorError },
      { data: trackRows, error: trackError },
    ] = await Promise.all([creatorsQuery, tracksQuery]);
    if (creatorError) throw creatorError;
    if (trackError) throw trackError;

    const directCreatorCandidates = (creatorRows ?? []).filter(
      (creator): creator is typeof creator & { username: string } =>
        Boolean(creator.username),
    );
    const directCreatorIds = directCreatorCandidates.map(
      (creator) => creator.user_id,
    );
    const { data: discoveryMusicRows, error: discoveryMusicError } =
      directCreatorIds.length
        ? await supabase
            .from("tracks")
            .select("creator_id")
            .in("creator_id", directCreatorIds)
            .eq("status", "published")
            .eq("visibility", "public")
        : { data: [], error: null };
    if (discoveryMusicError) throw discoveryMusicError;
    const discoveryMusicCreatorIds = new Set(
      (discoveryMusicRows ?? []).map((track) => track.creator_id),
    );
    const directCreators = directCreatorCandidates.filter((creator) =>
      isCreatorDiscoveryReady(
        creator,
        discoveryMusicCreatorIds.has(creator.user_id),
      ),
    );
    const creatorIds = [
      ...new Set((trackRows ?? []).map((track) => track.creator_id)),
    ];
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
        (creator): creator is typeof creator & { username: string } =>
          Boolean(creator.username) && isCreatorDiscoveryReady(creator, true),
      );
    }

    const allCreators = [...directCreators, ...relatedCreators].filter(
      (creator, index, rows) =>
        rows.findIndex((item) => item.user_id === creator.user_id) === index,
    );
    const creatorMap = new Map(
      allCreators.map((creator) => [creator.user_id, creator]),
    );
    const creators = await Promise.all(
      allCreators.map(async (creator) => ({
        ...creator,
        avatar_url: await signedAvatar(creator.avatar_path, creator.avatar_url),
      })),
    );
    const tracks = await Promise.all(
      (trackRows ?? []).map(async (track) => {
        const playableAudio =
          track.playback_mode === "preview"
            ? await signedAudio("music-previews", track.preview_audio_path)
            : track.playback_mode === "none" || track.playback_mode === "approved_listeners"
              ? ""
              : await signedAudio("music-audio", track.audio_url);
        return {
          ...track,
          audio_url: playableAudio,
          cover_url: await signedCover(track.cover_url),
          creator: creatorMap.get(track.creator_id) ?? null,
        };
      }),
    );

    const visibleTracks = tracks.filter((track) => track.creator?.username);
    const normalizedQuery = query.toLowerCase();
    const artistCredits = new Map<
      string,
      { name: string; tracks: Set<string>; uploaders: Set<string> }
    >();
    for (const track of visibleTracks) {
      const names = [
        track.primary_artist_name,
        ...track.featured_artist_names,
      ].filter(Boolean);
      for (const name of names) {
        if (normalizedQuery && !name.toLowerCase().includes(normalizedQuery))
          continue;
        const key = name.toLowerCase();
        const current = artistCredits.get(key) ?? {
          name,
          tracks: new Set<string>(),
          uploaders: new Set<string>(),
        };
        current.tracks.add(track.id);
        current.uploaders.add(track.creator_id);
        artistCredits.set(key, current);
      }
    }

    const artists: DiscoveryArtistCredit[] = [...artistCredits.values()]
      .map((artist) => ({
        name: artist.name,
        songCount: artist.tracks.size,
        uploaderCount: artist.uploaders.size,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { creators, artists, tracks: visibleTracks };
  },
};
