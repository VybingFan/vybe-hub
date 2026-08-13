# V24.41H1 Membership Enforcement Alignment

This update converts the V24.41H audit findings into a safe first enforcement pass.

## Enforcement matrix

| Capability | Free | Plus | Pro | Studio |
| --- | --- | --- | --- | --- |
| Prepare commerce drafts | Locked | Included | Included | Included |
| Publish commerce listing | Locked | Locked | Included | Included |
| Advanced commerce tools | Locked | Locked | Locked | Reserved |
| Password playlists | 0 | 3, 7-day maximum | 25, 90-day maximum | 100, 365-day maximum |
| Approved listeners | Locked | Locked | Included | Included |
| Full creator website | Locked | Locked | Included | Included |
| Full EPK and export | Locked | Locked | Included | Included |
| Creator-mode browsing | Locked | Locked | Included | Included |

Founding Creator eligibility continues to normalize to Creator Pro. Checkout remains globally disabled until VYBE enables it after payment, legal, operational, and support readiness.

## Legacy-state policy

Existing content is never deleted by this update. Password playlists without an expiration and expired playlists still selected for a public page remain visible in the audit for deliberate correction. Public services continue to exclude expired access automatically without destroying the workspace record.

## Three enforcement layers

1. The interface explains the required tier and disables unavailable actions.
2. The shared entitlement registry provides the same answer throughout the application.
3. Database triggers prevent direct or stale-client bypasses for commerce activation.

## Verification

- Free cannot create a commerce draft.
- Plus can create a draft but cannot activate it.
- Pro and Studio can activate only after existing rights and seller-readiness guards pass.
- Retiring an existing listing remains available even after downgrade.
- Continuity selection and allowance RPCs return the target plan using `target_plan_code`.
- Checkout remains disabled in `commerce_settings`.

