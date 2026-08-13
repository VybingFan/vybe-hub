-- VYBE V24.41H1 - membership enforcement alignment
-- Preserves existing content. Checkout remains controlled by commerce_settings.

create or replace function public.creator_has_commerce_feature_v24_41h1(
  p_user_id uuid,
  p_feature text
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_feature
    when 'commerce.prepare' then public.creator_effective_plan(p_user_id)
      in ('creator_plus', 'creator_pro', 'creator_studio', 'founding_beta')
    when 'commerce.publish' then public.creator_effective_plan(p_user_id)
      in ('creator_pro', 'creator_studio', 'founding_beta')
    when 'commerce.advanced' then public.creator_effective_plan(p_user_id) = 'creator_studio'
    else false
  end;
$$;

create or replace function public.enforce_commerce_membership_v24_41h1()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.creator_has_commerce_feature_v24_41h1(new.creator_id, 'commerce.prepare') then
    if tg_op = 'UPDATE' and new.status = 'retired' then
      return new;
    end if;
    raise exception 'Preparing sales listings requires Creator Plus or higher.';
  end if;

  if new.status = 'active'
     and not public.creator_has_commerce_feature_v24_41h1(new.creator_id, 'commerce.publish') then
    raise exception 'Publishing a sales listing requires Creator Pro or Creator Studio.';
  end if;

  return new;
end;
$$;

drop trigger if exists commerce_products_membership_guard_v24_41h1
  on public.commerce_products;
create trigger commerce_products_membership_guard_v24_41h1
before insert or update on public.commerce_products
for each row execute function public.enforce_commerce_membership_v24_41h1();

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
  if v_user_id is null then raise exception 'Sign in to manage content continuity.'; end if;

  select target_plan_code into v_target_plan
  from public.creator_membership_adjustments
  where id = p_adjustment_id and user_id = v_user_id;

  if v_target_plan is null then raise exception 'This membership adjustment is not available.'; end if;
  if p_entity_type not in ('track', 'playlist', 'merch', 'video', 'story') then
    raise exception 'Unsupported content type.';
  end if;

  v_limit := public.creator_continuity_limit(v_target_plan, p_entity_type);
  if p_keep_public and v_limit is not null then
    select count(*)::integer into v_selected
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

  insert into public.creator_content_continuity_choices
    (adjustment_id, user_id, entity_type, entity_id, keep_public, updated_at)
  values (p_adjustment_id, v_user_id, p_entity_type, p_entity_id, p_keep_public, now())
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
  order by created_at desc limit 1;
  if v_adjustment.id is null then return null; end if;

  return jsonb_build_object(
    'adjustmentId', v_adjustment.id,
    'targetPlan', v_adjustment.target_plan_code,
    'endsAt', v_adjustment.ends_at,
    'limits', jsonb_build_object(
      'track', public.creator_continuity_limit(v_adjustment.target_plan_code, 'track'),
      'playlist', public.creator_continuity_limit(v_adjustment.target_plan_code, 'playlist'),
      'merch', public.creator_continuity_limit(v_adjustment.target_plan_code, 'merch'),
      'story', public.creator_continuity_limit(v_adjustment.target_plan_code, 'story')
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

grant execute on function public.creator_has_commerce_feature_v24_41h1(uuid, text)
  to authenticated, service_role;
grant execute on function public.set_my_content_continuity_choice(uuid, text, uuid, boolean)
  to authenticated, service_role;
grant execute on function public.get_my_content_continuity_allowances()
  to authenticated, service_role;

