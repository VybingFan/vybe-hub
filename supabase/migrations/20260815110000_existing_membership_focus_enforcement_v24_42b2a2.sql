-- VYBE V24.42B2A2 - enforce established membership and focus boundaries.
-- Existing content is preserved. Unmapped/newer capabilities are denied by default.
begin;

create or replace function public.creator_has_feature_v24_42b2a2(p_user_id uuid, p_feature text)
returns boolean language sql stable security definer set search_path=public as $$
  select case p_feature
    when 'profile.custom_cover' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'profile.multiple_genres' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'music.workflow' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'video.library' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'video.native_upload' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'film.project_media_review' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'commerce.prepare' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'creator_mode.browse' then public.creator_effective_plan(p_user_id) in ('creator_pro','creator_studio','founding_beta')
    else false
  end;
$$;

-- Public presentation must report the actual established plan. Founding remains
-- invitation-only but receives Creator Pro-equivalent capability checks.
create or replace function public.get_public_creator_plan(p_user_id uuid)
returns text language sql stable security definer set search_path=public as $$
  select case public.creator_effective_plan(p_user_id)
    when 'creator_plus' then 'creator_plus'
    when 'creator_pro' then 'creator_pro'
    when 'creator_studio' then 'creator_studio'
    when 'founding_beta' then 'founding_beta'
    else 'creator_free'
  end;
$$;

-- The authoritative membership catalog provides zero video minutes to Free.
update public.creator_plan_definitions set hosted_video_limit=0 where plan_code='creator_free';

create or replace function public.enforce_creator_video_membership_v24_42b2a2()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.creator_has_feature_v24_42b2a2(new.creator_id,'video.library') then
    if tg_op='UPDATE' and old.status='published' and new.status<>'published' then return new; end if;
    raise exception 'Video Library requires Creator Plus or higher.';
  end if;
  return new;
end; $$;
drop trigger if exists creator_video_membership_guard_v24_42b2a2 on public.creator_videos;
create trigger creator_video_membership_guard_v24_42b2a2 before insert or update on public.creator_videos
for each row execute function public.enforce_creator_video_membership_v24_42b2a2();

drop policy if exists videos_membership_feature_select_v24_42b2a2 on public.creator_videos;
create policy videos_membership_feature_select_v24_42b2a2 on public.creator_videos
as restrictive for select using (
  creator_id=auth.uid() or public.creator_has_feature_v24_42b2a2(creator_id,'video.library')
);

create or replace function public.enforce_track_workflow_membership_v24_42b2a2()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.creator_has_feature_v24_42b2a2(new.creator_id,'music.workflow') then
    if tg_op='INSERT' and (new.workspace_category<>'work_in_progress' or new.production_stage<>'recording') then
      raise exception 'Advanced music organization requires Creator Plus or higher.';
    end if;
    if tg_op='UPDATE' and (new.workspace_category is distinct from old.workspace_category or new.production_stage is distinct from old.production_stage) then
      raise exception 'Advanced music organization requires Creator Plus or higher.';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists track_workflow_membership_guard_v24_42b2a2 on public.tracks;
create trigger track_workflow_membership_guard_v24_42b2a2 before insert or update of workspace_category,production_stage on public.tracks
for each row execute function public.enforce_track_workflow_membership_v24_42b2a2();

create or replace function public.enforce_profile_membership_v24_42b2a2()
returns trigger language plpgsql security definer set search_path=public as $$
declare link_count integer; link_limit integer; effective_plan text;
begin
  effective_plan:=public.creator_effective_plan(new.user_id);
  link_limit:=case effective_plan when 'creator_studio' then 100 when 'creator_pro' then 25 when 'founding_beta' then 25 when 'creator_plus' then 5 else 1 end;
  if effective_plan='creator_free' then
    if tg_op='INSERT' and (new.cover_path is not null or nullif(new.cover_url,'') is not null) then raise exception 'Custom profile covers require Creator Plus or higher.'; end if;
    if tg_op='UPDATE' and (new.cover_path is distinct from old.cover_path or new.cover_url is distinct from old.cover_url) then raise exception 'Custom profile covers require Creator Plus or higher.'; end if;
    if coalesce(array_length(new.genres,1),0)>1 then raise exception 'Creator Free includes one public genre.'; end if;
  end if;
  link_count :=
    (case when nullif(new.website,'') is null then 0 else 1 end) +
    (case when nullif(new.instagram,'') is null then 0 else 1 end) +
    (case when nullif(new.facebook,'') is null then 0 else 1 end) +
    (case when nullif(new.tiktok,'') is null then 0 else 1 end) +
    (case when nullif(new.youtube,'') is null then 0 else 1 end) +
    (case when nullif(new.spotify,'') is null then 0 else 1 end) +
    (case when nullif(new.apple_music,'') is null then 0 else 1 end) +
    (case when nullif(new.x,'') is null then 0 else 1 end) +
    coalesce(jsonb_array_length(coalesce(new.personal_links,'[]'::jsonb)),0);
  if link_count>link_limit then raise exception 'Your membership allows % public links.',link_limit; end if;
  return new;
end; $$;
drop trigger if exists profile_membership_guard_v24_42b2a2 on public.creator_profiles;
create trigger profile_membership_guard_v24_42b2a2 before insert or update on public.creator_profiles
for each row execute function public.enforce_profile_membership_v24_42b2a2();

-- Project Media & Review is a Plus-or-higher feature in addition to Film focus.
create or replace function public.enforce_film_project_media_membership_v24_42b2a2()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not public.creator_has_focus(new.creator_id,'film') then raise exception 'Film & Video workspace access is required'; end if;
  if not public.creator_has_feature_v24_42b2a2(new.creator_id,'film.project_media_review') then raise exception 'Project Media & Review requires Creator Plus or higher.'; end if;
  return new;
end; $$;
drop trigger if exists film_project_media_membership_guard_v24_42b2a2 on public.film_project_media;
create trigger film_project_media_membership_guard_v24_42b2a2 before insert or update on public.film_project_media
for each row execute function public.enforce_film_project_media_membership_v24_42b2a2();
drop trigger if exists film_review_brief_membership_guard_v24_42b2a2 on public.film_project_review_briefs;
create trigger film_review_brief_membership_guard_v24_42b2a2 before insert or update on public.film_project_review_briefs
for each row execute function public.enforce_film_project_media_membership_v24_42b2a2();

revoke all on function public.creator_has_feature_v24_42b2a2(uuid,text) from public;
grant execute on function public.creator_has_feature_v24_42b2a2(uuid,text) to authenticated,service_role;
grant execute on function public.get_public_creator_plan(uuid) to anon,authenticated,service_role;
commit;
