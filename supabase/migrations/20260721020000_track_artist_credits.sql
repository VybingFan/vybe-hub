-- V23.3: separate performing-artist credits from the uploading creator account.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE public.tracks
  ADD COLUMN primary_artist_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN featured_artist_names TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN artist_credit_search TEXT NOT NULL DEFAULT '';

ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_primary_artist_name_length
    CHECK (char_length(primary_artist_name) <= 160),
  ADD CONSTRAINT tracks_featured_artist_count
    CHECK (cardinality(featured_artist_names) <= 20);

UPDATE public.tracks t
SET primary_artist_name = COALESCE(NULLIF(cp.artist_name, ''), NULLIF(cp.display_name, ''), 'VYBE Artist')
FROM public.creator_profiles cp
WHERE cp.user_id = t.creator_id AND t.primary_artist_name = '';

CREATE OR REPLACE FUNCTION public.set_track_artist_credit_search()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.artist_credit_search = lower(trim(
    COALESCE(NEW.primary_artist_name, '') || ' ' ||
    COALESCE(array_to_string(NEW.featured_artist_names, ' '), '')
  ));
  RETURN NEW;
END;
$$;

CREATE TRIGGER tracks_set_artist_credit_search
  BEFORE INSERT OR UPDATE OF primary_artist_name, featured_artist_names ON public.tracks
  FOR EACH ROW EXECUTE FUNCTION public.set_track_artist_credit_search();

UPDATE public.tracks
SET artist_credit_search = lower(trim(
  COALESCE(primary_artist_name, '') || ' ' ||
  COALESCE(array_to_string(featured_artist_names, ' '), '')
));

CREATE INDEX tracks_primary_artist_search_idx
  ON public.tracks USING gin (primary_artist_name gin_trgm_ops);
CREATE INDEX tracks_artist_credit_search_idx
  ON public.tracks USING gin (artist_credit_search gin_trgm_ops);
CREATE INDEX tracks_featured_artists_idx
  ON public.tracks USING gin (featured_artist_names);
