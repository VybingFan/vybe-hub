begin;

create or replace function public.get_membership_privacy_audit_v24_41h()
returns table (
  severity text,
  domain text,
  code text,
  affected_count bigint,
  summary text,
  recommendation text
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin') then
    raise exception 'Admin access required.';
  end if;

  return query
  with findings as (
    select
      'warning'::text severity,
      'Memberships'::text domain,
      'UNKNOWN_PLAN_CODE'::text code,
      count(*)::bigint affected_count,
      'Entitlements use an unknown creator plan code.'::text summary,
      'Correct the plan assignment before relying on feature limits.'::text recommendation
    from public.account_entitlements
    where coalesce(plan_code, 'creator_free') not in
      ('creator_free','creator_plus','creator_pro','creator_studio','founding_beta')

    union all
    select
      'warning','Continuity','OVERDUE_ACTIVE_ADJUSTMENT',count(*)::bigint,
      'Membership adjustments remain active after their 30-day deadline.',
      'Review the adjustment finalization job and retained-private selections.'
    from public.creator_membership_adjustments
    where status = 'active' and ends_at <= now()

    union all
    select
      'review','Protected sharing','PASSWORD_WITHOUT_EXPIRY',count(*)::bigint,
      'Password playlists have no expiration date.',
      'Apply the effective-plan expiration rule or deliberately retire the link.'
    from public.playlists
    where access_mode = 'password'
      and is_published = true
      and access_expires_at is null

    union all
    select
      'review','Public presentation','EXPIRED_PUBLIC_SELECTION',count(*)::bigint,
      'Expired playlists are still selected for a public creator page.',
      'Keep them retained in the workspace but remove them from public presentation.'
    from public.playlists
    where show_on_public_profile = true
      and access_expires_at is not null
      and access_expires_at <= now()

    union all
    select
      'warning','Public presentation','INELIGIBLE_PUBLIC_PLAYLIST',count(*)::bigint,
      'Playlists selected for public display are not both Public and Published.',
      'Correct the public-page selection or the playlist access and availability state.'
    from public.playlists
    where show_on_public_profile = true
      and (access_mode <> 'public' or is_published is not true)

    union all
    select
      'warning','Commerce','ACTIVE_PRODUCT_RIGHTS_GAP',count(*)::bigint,
      'Active commerce listings are missing approved rights.',
      'Retire the listing and send it through Music Rights Review.'
    from public.commerce_products
    where status = 'active' and rights_status <> 'approved'

    union all
    select
      'warning','Commerce','ACTIVE_PRODUCT_SELLER_GAP',count(*)::bigint,
      'Active commerce listings belong to a creator who is not payout-ready.',
      'Pause the listing until Stripe reports ready payouts and charges.'
    from public.commerce_products p
    where p.status = 'active'
      and not exists (
        select 1 from public.commerce_seller_accounts s
        where s.creator_id = p.creator_id
          and s.onboarding_status = 'ready'
          and s.payouts_ready = true
          and s.charges_ready = true
      )

    union all
    select
      'review','Commerce','ACTIVE_WHILE_CHECKOUT_DISABLED',count(*)::bigint,
      'Sale listings are active while platform checkout is disabled.',
      'Treat them as previews only; do not accept payment until checkout controls ship.'
    from public.commerce_products p
    where p.status = 'active'
      and exists (
        select 1 from public.commerce_settings s
        where s.id = true and s.checkout_enabled = false
      )

    union all
    select
      'warning','Database security','SENSITIVE_TABLE_WITHOUT_RLS',count(*)::bigint,
      'Sensitive VYBE tables do not have row-level security enabled.',
      'Enable and test RLS before exposing any related client query.'
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'account_entitlements','creator_membership_adjustments',
        'creator_content_continuity_choices','playlists','playlist_access_grants',
        'commerce_products','commerce_orders','commerce_order_items',
        'commerce_entitlements','commerce_rights_declarations',
        'commerce_seller_accounts'
      )
      and c.relkind = 'r'
      and c.relrowsecurity is false
  )
  select
    case when f.affected_count = 0 then 'pass' else f.severity end,
    f.domain,
    f.code,
    f.affected_count,
    case when f.affected_count = 0
      then replace(f.summary, ' are ', ' are not ')
      else f.summary
    end,
    f.recommendation
  from findings f
  order by
    case when f.affected_count > 0 and f.severity = 'warning' then 1
         when f.affected_count > 0 then 2 else 3 end,
    f.domain,
    f.code;
end;
$$;

revoke all on function public.get_membership_privacy_audit_v24_41h() from public, anon;
grant execute on function public.get_membership_privacy_audit_v24_41h()
  to authenticated, service_role;

comment on function public.get_membership_privacy_audit_v24_41h() is
  'Read-only V24.41H admin diagnostics. Returns counts and guidance; never secrets or private content.';

commit;

