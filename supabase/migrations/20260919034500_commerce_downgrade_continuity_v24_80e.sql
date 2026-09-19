-- VYBE V24.80E - commerce downgrade continuity.
-- Losing commerce.publish retires active listings from new sales without deleting
-- product records, orders, rights records, or purchaser access.

begin;

create or replace function public.enforce_commerce_downgrade_continuity_v24_80e()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.creator_has_commerce_feature_v24_41h1(new.user_id, 'commerce.publish') then
    update public.commerce_products
       set status='retired', updated_at=now()
     where creator_id=new.user_id
       and status='active';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_commerce_downgrade_continuity_v24_80e() from public, anon, authenticated;

drop trigger if exists account_entitlements_commerce_downgrade_guard_v24_80e on public.account_entitlements;
create trigger account_entitlements_commerce_downgrade_guard_v24_80e
after update of plan_code, status on public.account_entitlements
for each row
when (old.plan_code is distinct from new.plan_code or old.status is distinct from new.status)
execute function public.enforce_commerce_downgrade_continuity_v24_80e();

commit;
