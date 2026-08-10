begin;

do $$ begin
  if to_regclass('public.merch_products') is not null then
    execute 'drop policy if exists merch_membership_continuity_select on public.merch_products';
    execute 'create policy merch_membership_continuity_select on public.merch_products as restrictive for select using (public.creator_entity_is_publicly_available(creator_id,''merch'',id))';
  end if;
  if to_regclass('public.creator_videos') is not null then
    execute 'drop policy if exists videos_membership_continuity_select on public.creator_videos';
    execute 'create policy videos_membership_continuity_select on public.creator_videos as restrictive for select using (public.creator_entity_is_publicly_available(creator_id,''video'',id))';
  end if;
  if to_regclass('public.creator_stories') is not null then
    execute 'drop policy if exists stories_membership_continuity_select on public.creator_stories';
    execute 'create policy stories_membership_continuity_select on public.creator_stories as restrictive for select using (public.creator_entity_is_publicly_available(creator_user_id,''story'',id))';
  end if;
end $$;

create or replace function public.get_admin_membership_continuity_summary()
returns table(
  adjustment_id uuid,user_id uuid,previous_plan_code text,target_plan_code text,
  adjustment_status text,started_at timestamptz,ends_at timestamptz,days_remaining integer,
  public_choice_count bigint,private_retention_count bigint
) language plpgsql security definer set search_path=public stable as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admin access required'; end if;
  return query
  select a.id,a.user_id,a.previous_plan_code,a.target_plan_code,
    case when a.status='active' and a.ends_at<=now() then 'expired' else a.status end,
    a.started_at,a.ends_at,greatest(0,ceil(extract(epoch from(a.ends_at-now()))/86400.0))::integer,
    count(c.id) filter(where c.keep_public),count(c.id) filter(where not c.keep_public)
  from public.creator_membership_adjustments a
  left join public.creator_content_continuity_choices c on c.adjustment_id=a.id
  group by a.id,a.user_id,a.previous_plan_code,a.target_plan_code,a.status,a.started_at,a.ends_at
  order by (a.status='active') desc,a.created_at desc;
end;
$$;
grant execute on function public.get_admin_membership_continuity_summary() to authenticated,service_role;

commit;
