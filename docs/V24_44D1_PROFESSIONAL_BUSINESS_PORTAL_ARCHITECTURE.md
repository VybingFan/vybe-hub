# V24.44D1 — Professional Business Portal Architecture

## Base
- Required base commit: `c0ae9ef0ebf65bacf3d457154421feda68fac074`
- Dependency: V24.44C production verification complete.

## Purpose
Establish the external VYBE Business Portal as a distinct professional workspace without weakening business-ownership RLS or mixing internal Operations into the partner experience.

## Architecture
1. Main VYBE — supporter/public discovery and participation.
2. Creator Studio — professional creator management.
3. Business Portal — professional advertiser/partner management.
4. Operations — internal owner/staff administration.

## Changes
- Presents `/business` as a dedicated **Business Portal** professional workspace.
- Preserves the current application, verification/partnership status, and business-owned campaign reads.
- Adds clearly labeled portal areas for Campaigns, Creative Studio, Offers & Sponsorships, Reports, Partner Documents, Billing, Team, and Business Settings.
- Upcoming areas are labels/cards only; no dead routes or fake writes are added.
- Desktop sidebar becomes **Business Portal** plus a separate **Explore VYBE** bridge.
- Mobile Business Portal navigation becomes **Portal** plus **Explore VYBE**, rather than Home/Business/Discover.

## Preserved
- Existing `/business` route and business application workflow.
- Existing Supabase RLS and grants.
- Creator membership decisions and Creator Studio navigation.
- `creator_mode.browse`.
- V24.44B/V24.44C Operations boundary and `/operations/sign-in`.
- Internal business administration under `/admin`.

## No database migration
D1 does not add business write permissions or alter Supabase.

## Required verification
1. Business account opens `/business` as Business Portal.
2. Existing application workflow still works when no profile exists.
3. Existing business status/campaign reads still work.
4. Upcoming portal areas are visibly inactive.
5. Desktop sidebar shows Business Portal and Explore VYBE separately.
6. Mobile Business Portal no longer mixes Home/Discover as business tools.
7. Explore VYBE returns to the member experience.
8. Creator Studio is unchanged.
9. Operations sign-in and `/admin` remain unchanged.

Do not begin V24.44D2 write workflows until D1 is deployed and verified.
