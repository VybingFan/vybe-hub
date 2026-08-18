# V24.44D2A — Business Submission Security Foundation

## Base
Required source commit: `ccd0d153fff7d71af1d6022e54bc7c513f0def47`

Dependency: V24.44D1 deployed and production verified.

## Purpose
Create a secure submission layer between the professional Business Portal and internal VYBE Operations.

Businesses may propose work without receiving direct write access to operational campaign, offer, creative, placement, reporting, approval, scheduling, or internal-review fields.

## New table
`public.business_submissions`

Request types: `campaign_proposal`, `offer_proposal`, `sponsorship_placement`, `creative_brief`.

Statuses: `draft`, `submitted`, `under_review`, `approved`, `declined`, `withdrawn`.

## Business permissions
A business owner may read its own submissions, create a clean draft, edit/delete its own draft, and submit its own draft with `submit_my_business_submission(uuid)`.

A business owner may not directly change status, write reviewer fields, write `internal_notes`, write the Operations response, approve/decline itself, or write directly to operational campaigns/offers/creatives/placements/reports through this migration.

## Operations permissions
`admin.business.read` may read submissions. `admin.business.manage` may manage submissions.

## Migration safety
The installer does not run `supabase db push`.

Required sequence: install → inspect migration → `git diff --check` → `npx supabase db push --dry-run` → confirm only D2A would push → `npx supabase db push` → verify live table/policies/function → stage/commit/push → confirm `0 0` → Cloudflare Active 100%.

Do not begin D2B until D2A is verified.
