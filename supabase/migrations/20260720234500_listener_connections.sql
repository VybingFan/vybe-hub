CREATE TABLE public.listener_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  display_name text CHECK (display_name IS NULL OR char_length(display_name) <= 80),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 255),
  social_handle text CHECK (social_handle IS NULL OR char_length(social_handle) <= 120),
  message text CHECK (message IS NULL OR char_length(message) <= 500),
  consent_share boolean NOT NULL CHECK (consent_share = true),
  consent_updates boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX listener_connections_playlist_email_idx
  ON public.listener_connections (playlist_id, lower(email));
CREATE INDEX listener_connections_creator_time_idx
  ON public.listener_connections (creator_id, created_at DESC);

ALTER TABLE public.listener_connections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.listener_connections TO authenticated;
GRANT ALL ON public.listener_connections TO service_role;

CREATE POLICY "Creators read own listener connections"
  ON public.listener_connections FOR SELECT TO authenticated
  USING (creator_id = auth.uid());
CREATE POLICY "Creators update own listener connections"
  ON public.listener_connections FOR UPDATE TO authenticated
  USING (creator_id = auth.uid()) WITH CHECK (creator_id = auth.uid());

CREATE TRIGGER listener_connections_set_updated_at
  BEFORE UPDATE ON public.listener_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.submit_listener_connection(
  p_slug text,
  p_email text,
  p_display_name text DEFAULT NULL,
  p_social_handle text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_consent_share boolean DEFAULT false,
  p_consent_updates boolean DEFAULT false
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE target public.playlists%ROWTYPE;
BEGIN
  IF p_consent_share IS NOT TRUE
    OR char_length(trim(p_email)) NOT BETWEEN 5 AND 255
    OR trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
    OR char_length(COALESCE(p_display_name, '')) > 80
    OR char_length(COALESCE(p_social_handle, '')) > 120
    OR char_length(COALESCE(p_message, '')) > 500 THEN
    RETURN false;
  END IF;

  SELECT * INTO target FROM public.playlists
  WHERE slug = p_slug AND is_published = true;
  IF NOT FOUND THEN RETURN false; END IF;

  INSERT INTO public.listener_connections
    (creator_id, playlist_id, display_name, email, social_handle, message, consent_share, consent_updates)
  VALUES
    (target.creator_id, target.id, NULLIF(trim(p_display_name), ''), lower(trim(p_email)), NULLIF(trim(p_social_handle), ''), NULLIF(trim(p_message), ''), true, p_consent_updates)
  ON CONFLICT DO NOTHING;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_listener_connection(text, text, text, text, text, boolean, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_listener_connection(text, text, text, text, text, boolean, boolean) TO anon, authenticated;
