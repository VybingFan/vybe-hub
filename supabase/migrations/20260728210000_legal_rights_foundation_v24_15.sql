-- V24.15: versioned policy acceptance, music rights certification, and
-- copyright-report intake. Policy copy remains subject to attorney review.

CREATE TABLE public.user_policy_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_key text NOT NULL,
  policy_version text NOT NULL,
  acceptance_source text NOT NULL DEFAULT 'signup',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, policy_key, policy_version)
);

ALTER TABLE public.user_policy_acceptances ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.user_policy_acceptances TO authenticated;
GRANT ALL ON public.user_policy_acceptances TO service_role;

CREATE POLICY "Users view own policy acceptances"
  ON public.user_policy_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users record own current policy acceptance"
  ON public.user_policy_acceptances FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND policy_key IN ('terms', 'privacy', 'community_guidelines', 'copyright_policy')
    AND policy_version = '2026-07-28-v1'
    AND acceptance_source IN ('existing_user_gate', 'signup')
  );

ALTER TABLE public.tracks
  ADD COLUMN rights_basis text NOT NULL DEFAULT 'entirely_original',
  ADD COLUMN rights_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN rights_policy_version text,
  ADD COLUMN rights_confirmed_at timestamptz;

ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_rights_basis_allowed CHECK (
    rights_basis IN (
      'entirely_original',
      'licensed_beat',
      'collaboration_permission',
      'cover_song',
      'contains_samples',
      'public_domain',
      'other_licensed'
    )
  );

-- Preserve existing published content without representing it as newly certified.
UPDATE public.tracks
SET
  rights_confirmed = true,
  rights_policy_version = 'legacy-pre-v24.15',
  rights_confirmed_at = created_at
WHERE status = 'published';

ALTER TABLE public.tracks
  ADD CONSTRAINT tracks_published_rights_confirmed CHECK (
    status <> 'published' OR (
      rights_confirmed
      AND rights_policy_version IS NOT NULL
      AND rights_confirmed_at IS NOT NULL
    )
  );

CREATE TABLE public.copyright_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name text NOT NULL CHECK (char_length(reporter_name) BETWEEN 2 AND 160),
  reporter_email text NOT NULL CHECK (char_length(reporter_email) BETWEEN 5 AND 320),
  rights_owner_name text NOT NULL CHECK (char_length(rights_owner_name) BETWEEN 2 AND 200),
  content_url text NOT NULL CHECK (
    char_length(content_url) BETWEEN 8 AND 2000
    AND content_url ~* '^https?://([a-z0-9-]+\.)?vybewithvybe\.com(/|$)'
  ),
  original_work_description text NOT NULL CHECK (
    char_length(original_work_description) BETWEEN 20 AND 5000
  ),
  good_faith_statement boolean NOT NULL CHECK (good_faith_statement),
  accuracy_statement boolean NOT NULL CHECK (accuracy_statement),
  signature text NOT NULL CHECK (char_length(signature) BETWEEN 2 AND 200),
  status text NOT NULL DEFAULT 'received' CHECK (
    status IN ('received', 'reviewing', 'actioned', 'rejected', 'counter_notice')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes text NOT NULL DEFAULT ''
);

ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.copyright_reports TO anon, authenticated;
GRANT SELECT, UPDATE ON public.copyright_reports TO authenticated;
GRANT ALL ON public.copyright_reports TO service_role;

CREATE POLICY "Anyone may submit a copyright report"
  ON public.copyright_reports FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'received'
    AND reviewed_at IS NULL
    AND reviewed_by IS NULL
    AND internal_notes = ''
  );

CREATE POLICY "Admins manage copyright reports"
  ON public.copyright_reports FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  accepted_version text;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  accepted_version := NEW.raw_user_meta_data->>'legal_policy_version';
  IF accepted_version IS NOT NULL AND NEW.raw_user_meta_data->>'legal_accepted' = 'true' THEN
    INSERT INTO public.user_policy_acceptances (
      user_id, policy_key, policy_version, acceptance_source
    )
    VALUES
      (NEW.id, 'terms', accepted_version, 'signup'),
      (NEW.id, 'privacy', accepted_version, 'signup'),
      (NEW.id, 'community_guidelines', accepted_version, 'signup'),
      (NEW.id, 'copyright_policy', accepted_version, 'signup')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
