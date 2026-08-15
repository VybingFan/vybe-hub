# V24.42B2B1 Owner Workspace Switching

## Correction

Accounts with several roles no longer receive one permanent navigation solely because Admin is their highest-priority role. Navigation now follows the workspace route:

- `/admin/*` — Back Office
- Creator routes such as `/dashboard`, `/music`, `/film-studio`, and `/film-project-media` — Creator Studio
- `/business/*` — Business Studio
- `/home`, `/discover`, and member routes — Member experience

## Included

- Back Office, Creator Studio, Business Studio, and Explore VYBE controls in the identity bar when authorized.
- Creator Dashboard and full Creator Studio sidebar for the owner account.
- Route-aware desktop sidebar, mobile navigation, search behavior, and notification source.
- Per-tab workspace preference in `sessionStorage`.
- No logout, account duplication, or authorization changes.

Authentication still belongs to the browser session. Separate signed-in accounts require separate browser profiles or InPrivate windows; workspace switching does not pretend to provide per-tab authentication isolation.

## Test

1. Sign in once as the owner.
2. Open Back Office and confirm admin navigation/search.
3. Click Creator Studio and confirm Creator Dashboard, Music, Film Studio, and Project Media appear.
4. Open Back Office in one tab and Creator Studio in another; each tab should retain route-appropriate navigation.
5. Click Explore VYBE and confirm member navigation.
6. Return to Back Office without logging out.
