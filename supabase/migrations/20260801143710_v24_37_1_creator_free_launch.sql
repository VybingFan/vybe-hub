begin;
create or replace function public.ensure_my_identities() returns setof public.account_identities language plpgsql security definer set search_path=public as $$
declare v_user auth.users%rowtype; v_name text; v_role text;
begin select * into v_user from auth.users where id=auth.uid(); if v_user.id is null then raise exception 'Authentication required'; end if; v_name:=coalesce(nullif(v_user.raw_user_meta_data->>'display_name',''),split_part(v_user.email,'@',1),'VYBE member');
insert into account_identities(owner_user_id,identity_type,display_name,subject_user_id) values(v_user.id,'supporter',v_name,v_user.id) on conflict(owner_user_id,identity_type,subject_user_id) do nothing;
for v_role in select role::text from user_roles where user_id=v_user.id and role::text in ('creator','business') loop insert into account_identities(owner_user_id,identity_type,display_name,subject_user_id,verified) values(v_user.id,v_role,v_name,v_user.id,v_role='creator') on conflict(owner_user_id,identity_type,subject_user_id) do update set display_name=excluded.display_name; end loop;
return query select * from account_identities where owner_user_id=auth.uid() and status='active' order by identity_type; end $$;
create or replace function public.toggle_creator_follow(p_creator_user_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare s uuid; t uuid; removed boolean:=false;
begin select id into s from account_identities where owner_user_id=auth.uid() and identity_type='supporter' and status='active' limit 1; if s is null then perform ensure_my_identities(); select id into s from account_identities where owner_user_id=auth.uid() and identity_type='supporter' limit 1; end if;
select id into t from account_identities where subject_user_id=p_creator_user_id and identity_type='creator' limit 1; if t is null then insert into account_identities(owner_user_id,identity_type,display_name,subject_user_id,verified) select p_creator_user_id,'creator',coalesce(p.display_name,'VYBE Creator'),p_creator_user_id,true from profiles p where p.id=p_creator_user_id returning id into t; end if; if t is null then raise exception 'Creator unavailable'; end if;
delete from identity_follows where follower_identity_id=s and target_identity_id=t returning true into removed; if not coalesce(removed,false) then insert into identity_follows(follower_identity_id,target_identity_id) values(s,t); insert into identity_notifications(recipient_identity_id,actor_identity_id,notification_type,entity_type,entity_id) values(t,s,'new_follower','creator',p_creator_user_id); end if;
return jsonb_build_object('following',not coalesce(removed,false),'count',(select count(*) from identity_follows where target_identity_id=t)); end $$;
grant execute on function public.toggle_creator_follow(uuid) to authenticated;
create or replace function public.creator_follow_summary(p_creator_user_id uuid) returns jsonb language sql security definer set search_path=public stable as $$ select jsonb_build_object('count',count(f.*),'following',coalesce(bool_or(s.owner_user_id=auth.uid()),false)) from account_identities t left join identity_follows f on f.target_identity_id=t.id left join account_identities s on s.id=f.follower_identity_id where t.subject_user_id=p_creator_user_id and t.identity_type='creator' $$;
grant execute on function public.creator_follow_summary(uuid) to anon,authenticated;
commit;

