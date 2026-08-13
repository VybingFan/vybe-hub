# VYBE Stripe Connect setup checklist

This release prepares creator payout onboarding. It does **not** activate customer checkout.

1. Activate Stripe Connect for VYBE and complete Stripe's platform profile.
2. Review and acknowledge marketplace responsibility for fees, losses, refunds, disputes, tax, and prohibited businesses.
3. Confirm Accounts v2 access and the `recipient` configuration with Stripe.
4. Keep `STRIPE_SECRET_KEY` in Cloudflare server secrets only.
5. Set `STRIPE_CONNECT_ENABLED=true` only after steps 1–4 are complete.
6. Keep commerce checkout disabled until V24.41G2D is reviewed and tested.
7. Test onboarding in Stripe test mode, including incomplete, restricted, under-review, and ready accounts.
8. Before live sales, configure Connect webhook events for account requirement changes.

Official references:
- https://docs.stripe.com/connect/interactive-platform-guide
- https://docs.stripe.com/connect/marketplace/tasks/create
- https://docs.stripe.com/connect/marketplace/tasks/onboard
- https://docs.stripe.com/api/v2/core/accounts
