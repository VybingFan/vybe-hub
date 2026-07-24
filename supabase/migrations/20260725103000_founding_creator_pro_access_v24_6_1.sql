-- V24.6.1: Founding Creator carries Creator Pro access plus invitation-only recognition.

UPDATE public.creator_plan_definitions
SET
  description = 'Invitation-only Creator Pro access tied to an approved founding commitment.',
  uploaded_track_limit = 250,
  published_track_limit = 200,
  max_track_duration_sec = 1200,
  max_audio_bytes = 52428800,
  published_playlist_limit = 100,
  playlist_track_limit = 100,
  merch_item_limit = 50,
  active_connection_limit = 10000,
  written_post_limit = 250,
  video_storage_minutes = 180,
  ai_action_limit = 100,
  analytics_history_days = NULL,
  team_member_limit = 1,
  is_public = false,
  billing_state = 'invitation_only',
  updated_at = now()
WHERE plan_code = 'founding_beta';

