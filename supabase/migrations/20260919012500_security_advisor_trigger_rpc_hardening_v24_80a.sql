-- VYBE V24.80A - security advisor trigger RPC hardening.
-- Trigger functions execute through their table triggers and do not need direct
-- PostgREST RPC execute privileges for anon/authenticated clients.

revoke execute on function public.apply_creator_music_rights_certification() from public, anon, authenticated;
revoke execute on function public.audit_business_pilot_change() from public, anon, authenticated;
revoke execute on function public.capture_creator_rights_onboarding_acceptance_v24_77a() from public, anon, authenticated;
revoke execute on function public.capture_play_content_revision_v24_32() from public, anon, authenticated;
revoke execute on function public.capture_play_game_pack_revision_v24_33() from public, anon, authenticated;
revoke execute on function public.enforce_commerce_membership_v24_41h1() from public, anon, authenticated;
revoke execute on function public.enforce_creator_epk_child_tier() from public, anon, authenticated;
revoke execute on function public.enforce_creator_epk_profile_tier() from public, anon, authenticated;
revoke execute on function public.enforce_creator_video_limit() from public, anon, authenticated;
revoke execute on function public.enforce_creator_video_membership_v24_42b2a2() from public, anon, authenticated;
revoke execute on function public.enforce_film_playlist_focus() from public, anon, authenticated;
revoke execute on function public.enforce_film_playlist_item_download_lock() from public, anon, authenticated;
revoke execute on function public.enforce_film_private_review_allowance() from public, anon, authenticated;
revoke execute on function public.enforce_film_project_allowance() from public, anon, authenticated;
revoke execute on function public.enforce_film_project_media_membership_v24_42b2a2() from public, anon, authenticated;
revoke execute on function public.enforce_film_watch_destination_allowance() from public, anon, authenticated;
revoke execute on function public.enforce_playlist_grant_membership_tier() from public, anon, authenticated;
revoke execute on function public.enforce_playlist_membership_tier() from public, anon, authenticated;
revoke execute on function public.enforce_profile_membership_v24_42b2a2() from public, anon, authenticated;
revoke execute on function public.enforce_social_discovery_post_activation() from public, anon, authenticated;
revoke execute on function public.enforce_track_workflow_membership_v24_42b2a2() from public, anon, authenticated;
revoke execute on function public.enqueue_new_track_for_rights_processing() from public, anon, authenticated;
revoke execute on function public.guard_commerce_product_seller_readiness_v24_41g2c() from public, anon, authenticated;
revoke execute on function public.guard_live_play_pack_item_edit_v24_33() from public, anon, authenticated;
revoke execute on function public.initialize_creator_primary_focus() from public, anon, authenticated;
revoke execute on function public.manage_creator_membership_adjustment() from public, anon, authenticated;
revoke execute on function public.normalize_creator_support_request() from public, anon, authenticated;
revoke execute on function public.notify_admin_business_application() from public, anon, authenticated;
revoke execute on function public.notify_admin_partner_document() from public, anon, authenticated;
revoke execute on function public.notify_creator_comment_v24_46d1() from public, anon, authenticated;
revoke execute on function public.notify_creator_reaction_v24_46d1() from public, anon, authenticated;
revoke execute on function public.notify_creator_save_v24_46d1() from public, anon, authenticated;
revoke execute on function public.notify_supporters_creator_update_v24_62a() from public, anon, authenticated;
revoke execute on function public.protect_business_review_fields() from public, anon, authenticated;
revoke execute on function public.queue_copyright_report_for_admin_review() from public, anon, authenticated;
revoke execute on function public.validate_film_project_media() from public, anon, authenticated;
revoke execute on function public.vybe_enforce_written_work_limit() from public, anon, authenticated;

alter function public.creator_plan_rank(text) set search_path = public;
alter function public.creator_continuity_limit(text, text) set search_path = public;
