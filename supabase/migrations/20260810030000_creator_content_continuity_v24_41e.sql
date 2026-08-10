begin;

create table if not exists public.creator_content_continuity_choices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  adjustment_id uuid references public.creator_membership_adjustments(id) on delete cascade,
  entity_type text not null check (entity_type in ('track','playlist','merch','video','story','epk')),
  entity_id uuid not null,
  keep_public boolean not null default false,
  selected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, adjustment_id, entity_type, entity_id)
);

create index if not exists creator_content_continuity_choices_lookup
  on public.creator_content_continuity_choices(user_id, adjustment_id, entity_type, keep_public);

alter table public.creator_content_continuity_choices enable row level security;
drop policy if exists creator_content_continuity_choices_owner_read on public.creator_content_continuity_choices;
create policy creator_content_continuity_choices_owner_read
  on public.creator_content_continuity_choices for select to authenticated
  using (user_id=auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.set_my_content_continuity_choice(
  p_adjustment_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_keep_public boolean
) returns void
language plpgsql security definer set search_path=public as $$
begin
  if p_entity_type not in ('track','playlist','merch','video','story','epk') then
    raise exception 'Unsupported creator content type';
  end if;
  if not exists (
    select 1 from public.creator_membership_adjustments a
    where a.id=p_adjustment_id and a.user_id=auth.uid()
  ) then
    raise exception 'Membership adjustment is unavailable';
  end if;
  insert into public.creator_content_continuity_choices(
    user_id,adjustment_id,entity_type,entity_id,keep_public
  ) values (auth.uid(),p_adjustment_id,p_entity_type,p_entity_id,p_keep_public)
  on conflict (user_id,adjustment_id,entity_type,entity_id) do update set
    keep_public=excluded.keep_public,updated_at=now();
end;
$$;

create or replace function public.get_my_content_continuity_summary()
returns jsonb language sql security definer set search_path=public stable as $$
  with active_adjustment as (
    select a.* from public.creator_membership_adjustments a
    where a.user_id=auth.uid()
    order by (a.status='active' and a.ends_at>now()) desc,a.created_at desc
    limit 1
  ), choices as (
    select c.entity_type,
           count(*) filter (where c.keep_public) as keep_public,
           count(*) filter (where not c.keep_public) as retained_private
    from public.creator_content_continuity_choices c
    join active_adjustment a on a.id=c.adjustment_id
    where c.user_id=auth.uid()
    group by c.entity_type
  )
  select case when not exists(select 1 from active_adjustment) then 'null'::jsonb else
    jsonb_build_object(
      'adjustment_id',(select id from active_adjustment),
      'status',(select case when status='active' and ends_at<=now() then 'expired' else status end from active_adjustment),
      'ends_at',(select ends_at from active_adjustment),
      'automatic_deletion',false,
      'choices',coalesce((select jsonb_object_agg(entity_type,jsonb_build_object('keep_public',keep_public,'retained_private',retained_private)) from choices),'{}'::jsonb)
    ) end;
$$;

grant execute on function public.set_my_content_continuity_choice(uuid,text,uuid,boolean) to authenticated,service_role;
grant execute on function public.get_my_content_continuity_summary() to authenticated,service_role;
grant select on public.creator_content_continuity_choices to authenticated;
grant all on public.creator_content_continuity_choices to service_role;

commit;
