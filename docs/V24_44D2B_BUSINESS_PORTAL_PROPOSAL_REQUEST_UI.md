# V24.44D2B — Business Portal Proposal & Request UI

## Base
`34d5630932a9a4a3a43693b45826f3340c4c1fb1`

Dependency: V24.44D2A and V24.44D2A1 deployed and verified.

## Purpose
Connect the professional Business Portal to the secure `business_submissions` layer without giving businesses direct write authority over operational campaigns, offers, creatives, placements, reports, approvals, scheduling, or internal notes.

## Business-facing workflow
Verified businesses can:
- create a Campaign Proposal;
- create an Offer Proposal;
- create a Sponsorship / Placement Request;
- create a Creative Brief;
- save a private draft;
- edit a draft;
- delete a draft;
- submit a draft to VYBE Operations;
- view their own request history/status;
- view a business-facing VYBE response when Operations provides one.

Pending/rejected/suspended businesses see the proposal tools locked.

## Service changes
`businessStudioService` now owns the external portal submission client:
- `listSubmissions`
- `createSubmission`
- `updateDraft`
- `deleteDraft`
- `submitDraft`

The client relies on the verified D2A/D2A1 RLS and RPC boundary.

## Preserved
- Existing business application.
- Existing verification/partnership summary.
- Existing campaign reads.
- Existing Business Portal shell/navigation.
- Main supporter VYBE experience.
- Creator Studio.
- Operations authentication and internal business administration.
- No direct external writes to operational business tables.

## No migration
D2B includes no Supabase migration. It consumes the already-deployed D2A/D2A1 security foundation.

## Production verification
1. Pending business cannot see active proposal form.
2. Verified business can save each request type as a draft.
3. Draft appears under My Requests.
4. Draft can be edited.
5. Draft can be deleted.
6. Draft can be submitted.
7. Submitted request can no longer be edited/deleted in the portal.
8. Refresh preserves request history.
9. Business sees only its own requests.
10. Existing campaign/status reads remain normal.
11. Creator Studio remains unchanged.
12. Operations entrance remains unchanged.

Do not begin Operations-side submission review tooling until D2B is production verified.
