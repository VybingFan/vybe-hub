-- VYBE V24.31.2 Creator EPK relationship integrity hardening

BEGIN;

CREATE OR REPLACE FUNCTION public.validate_creator_epk_track_relationship_v24_31_2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.tracks t
    WHERE t.id = NEW.track_id
      AND t.creator_id = NEW.creator_id
  ) THEN
    RAISE EXCEPTION 'The selected track does not belong to this creator';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_creator_epk_track_relationship_v24_31_2() FROM PUBLIC;

DROP TRIGGER IF EXISTS validate_creator_audio_master_track_owner ON public.creator_audio_masters;
CREATE TRIGGER validate_creator_audio_master_track_owner
BEFORE INSERT OR UPDATE OF creator_id, track_id ON public.creator_audio_masters
FOR EACH ROW EXECUTE FUNCTION public.validate_creator_epk_track_relationship_v24_31_2();

DROP TRIGGER IF EXISTS validate_creator_track_credit_owner ON public.creator_track_credits;
CREATE TRIGGER validate_creator_track_credit_owner
BEFORE INSERT OR UPDATE OF creator_id, track_id ON public.creator_track_credits
FOR EACH ROW EXECUTE FUNCTION public.validate_creator_epk_track_relationship_v24_31_2();

DROP TRIGGER IF EXISTS validate_creator_epk_featured_track_owner ON public.creator_epk_featured_tracks;
CREATE TRIGGER validate_creator_epk_featured_track_owner
BEFORE INSERT OR UPDATE OF creator_id, track_id ON public.creator_epk_featured_tracks
FOR EACH ROW EXECUTE FUNCTION public.validate_creator_epk_track_relationship_v24_31_2();

CREATE OR REPLACE FUNCTION public.validate_creator_epk_highlight_asset_v24_31_2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.asset_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.creator_epk_assets a
    WHERE a.id = NEW.asset_id
      AND a.creator_id = NEW.creator_id
  ) THEN
    RAISE EXCEPTION 'The selected EPK asset does not belong to this creator';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_creator_epk_highlight_asset_v24_31_2() FROM PUBLIC;

DROP TRIGGER IF EXISTS validate_creator_epk_highlight_asset_owner ON public.creator_epk_press_highlights;
CREATE TRIGGER validate_creator_epk_highlight_asset_owner
BEFORE INSERT OR UPDATE OF creator_id, asset_id ON public.creator_epk_press_highlights
FOR EACH ROW EXECUTE FUNCTION public.validate_creator_epk_highlight_asset_v24_31_2();

COMMIT;
