# V24.42B2A1 Creator Entitlement Lock Audit

## Confirmed tier behavior

| Capability | Free | Plus | Pro | Studio | Founding Beta |
|---|---:|---:|---:|---:|---:|
| Included creator focus | 1 | 1 | 1 | 1 | Up to 5 for testing |
| Second-focus subscription eligibility | No | Yes | Yes | Yes | Not required during test |
| 3+ Focus eligibility | No | No | Up to 5 | Up to 5 | Up to 5 for testing |
| Film projects | 5 | 20 | 75 | 200 | 75 |
| Public Film projects | 3 | 12 | 50 | 150 | 50 |
| External Watch links | 20 | 100 | 300 | 1,000 | 300 |
| Unlisted playlists | 2 | 10 | 50 | 150 | Pro-equivalent |
| Password playlists | Locked | 3, 7-day expiry | 25, 90-day expiry | 100, 365-day expiry | Pro-equivalent |
| Approved viewers/sign-in controls | Locked | Locked | Available | Available | Available |
| Film private-review playlists | Locked | 3 | 25 | 100 | 25 |
| Hosted private scenes/screeners | Locked | Locked | Locked pending secure delivery | Locked pending secure delivery | Locked pending secure delivery |
| Film clip downloads | Locked | Locked | Locked pending revocation controls | Locked pending revocation controls | Locked pending revocation controls |
| Analytics history | 30 days | 90 days | 365 days + export | All time + export | Pro-equivalent |
| Team workspace | Locked | Locked | Locked | 5 seats when activated | Pro-equivalent, 1 seat |
| Commercial distribution | Locked | Locked | Locked | Locked until commerce activation | Locked |

## Corrections included

- Backfills one included Music focus for legacy creator accounts that displayed `0 of 5` or `0 of 1`.
- Automatically initializes a primary focus when future creator profiles are created.
- Preserves all existing content and authorized additional focuses.
- Displays database rejection details in focus administration instead of a generic error.
- Disables Film Playlist choices that the active membership cannot use.
- Enforces total and public Film project limits.
- Enforces external Watch-link limits.
- Enforces active private Film review-playlist limits.
- Blocks Film clip downloads at the database until protected hosted delivery and revocation are implemented.

## Important distinction

The interface lock explains availability; the database trigger is the authority. A creator cannot bypass a lock by modifying the browser request.

## Test

1. Owner/Founding Beta should show Music plus any previously added Film focus—not a zero count.
2. An account with membership `none` must receive a specific eligibility error if an administrator attempts a Film grant.
3. Free should see password, approved-viewer, and membership-only Film Playlist options disabled.
4. Plus should see password enabled but approved viewers disabled.
5. Pro/Studio/Founding should see approved viewers enabled.
6. Existing Music and Film content must remain intact.
