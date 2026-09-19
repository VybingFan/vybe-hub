-- VYBE V24.80C1 - preserve actual-plan analytics history overlays.
-- Founding and Studio use their explicit plan-definition analytics history instead
-- of normalizing through the public Pro-equivalent presentation.

begin;

create or replace function public.creator_analytics_request_days_v24_80c(
  p_user_id uuid,
  p_requested_days integer
)
returns integer
language sql
stable
security definer
set search_path=public
as $$
  select least(
    greatest(coalesce(p_requested_days, 1), 1),
    coalesce((
      select definition.analytics_history_days
      from public.creator_plan_definitions definition
      where definition.plan_code = coalesce(
        (
          select entitlement.plan_code
          from public.account_entitlements entitlement
          where entitlement.user_id = p_user_id
            and entitlement.status in ('active','trialing')
            and (entitlement.expires_at is null or entitlement.expires_at > now())
          order by entitlement.updated_at desc
          limit 1
        ),
        public.creator_effective_plan(p_user_id)
      )
      limit 1
    ), 3650),
    3650
  );
$$;

revoke all on function public.creator_analytics_request_days_v24_80c(uuid, integer) from public, anon;
grant execute on function public.creator_analytics_request_days_v24_80c(uuid, integer) to authenticated, service_role;

commit;
