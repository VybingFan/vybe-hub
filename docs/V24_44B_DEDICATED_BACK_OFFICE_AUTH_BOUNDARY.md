# V24.44B Dedicated Back Office Authentication Boundary

Base commit: `1f9550711458c2b9b0f151b772da20ac25c1882d`

## Delivered

- Adds the isolated `/operations/sign-in` staff entrance.
- Requires an active, short-lived Operations session in addition to the normal Supabase account session for every `/admin` route.
- Binds the Operations session to an active administrator and active `admin_team_members` record.
- Expires authorization after eight hours or 30 minutes of inactivity.
- Records session starts, denials, and explicit endings in `admin_access_audit`.
- Uses neutral denial messaging so unauthorized visitors are not shown staff or permission details.
- Adds `VITE_OPERATIONS_HOST` readiness for a dedicated production staff origin.
- Stores the Operations credential in tab-scoped `sessionStorage`; closing the tab removes the browser credential.

## Security boundary

The browser guard improves navigation and presentation, while the database RPCs are the authority for issuing and validating Operations sessions. Possessing an Operations session identifier without the matching authenticated Supabase user is insufficient.

The schema includes MFA verification state for a future enforcement bundle. V24.44B does not claim that MFA is enabled or enforced.

## Migration

Apply `20260815150000_operations_auth_boundary_v24_44b.sql` only after a successful dry run.

## Next boundary

V24.44C removes Back Office navigation and Operations modules from the ordinary member and creator application experience. V24.44B intentionally establishes the authentication boundary first and does not claim that the legacy navigation removal is complete.
