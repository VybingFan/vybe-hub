import Stripe from "stripe";
import type { Database } from "@/integrations/supabase/types";

export type PaidCreatorPlanCode = "creator_plus" | "creator_pro" | "creator_studio";
export type BillingInterval = "monthly" | "annual";
export type FocusAddOnCode = "second_focus" | "pro_multi_focus" | "studio_multi_focus";
export type SocialDiscoveryAddOnCode = "social_discovery";

export type StripePriceSelection = {
  planCode: PaidCreatorPlanCode;
  interval: BillingInterval;
  priceId: string;
};

export type StripeFocusPriceSelection = {
  addOnCode: FocusAddOnCode;
  interval: BillingInterval;
  priceId: string;
};

export type StripeSocialDiscoveryPriceSelection = {
  addOnCode: SocialDiscoveryAddOnCode;
  interval: BillingInterval;
  priceId: string;
};

type EntitlementUpdate = Omit<
  Database["public"]["Tables"]["account_entitlements"]["Insert"],
  "user_id"
>;

let stripeClient: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "Stripe webhooks are not configured. Add STRIPE_WEBHOOK_SECRET to the server environment.",
    );
  }
  return secret;
}

function configuredPrices(): StripePriceSelection[] {
  const entries: Array<[PaidCreatorPlanCode, BillingInterval, string | undefined]> = [
    ["creator_plus", "monthly", process.env.STRIPE_PRICE_CREATOR_PLUS_MONTHLY],
    ["creator_plus", "annual", process.env.STRIPE_PRICE_CREATOR_PLUS_ANNUAL],
    ["creator_pro", "monthly", process.env.STRIPE_PRICE_CREATOR_PRO_MONTHLY],
    ["creator_pro", "annual", process.env.STRIPE_PRICE_CREATOR_PRO_ANNUAL],
    ["creator_studio", "monthly", process.env.STRIPE_PRICE_CREATOR_STUDIO_MONTHLY],
    ["creator_studio", "annual", process.env.STRIPE_PRICE_CREATOR_STUDIO_ANNUAL],
  ];

  return entries.flatMap(([planCode, interval, priceId]) =>
    priceId ? [{ planCode, interval, priceId }] : [],
  );
}

function configuredFocusPrices(): StripeFocusPriceSelection[] {
  const entries: Array<[FocusAddOnCode, BillingInterval, string | undefined]> = [
    ["second_focus", "monthly", process.env.STRIPE_PRICE_FOCUS_SECOND_MONTHLY],
    ["second_focus", "annual", process.env.STRIPE_PRICE_FOCUS_SECOND_ANNUAL],
    ["pro_multi_focus", "monthly", process.env.STRIPE_PRICE_FOCUS_PRO_MULTI_MONTHLY],
    ["pro_multi_focus", "annual", process.env.STRIPE_PRICE_FOCUS_PRO_MULTI_ANNUAL],
    ["studio_multi_focus", "monthly", process.env.STRIPE_PRICE_FOCUS_STUDIO_MULTI_MONTHLY],
    ["studio_multi_focus", "annual", process.env.STRIPE_PRICE_FOCUS_STUDIO_MULTI_ANNUAL],
  ];
  return entries.flatMap(([addOnCode, interval, priceId]) =>
    priceId ? [{ addOnCode, interval, priceId }] : [],
  );
}

function configuredSocialDiscoveryPrices(): StripeSocialDiscoveryPriceSelection[] {
  const entries: Array<[SocialDiscoveryAddOnCode, BillingInterval, string | undefined]> = [
    ["social_discovery", "monthly", process.env.STRIPE_PRICE_SOCIAL_DISCOVERY_MONTHLY],
    ["social_discovery", "annual", process.env.STRIPE_PRICE_SOCIAL_DISCOVERY_ANNUAL],
  ];
  return entries.flatMap(([addOnCode, interval, priceId]) =>
    priceId ? [{ addOnCode, interval, priceId }] : [],
  );
}

export function priceFor(planCode: string, interval: string): StripePriceSelection {
  const match = configuredPrices().find(
    (price) => price.planCode === planCode && price.interval === interval,
  );
  if (!match) {
    throw new Error(`Stripe price is not configured for ${planCode} ${interval}.`);
  }
  return match;
}

export function selectionForPrice(priceId: string): StripePriceSelection | null {
  return configuredPrices().find((price) => price.priceId === priceId) ?? null;
}

export function focusPriceFor(addOnCode: string, interval: string): StripeFocusPriceSelection {
  const match = configuredFocusPrices().find(
    (price) => price.addOnCode === addOnCode && price.interval === interval,
  );
  if (!match) throw new Error(`Stripe focus price is not configured for ${addOnCode} ${interval}.`);
  return match;
}

export function focusSelectionForPrice(priceId: string): StripeFocusPriceSelection | null {
  return configuredFocusPrices().find((price) => price.priceId === priceId) ?? null;
}

export function socialDiscoveryPriceFor(interval: string): StripeSocialDiscoveryPriceSelection {
  const match = configuredSocialDiscoveryPrices().find((price) => price.interval === interval);
  if (!match) throw new Error(`Stripe Social Discovery price is not configured for ${interval}.`);
  return match;
}

export function socialDiscoverySelectionForPrice(priceId: string): StripeSocialDiscoveryPriceSelection | null {
  return configuredSocialDiscoveryPrices().find((price) => price.priceId === priceId) ?? null;
}

export function appUrlFor(request: Request) {
  const configured = process.env.VYBE_APP_URL?.trim().replace(/\/+$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}

export function stripeId(value: string | { id: string } | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function periodEnd(subscription: Stripe.Subscription) {
  const timestamps = subscription.items.data
    .map((item) => item.current_period_end)
    .filter((value): value is number => typeof value === "number");
  if (!timestamps.length) return null;
  return new Date(Math.max(...timestamps) * 1000).toISOString();
}

export function activeSubscriptionUpdate(
  subscription: Stripe.Subscription,
  selection: StripePriceSelection,
  eventCreated: number,
): EntitlementUpdate {
  return {
    plan_code: selection.planCode,
    status: "active",
    billing_interval: selection.interval,
    billing_provider: "stripe",
    billing_customer_ref: stripeId(subscription.customer),
    billing_subscription_ref: subscription.id,
    stripe_subscription_status: subscription.status,
    current_period_end: periodEnd(subscription),
    cancel_at_period_end: subscription.cancel_at_period_end,
    scheduled_plan_code: subscription.cancel_at_period_end ? "creator_free" : null,
    adjustment_ends_at: null,
    last_billing_event_created: eventCreated,
    expires_at: periodEnd(subscription),
  };
}
