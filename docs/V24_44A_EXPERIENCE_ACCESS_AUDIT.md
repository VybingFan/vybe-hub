# V24.44A Experience and Access Audit

Base commit: `e02486a5`
Audit date: 2026-08-15

## Decision

VYBE remains one recognizable platform with four deliberately separated experiences:

1. Public VYBE and Explore for discovery and public creator content.
2. Member/Supporter experience for following, saving, participating, and returning activity.
3. Creator Studio for publishing, catalog management, creator growth, and discipline workspaces.
4. Business Portal for external advertisers and partners.

Back Office is internal staff software. It must ultimately have its own entrance, session boundary, shell, and neutral denial behavior, with no indication inside the ordinary application. V24.44A records the current boundary; V24.44B and V24.44C perform that separation.

## Authoritative route families

The executable registry is `src/features/access/routeAccessRegistry.ts`. It classifies every current route through exact paths or explicit route families.

| Experience                     | Routes                                                                                                                                                       | Required boundary                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Public marketing               | `/`, `/about`, `/faq`, `/help`, `/trust`, `/privacy`, `/terms`, `/community-guidelines`, `/copyright`, `/copyright/report`, `/creator-memberships`, `/for-*` | Public                                                                                                |
| Public discovery and demos     | `/explore`, `/experience/*`, `/demo/*`                                                                                                                       | Public; only published/eligible data                                                                  |
| Public creator content         | `/creator/:username`, `/artist/:username`, public playlists, `/video/:videoId`                                                                               | Public; creator ownership, visibility, membership and publishing eligibility enforced by services/RLS |
| Authentication and invitations | `/auth/*`, creator/admin invitation tokens                                                                                                                   | Public entrance with token/session validation                                                         |
| Member/Supporter               | `/home`, `/discover`, `/listen`, `/watch`, `/read`, `/play`, `/my-vybe`, `/communities`, `/events`                                                           | Session plus supported account role                                                                   |
| Shared account                 | `/profile`, `/settings`, supporter profile/interests                                                                                                         | Session plus supported account role; role-specific data ownership                                     |
| Creator Studio                 | dashboard, content, music, playlists, stories, merch, EPK, analytics, connections, compliance and focus routes                                               | Session plus Creator role; membership/focus gates where mapped                                        |
| Film workspace                 | `/film-studio`, `/film-playlists`, `/film-project-media`                                                                                                     | Creator role plus active Film focus; Project Media also requires Plus or higher                       |
| Business Portal foundation     | `/business`                                                                                                                                                  | Business role; no staff moderation or private platform data                                           |
| Back Office                    | `/admin`, `/admin/*`                                                                                                                                         | Admin role plus assigned staff permission; separate entrance/session required by V24.44B              |
| Server APIs                    | `/api/*`                                                                                                                                                     | User token and role/capability validation, except Stripe webhook signature validation                 |

## Enforcement layers reviewed

- The `/_authenticated` layout rejects missing sessions.
- `RoleGuard` provides direct-route account-role denial.
- `AdminPermissionGuard` requires active staff access and an assigned permission.
- Creator membership limits and capabilities are centralized in the membership catalog, entitlements and access map.
- Creator-focus access is sourced from creator focus subscriptions/access records.
- Sensitive creator writes retain service checks and database triggers/RLS; UI hiding alone is never the authority.
- Public creator services filter private, over-limit and plan-ineligible presentation data.

## Dangerous direct-route gaps corrected now

1. `/stories` previously inherited only the authenticated layout. It now requires Creator/Admin role.
2. `/creator-support` previously inherited only the authenticated layout. It now requires Creator/Admin role and Creator Plus or higher.
3. `/organization` previously inherited only the authenticated layout. It now requires Creator/Admin role and Creator Studio team-workspace access.
4. `/film-playlists` previously depended on navigation and downstream data behavior. It now has an explicit active-Film-focus page guard.

No existing content is deleted or rewritten.

## Confirmed boundaries from V24.42B2A2/B2A3

- Free Video Library navigation is hidden and direct `/videos` access is locked.
- Free hosted video creation is blocked in the service and database.
- Free uses the compact public Creator Profile, a standard header, one genre, one public link, no public video section, and `Featured Music` language.
- Plus begins enhanced profile presentation, advanced music workflow, custom cover, multiple genres and hosted-video allowance.
- Pro/eligible Founding Creator begins the full Creator Website and Creator Mode browsing.
- Film Project Media requires Plus or higher and an active Film focus.
- Founding Creator maps to Pro while eligible; it does not become Studio.

## Findings intentionally assigned to later bundles

### V24.44B — Dedicated Back Office Authentication Boundary

Back Office currently uses the shared authenticated session and application origin. It needs a separate staff entrance, staff-authorized session, expiration, audit events, neutral denial and MFA readiness.

### V24.44C — Remove Operations From the Main Application

Administrative routes and modules still compile inside the main application. Ordinary users do not receive the admin navigation, but the product must remove all Operations wording, identity-switching indications and preload paths from the normal shell after the dedicated boundary exists.

### V24.44D — Separate VYBE Business Portal

The current `/business` route is a role-gated foundation. It is not yet the complete advertiser/partner portal and must never gain moderation, staff, approval or private-user authority.

### V24.44E — Explore Publishing Eligibility

Discovery readiness exists, but public eligibility must be consolidated into one database-enforced decision covering profile completeness, public setting, policy acceptance, rights, membership, focus, moderation and account status.

## Non-dangerous product alignment findings

- Creator `Create & Manage` currently advertises Video as available before evaluating the viewer's plan. The destination is locked correctly, but the card should become capability-aware during adaptive Creator Studio work.
- Several routes still allow `admin` as a Creator Studio role for legacy testing. Admin authority does not grant paid membership or focus capabilities; V24.44C should remove reliance on the ordinary creator shell for staff workflows.
- Public alias routes `/artist/:username` and `/creator/:username` coexist. They are classified together; a later public-experience refinement can choose one canonical URL without breaking existing links.
- API route source files do not use UI guards. Their token, role, ownership, signature and server-secret checks must remain server-side.

## Acceptance checks

- Supporter and Business accounts receive a role denial at `/stories` and `/creator-support`.
- Creator Free receives an upgrade lock at `/creator-support`.
- Non-Studio creators receive an upgrade lock at `/organization`.
- A creator without active Film focus receives a focus lock at `/film-playlists`.
- Existing Free/Plus/Pro/Studio/Founding membership behavior remains unchanged.
- Production build succeeds.
- No database migration is required for V24.44A.
