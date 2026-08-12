-- VYBE V24.41G — membership continuity limits

create or replace function public.creator_continuity_limit(
  p_plan text,
  p_entity_type text
) returns integer
language sql
immutable
as $$
  select case
    when p_entity_type = 'video' then null
    when p_plan in ('founding_beta', 'creator_pro') and p_entity_type = 'track' then 200
    when p_plan in ('founding_beta', 'creator_pro') and p_entity_type = 'playlist' then 100
    when p_plan in ('founding_beta', 'creator_pro') and p_entity_type = 'merch' then 50
    when p_plan in ('founding_beta', 'creator_pro') and p_entity_type = 'story' then 250
    when p_plan = 'creator_studio' and p_entity_type = 'track' then 400
    when p_plan = 'creator_studio' and p_entity_type = 'playlist' then 250
    when p_plan = 'creator_studio' and p_entity_type = 'merch' then 150
    when p_plan = 'creator_studio' and p_entity_type = 'story' then 1000
    when p_plan = 'creator_plus' and p_entity_type = 'track' then 50
    when p_plan = 'creator_plus' and p_entity_type = 'playlist' then 30
    when p_plan = 'creator_plus' and p_entity_type = 'merch' then 10
    when p_plan = 'creator_plus' and p_entity_type = 'story' then 50
    when p_entity_type = 'track' then 10
    when p_entity_type = 'playlist' then 8
    when p_entity_type = 'merch' then 2
    when p_entity_type = 'story' then 10
    else 0
  end;
$$;

create or replace function public.set_my_content_continuity_choice(
  p_adjustment_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_keep_public boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_target_plan text;
  v_limit integer;
  v_selected integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to manage content continuity.';
  end if;

  select target_plan
    into v_target_plan
  from public.creator_membership_adjustments
  where id = p_adjustment_id and user_id = v_user_id;

  if v_target_plan is null then
    raise exception 'This membership adjustment is not available.';
  end if;

  if p_entity_type not in ('track', 'playlist', 'merch', 'video', 'story') then
    raise exception 'Unsupported content type.';
  end if;

  v_limit := public.creator_continuity_limit(v_target_plan, p_entity_type);

  if p_keep_public and v_limit is not null then
    select count(*)::integer
      into v_selected
    from public.creator_content_continuity_choices
    where adjustment_id = p_adjustment_id
      and user_id = v_user_id
      and entity_type = p_entity_type
      and keep_public = true
      and entity_id <> p_entity_id;

    if v_selected >= v_limit then
      raise exception 'Your target membership allows % public % items. Retain another item privately before selecting this one.', v_limit, p_entity_type;
    end if;
  end if;

  insert into public.creator_content_continuity_choices (
    adjustment_id, user_id, entity_type, entity_id, keep_public, updated_at
  ) values (
    p_adjustment_id, v_user_id, p_entity_type, p_entity_id, p_keep_public, now()
  )
  on conflict (adjustment_id, entity_type, entity_id)
  do update set keep_public = excluded.keep_public, updated_at = now();
end;
$$;

create or replace function public.get_my_content_continuity_allowances()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_adjustment public.creator_membership_adjustments%rowtype;
begin
  if v_user_id is null then return null; end if;

  select * into v_adjustment
  from public.creator_membership_adjustments
  where user_id = v_user_id
  order by created_at desc
  limit 1;

  if v_adjustment.id is null then return null; end if;

  return jsonb_build_object(
    'adjustmentId', v_adjustment.id,
    'targetPlan', v_adjustment.target_plan,
    'endsAt', v_adjustment.ends_at,
    'limits', jsonb_build_object(
      'track', public.creator_continuity_limit(v_adjustment.target_plan, 'track'),
      'playlist', public.creator_continuity_limit(v_adjustment.target_plan, 'playlist'),
      'merch', public.creator_continuity_limit(v_adjustment.target_plan, 'merch'),
      'story', public.creator_continuity_limit(v_adjustment.target_plan, 'story')
    ),
    'selected', coalesce((
      select jsonb_object_agg(entity_type, item_count)
      from (
        select entity_type, count(*)::integer as item_count
        from public.creator_content_continuity_choices
        where adjustment_id = v_adjustment.id and user_id = v_user_id and keep_public = true
        group by entity_type
      ) counts
    ), '{}'::jsonb)
  );
end;
$$;

create or replace function public.creator_entity_is_publicly_available(
  p_creator_id uuid,
  p_entity_type text,
  p_entity_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_adjustment_id uuid;
  v_keep_public boolean;
begin
  if auth.uid() = p_creator_id then return true; end if;

  select id into v_adjustment_id
  from public.creator_membership_adjustments
  where user_id = p_creator_id and ends_at <= now()
  order by created_at desc
  limit 1;

  if v_adjustment_id is null then return true; end if;

  select keep_public into v_keep_public
  from public.creator_content_continuity_choices
  where adjustment_id = v_adjustment_id
    and user_id = p_creator_id
    and entity_type = p_entity_type
    and entity_id = p_entity_id
  limit 1;

  return coalesce(v_keep_public, false);
end;
$$;

grant execute on function public.creator_continuity_limit(text, text) to authenticated, service_role;
grant execute on function public.set_my_content_continuity_choice(uuid, text, uuid, boolean) to authenticated, service_role;
grant execute on function public.get_my_content_continuity_allowances() to authenticated, service_role;
grant execute on function public.creator_entity_is_publicly_available(uuid, text, uuid) to anon, authenticated, service_role;
