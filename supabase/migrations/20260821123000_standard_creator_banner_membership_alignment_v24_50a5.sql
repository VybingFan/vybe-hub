-- VYBE V24.50A5
-- Standard profile banners are included with every Creator plan.
-- Full-page custom backgrounds remain restricted to Creator Pro, Studio,
-- and the founding beta plan.

begin;

create or replace function public.creator_has_feature_v24_42b2a2(
  p_user_id uuid,
  p_feature text
)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select case p_feature
    when 'profile.custom_cover' then public.creator_effective_plan(p_user_id) in ('creator_free','creator_plus','creator_pro','creator_studio','founding_beta')
    when 'profile.custom_background' then public.creator_effective_plan(p_user_id) in ('creator_pro','creator_studio','founding_beta')
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

create or replace function public.enforce_profile_membership_v24_42b2a2()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  link_count integer;
  link_limit integer;
  effective_plan text;
  background_allowed boolean;
begin
  effective_plan := public.creator_effective_plan(new.user_id);
  background_allowed := effective_plan in ('creator_pro','creator_studio','founding_beta');
  link_limit := case effective_plan
    when 'creator_studio' then 100
    when 'creator_pro' then 25
    when 'founding_beta' then 25
    when 'creator_plus' then 5
    else 1
  end;

  -- Standard avatar and banner fields are available to every Creator plan.
  if effective_plan = 'creator_free' and coalesce(array_length(new.genres,1),0) > 1 then
    raise exception 'Creator Free includes one public genre.';
  end if;

  -- Only the separate full-page custom background remains a paid capability.
  if not background_allowed then
    if new.profile_theme = 'custom'
      or new.profile_background_path is not null
      or nullif(new.profile_background_url,'') is not null then
      raise exception 'Full-page profile backgrounds require Creator Pro or higher.';
    end if;
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

  if link_count > link_limit then
    raise exception 'Your membership allows % public links.', link_limit;
  end if;

  return new;
end;
$$;

commit;
