# Stripe V24.8 setup

V24.8 uses Stripe Checkout for new subscriptions, Stripe Customer Portal for billing
management, and signed Stripe webhooks as the only authority that changes paid access.

## Server-only Cloudflare variables

Never prefix these with `VITE_` and never commit their values:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_CHECKOUT_ENABLED` (`true` only during controlled verification or after launch approval)
- `STRIPE_PRICE_CREATOR_PLUS_MONTHLY`
- `STRIPE_PRICE_CREATOR_PLUS_ANNUAL`
- `STRIPE_PRICE_CREATOR_PRO_MONTHLY`
- `STRIPE_PRICE_CREATOR_PRO_ANNUAL`
- `STRIPE_PRICE_CREATOR_STUDIO_MONTHLY`
- `STRIPE_PRICE_CREATOR_STUDIO_ANNUAL`
- `VYBE_APP_URL`

Use sandbox keys and sandbox Price IDs during verification. Pioneer prices are intentionally
not configured in V24.8.

## Stripe webhook

After the branch is deployed, register:

`https://YOUR-VYBE-DOMAIN/api/stripe/webhook`

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Copy that endpoint's signing secret into `STRIPE_WEBHOOK_SECRET`.

## Required verification

1. Apply `20260725230000_stripe_membership_billing_v24_8.sql`.
2. Add the sandbox variables to Cloudflare.
3. Complete one sandbox monthly checkout.
4. Confirm Creator Settings changes only after a verified webhook.
5. Open the Customer Portal and schedule cancellation at period end.
6. Confirm the membership remains active through its paid period.
7. Confirm a deleted subscription returns the account to Creator Free without deleting content.
8. Repeat for an annual price and a failed payment test card.
