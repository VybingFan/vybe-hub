-- Partner-testable playlist sharing: creators publish one link; anyone with it can listen.
CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '',
  occasion text NOT NULL DEFAULT '',
  slug text NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.playlist_tracks (
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  PRIMARY KEY (playlist_id, track_id),
  UNIQUE (playlist_id, position)
);

CREATE INDEX playlists_creator_idx ON public.playlists (creator_id);
CREATE INDEX playlist_tracks_playlist_idx ON public.playlist_tracks (playlist_id, position);

GRANT SELECT ON public.playlists, public.playlist_tracks, public.tracks, public.creator_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.playlists, public.playlist_tracks TO authenticated;
GRANT ALL ON public.playlists, public.playlist_tracks TO service_role;

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published playlists are link-viewable"
  ON public.playlists FOR SELECT TO anon, authenticated
  USING (is_published OR creator_id = auth.uid());
CREATE POLICY "Creators manage own playlists"
  ON public.playlists FOR ALL TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid() AND public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Published playlist tracks are link-viewable"
  ON public.playlist_tracks FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.id = playlist_id AND (p.is_published OR p.creator_id = auth.uid())
  ));
CREATE POLICY "Creators manage own playlist tracks"
  ON public.playlist_tracks FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.creator_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.playlists p WHERE p.id = playlist_id AND p.creator_id = auth.uid()
  ));

CREATE POLICY "Published playlist audio metadata is public"
  ON public.tracks FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.playlist_tracks pt
    JOIN public.playlists p ON p.id = pt.playlist_id
    WHERE pt.track_id = tracks.id AND p.is_published
  ));

CREATE POLICY "Published playlist creators are public"
  ON public.creator_profiles FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.playlists p
    WHERE p.creator_id = creator_profiles.user_id AND p.is_published
  ));

-- Allows an anonymous shared-page visitor to request short-lived URLs only for
-- audio and covers that are actually included in a published playlist.
CREATE POLICY "Published playlist media can be signed"
  ON storage.objects FOR SELECT TO anon
  USING (
    (bucket_id = 'music-audio' AND EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.playlist_tracks pt ON pt.track_id = t.id
      JOIN public.playlists p ON p.id = pt.playlist_id
      WHERE t.audio_url = name AND p.is_published
    ))
    OR
    (bucket_id = 'music-covers' AND EXISTS (
      SELECT 1 FROM public.tracks t
      JOIN public.playlist_tracks pt ON pt.track_id = t.id
      JOIN public.playlists p ON p.id = pt.playlist_id
      WHERE t.cover_url = name AND p.is_published
    ))
  );

CREATE TRIGGER playlists_set_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
