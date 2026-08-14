# V24.42B1C Creator Focus Workspace Experience

## Outcome

This bundle exposes the creator-focus access and billing foundations inside VYBE. It does not enable Stripe checkout.

- Adds **Creator Focuses** to Creator Studio.
- Shows the primary focus, active workspace count, paid capacity, membership, catalog, launch status, and agreed pricing.
- Allows a creator to add only an available/foundation workspace when an authorized slot exists.
- Requires confirmation before changing the primary focus or removing an additional workspace.
- Preserves content when a focus is changed or removed.
- Gives Founding Beta creators up to five test workspaces without checkout.
- Adds **Creator Focus Access** to Back Office for controlled founding-test grants and corrections.
- Keeps planned workspaces visible but locked.

## Pricing displayed

- One focus is included with every creator membership.
- Second focus: $8/month or $80/year for Plus, Pro, and Studio.
- Pro Multi-Focus: $15/month or $150/year, up to five focuses.
- Studio Multi-Focus: $20/month or $200/year, up to five focuses.
- Free cannot buy add-ons; Plus cannot buy 3+ Focus.
- Multi-Focus replaces rather than stacks with the second-focus add-on.

Three or more focuses have distinct Pro and Studio prices because each base membership carries different per-workspace storage, publishing, analytics, moderation, collaboration, and usage allowances.

## Safety and rollout

Checkout stays disabled until V24.42B1B Stripe test Price IDs, webhook secret, and `STRIPE_FOCUS_CHECKOUT_ENABLED=true` are deliberately configured. The migration only adds workspace self-service RPCs and the eligibility information required by the interface.

## Verify

1. Run the installer from a clean synchronized branch.
2. Dry-run and then push migration `20260815010000_creator_focus_workspace_v24_42b1c.sql`.
3. Open `/creator-focuses` as a Founding Beta creator.
4. Add Film & Video, make it primary, then make Music primary again.
5. Confirm that planned focuses are disabled and no existing music content changes.
6. Open `/admin/creator-focuses` with creator-read or creator-management permission and verify access controls.
