begin;

create or replace function public.creator_entity_is_publicly_available(
  p_creator_id uuid,
  p_entity_type text,
  p_entity_id uuid
) returns boolean
language sql security definer set search_path=public stable as $$
  select case
    when auth.uid()=p_creator_id then true
    when not exists (
      select 1 from public.creator_membership_adjustments a
      where a.user_id=p_creator_id and a.status='active' and a.ends_at<=now()
    ) then true
    else coalesce((
      select c.keep_public
      from public.creator_content_continuity_choices c
      join public.creator_membership_adjustments a on a.id=c.adjustment_id
      where c.user_id=p_creator_id
        and c.entity_type=p_entity_type
        and c.entity_id=p_entity_id
        and a.status='active'
      order by c.updated_at desc limit 1
    ),true)
  end;
$$;

grant execute on function public.creator_entity_is_publicly_available(uuid,text,uuid) to anon,authenticated,service_role;

drop policy if exists tracks_membership_continuity_select on public.tracks;
create policy tracks_membership_continuity_select
  on public.tracks as restrictive for select
  using (public.creator_entity_is_publicly_available(creator_id,'track',id));

drop policy if exists playlists_membership_continuity_select on public.playlists;
create policy playlists_membership_continuity_select
  on public.playlists as restrictive for select
  using (public.creator_entity_is_publicly_available(creator_id,'playlist',id));

commit;
