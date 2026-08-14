# V24.42B1B Focus Subscription Billing

Adds Stripe-ready, recurring creator-focus subscriptions without changing or replacing the creator's base membership subscription.

## Products represented

- Second Focus: $8 monthly / $80 annual; Plus, Pro, or Studio; capacity two.
- Pro Multi-Focus: $15 monthly / $150 annual; Pro only; capacity five.
- Studio Multi-Focus: $20 monthly / $200 annual; Studio only; capacity five.
- Multi-Focus replaces the Second Focus add-on rather than stacking with it.

## Safety controls

- Separate database subscription record from `account_entitlements`.
- Separate checkout route and Stripe metadata type.
- Webhook routes focus prices to focus fulfillment and never downgrades the base plan.
- Free cannot buy focus add-ons; Plus cannot buy Multi-Focus.
- One active focus add-on subscription per creator.
- Canceled focus access enters a 30-day restricted/grace period; content is not deleted.
- Founding Creator testing access remains directly managed by VYBE.
- Raw Stripe keys, secrets, and Price IDs are never stored in the database.

## Six-month testing enrollment

The founding enrollment window is represented through February 14, 2027. A subscription first activated during the window is marked as founding-price enrolled and locked while continuously maintained. Any future change to that promise requires explicit product and legal review.

## Required server configuration before activation

Keep `STRIPE_FOCUS_CHECKOUT_ENABLED=false` until all products and webhooks are verified.

- `STRIPE_PRICE_FOCUS_SECOND_MONTHLY`
- `STRIPE_PRICE_FOCUS_SECOND_ANNUAL`
- `STRIPE_PRICE_FOCUS_PRO_MULTI_MONTHLY`
- `STRIPE_PRICE_FOCUS_PRO_MULTI_ANNUAL`
- `STRIPE_PRICE_FOCUS_STUDIO_MULTI_MONTHLY`
- `STRIPE_PRICE_FOCUS_STUDIO_MULTI_ANNUAL`
- Existing `STRIPE_SECRET_KEY`
- Existing `STRIPE_WEBHOOK_SECRET`
- `STRIPE_FOCUS_CHECKOUT_ENABLED=true` only after test-mode verification

## Deferred to V24.42B1C

- Creator-facing focus selection and checkout cards.
- Focus selection after successful payment.
- Subscription change and cancellation presentation.
- Admin focus access interface.
