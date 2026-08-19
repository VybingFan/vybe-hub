-- V24.46A1: Play Creator Focus Foundation
-- Expands the existing V24.33 game-pack release unit without replacing Music Play.

ALTER TABLE public.play_game_packs
  ADD COLUMN focus_scope text NOT NULL DEFAULT 'legacy'
    CHECK (focus_scope IN ('legacy', 'single_focus', 'cross_focus')),
  ADD COLUMN creator_focus text
    CHECK (creator_focus IS NULL OR creator_focus IN (
      'music', 'film', 'acting', 'comedy', 'theater', 'writing', 'dance', 'podcasting', 'visual_art'
    )),
  ADD COLUMN topic text NOT NULL DEFAULT '' CHECK (char_length(topic) <= 120),
  ADD COLUMN game_style text NOT NULL DEFAULT 'choice' CHECK (game_style IN (
    'choice', 'match', 'clue_reveal', 'daily_prompt',
    'true_or_made_up', 'fact_or_myth', 'real_or_made_up',
    'three_clue', 'progressive_clue', 'speed_round',
    'timeline', 'origin_challenge', 'story_reveal',
    'connection_chain', 'missing_link', 'multi_select',
    'preference', 'supporter_choice', 'open_response', 'vybe_switch'
  )),
  ADD COLUMN artwork_url text,
  ADD COLUMN discovery_url text,
  ADD COLUMN featured boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT play_game_packs_focus_scope_consistency CHECK (
    (focus_scope = 'legacy' AND creator_focus IS NULL)
    OR (focus_scope = 'single_focus' AND creator_focus IS NOT NULL)
    OR (focus_scope = 'cross_focus' AND creator_focus IS NULL)
  );

ALTER TABLE public.play_game_packs DISABLE TRIGGER play_game_pack_capture_revision;

UPDATE public.play_game_packs
SET game_style = CASE game_type
  WHEN 'vybe_match' THEN 'match'
  WHEN 'hidden_gems' THEN 'clue_reveal'
  WHEN 'daily_vybe' THEN 'daily_prompt'
  ELSE 'choice'
END
WHERE focus_scope = 'legacy';

ALTER TABLE public.play_game_packs ENABLE TRIGGER play_game_pack_capture_revision;

CREATE INDEX play_game_packs_focus_release_idx
  ON public.play_game_packs(focus_scope, creator_focus, status, featured, published_at DESC);

CREATE INDEX play_game_packs_topic_idx
  ON public.play_game_packs(creator_focus, topic, updated_at DESC);

CREATE OR REPLACE FUNCTION public.save_play_game_pack_v24_46a1(
  _id uuid,
  _pack_key text,
  _game_type text,
  _title text,
  _description text DEFAULT '',
  _genre text DEFAULT 'Mixed VYBE',
  _focus_scope text DEFAULT 'legacy',
  _creator_focus text DEFAULT NULL,
  _topic text DEFAULT '',
  _game_style text DEFAULT 'choice',
  _artwork_url text DEFAULT NULL,
  _discovery_url text DEFAULT NULL,
  _featured boolean DEFAULT false,
  _visibility text DEFAULT 'public',
  _scheduled_start_at timestamptz DEFAULT NULL,
  _scheduled_end_at timestamptz DEFAULT NULL
)
RETURNS public.play_game_packs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id uuid := auth.uid();
  saved public.play_game_packs;
BEGIN
  IF actor_id IS NULL OR NOT public.has_admin_permission(actor_id, 'admin.content.moderate') THEN
    RAISE EXCEPTION 'Content Moderator permission is required';
  END IF;

  IF _game_type NOT IN ('beat_blitz', 'vybe_match', 'hidden_gems', 'daily_vybe') THEN
    RAISE EXCEPTION 'Unsupported Play game type';
  END IF;

  IF _focus_scope NOT IN ('legacy', 'single_focus', 'cross_focus') THEN
    RAISE EXCEPTION 'Unsupported Play focus scope';
  END IF;

  IF _focus_scope = 'single_focus' AND _creator_focus IS NULL THEN
    RAISE EXCEPTION 'A single-focus game pack requires a Creator Focus';
  END IF;

  IF _focus_scope IN ('legacy', 'cross_focus') AND _creator_focus IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy and cross-focus game packs cannot store a single Creator Focus';
  END IF;

  IF _creator_focus IS NOT NULL AND _creator_focus NOT IN (
    'music', 'film', 'acting', 'comedy', 'theater', 'writing', 'dance', 'podcasting', 'visual_art'
  ) THEN
    RAISE EXCEPTION 'Unsupported Creator Focus';
  END IF;

  IF _game_style NOT IN (
    'choice', 'match', 'clue_reveal', 'daily_prompt',
    'true_or_made_up', 'fact_or_myth', 'real_or_made_up',
    'three_clue', 'progressive_clue', 'speed_round',
    'timeline', 'origin_challenge', 'story_reveal',
    'connection_chain', 'missing_link', 'multi_select',
    'preference', 'supporter_choice', 'open_response', 'vybe_switch'
  ) THEN
    RAISE EXCEPTION 'Unsupported Play game style';
  END IF;

  IF _id IS NULL THEN
    INSERT INTO public.play_game_packs (
      pack_key, game_type, title, description, genre,
      focus_scope, creator_focus, topic, game_style,
      artwork_url, discovery_url, featured,
      visibility, scheduled_start_at, scheduled_end_at,
      created_by, updated_by
    ) VALUES (
      lower(trim(_pack_key)), _game_type, trim(_title), trim(coalesce(_description, '')),
      trim(coalesce(_genre, 'Mixed VYBE')),
      _focus_scope, _creator_focus, trim(coalesce(_topic, '')), _game_style,
      nullif(trim(coalesce(_artwork_url, '')), ''),
      nullif(trim(coalesce(_discovery_url, '')), ''),
      coalesce(_featured, false),
      _visibility, _scheduled_start_at, _scheduled_end_at,
      actor_id, actor_id
    ) RETURNING * INTO saved;
  ELSE
    UPDATE public.play_game_packs SET
      pack_key = lower(trim(_pack_key)),
      game_type = _game_type,
      title = trim(_title),
      description = trim(coalesce(_description, '')),
      genre = trim(coalesce(_genre, 'Mixed VYBE')),
      focus_scope = _focus_scope,
      creator_focus = _creator_focus,
      topic = trim(coalesce(_topic, '')),
      game_style = _game_style,
      artwork_url = nullif(trim(coalesce(_artwork_url, '')), ''),
      discovery_url = nullif(trim(coalesce(_discovery_url, '')), ''),
      featured = coalesce(_featured, false),
      visibility = _visibility,
      scheduled_start_at = _scheduled_start_at,
      scheduled_end_at = _scheduled_end_at
    WHERE id = _id
    RETURNING * INTO saved;

    IF saved.id IS NULL THEN
      RAISE EXCEPTION 'Play game pack was not found';
    END IF;
  END IF;

  RETURN saved;
END;
$$;

REVOKE ALL ON FUNCTION public.save_play_game_pack_v24_46a1(
  uuid, text, text, text, text, text, text, text, text, text, text, text, boolean, text, timestamptz, timestamptz
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_play_game_pack_v24_46a1(
  uuid, text, text, text, text, text, text, text, text, text, text, text, boolean, text, timestamptz, timestamptz
) TO authenticated;
