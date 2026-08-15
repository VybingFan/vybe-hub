# V24.42B2A2 Existing Membership and Focus Enforcement

## Decision preserved

Existing Creator Free, Plus, Pro, Studio, and Founding Creator pricing, benefits, quantities, and allowances remain authoritative. Newer or unmapped capabilities are denied by default until deliberately assigned.

## Corrected boundaries

- Creator Free retains its compact Creator Profile, established music limits, playlists, merchandise showcase, basic analytics, EPK preview, and one primary focus.
- Free uses the standard VYBE profile header, one public genre, and its existing one-public-link allowance.
- Custom covers, multiple genres, advanced music workflow categories/stages, Video Library, and Film Project Media & Review begin with Creator Plus.
- Creator Pro and Studio retain their established website presentations and larger catalog/analytics allowances.
- Founding Creator continues to receive Creator Pro-equivalent capability access while eligible.
- Film Studio requires an active Film & Video focus. Membership level alone does not grant Film access.
- Project Media & Review requires both Film & Video focus and Creator Plus-or-higher capability.
- Owner/admin authority does not bypass creator membership checks in the ordinary Creator Studio sidebar.

## Enforcement layers

1. Focus- and membership-aware Creator Studio navigation.
2. Direct-route locked states for Video Library and Project Media & Review.
3. Client-service checks for video creation and custom cover upload.
4. Database triggers and restrictive policies for video, music workflow, profile presentation, and Film review writes.
5. Public-profile filtering so Free does not render paid video, custom-cover, multi-genre, or excess-link presentation.

Existing restricted content is preserved. The migration does not delete uploads, profiles, links, videos, or Film records.

## Authoritative video allowances

The existing catalog remains unchanged: Free 0 stored minutes, Plus 30, Pro 180, Studio 600, and Founding Creator receives Pro-equivalent access. Cloudflare Stream remains unconfigured and native end-to-end testing remains deferred.

## Required verification

- Test Free, Plus, Pro, Studio, Founding Creator, owner in normal Creator mode, Music-only, Film-authorized, and two-focus accounts.
- Test sidebar visibility, direct URLs, writes, public profiles, database rejection, focus isolation, desktop, and mobile.
- Dry-run and apply only migration `20260815110000_existing_membership_focus_enforcement_v24_42b2a2.sql`.
