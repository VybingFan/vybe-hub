-- VYBE V24.80B - Creator Studio team workspace backend enforcement.
-- The UI already gates Organization Workspace to Creator Studio. This migration
-- makes the database enforce the same rule for direct table writes.

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
    when 'support.priority' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'team.workspace' then public.creator_effective_plan(p_user_id) = 'creator_studio'
    when 'commerce.prepare' then public.creator_effective_plan(p_user_id) in ('creator_plus','creator_pro','creator_studio','founding_beta')
    when 'creator_mode.browse' then public.creator_effective_plan(p_user_id) in ('creator_pro','creator_studio','founding_beta')
    else false
  end;
$$;

create or replace function public.enforce_creator_team_workspace_v24_80b()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_owner uuid;
  v_org uuid;
begin
  if tg_table_name = 'creator_organizations' then
    v_owner := case when tg_op = 'DELETE' then old.owner_user_id else new.owner_user_id end;
  else
    v_org := case when tg_op = 'DELETE' then old.organization_id else new.organization_id end;
    select owner_user_id into v_owner from public.creator_organizations where id = v_org;
  end if;

  if v_owner is null or not public.creator_has_feature_v24_42b2a2(v_owner, 'team.workspace') then
    raise exception 'Organization Workspace requires Creator Studio.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke execute on function public.enforce_creator_team_workspace_v24_80b() from public, anon, authenticated;

drop trigger if exists creator_organizations_team_workspace_guard_v24_80b on public.creator_organizations;
create trigger creator_organizations_team_workspace_guard_v24_80b
before insert or update or delete on public.creator_organizations
for each row execute function public.enforce_creator_team_workspace_v24_80b();

drop trigger if exists creator_organization_members_team_workspace_guard_v24_80b on public.creator_organization_members;
create trigger creator_organization_members_team_workspace_guard_v24_80b
before insert or update or delete on public.creator_organization_members
for each row execute function public.enforce_creator_team_workspace_v24_80b();

drop trigger if exists creator_organization_relationships_team_workspace_guard_v24_80b on public.creator_organization_relationships;
create trigger creator_organization_relationships_team_workspace_guard_v24_80b
before insert or update or delete on public.creator_organization_relationships
for each row execute function public.enforce_creator_team_workspace_v24_80b();

commit;
