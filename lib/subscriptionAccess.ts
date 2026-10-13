import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export type SubscriptionAccess = {
  active: boolean;
  hadSubscription: boolean;
  available: boolean;
  daysRemaining: number | null;
  currentPeriodEnd: string | null;
};

type AccessRow = {
  status: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  current_period_end: string | null;
  plan_type: string | null;
  updated_at: string | null;
};

const LIVE_PRICES = new Set([
  "price_1UPc10PwTBxi2GE8i5Y1S8dK",
  "price_1UPc12PwTBxi2GE89Y3TVMux",
]);
const REFRESH_AFTER_MS = 5 * 60 * 1000;

function validPaidSubscription(sub: Stripe.Subscription): boolean {
  return sub.status === "active" && sub.items.data.some(item =>
    LIVE_PRICES.has(item.price.id) &&
    typeof item.current_period_end === "number" &&
    item.current_period_end * 1000 > Date.now()
  );
}

/**
 * Self-heal lost Stripe webhooks. Stripe is authoritative; this is an
 * independent backup for payments, renewals and cancellations.
 * Only production reads LIVE Stripe; Sandbox never mixes with LIVE.
 *
 * If Stripe is unreachable, preserve the last confirmed state only
 * until its already-recorded paid-through date. Do not grant new access.
 */
async function reconcileLiveSubscription(db: SupabaseClient, row: AccessRow): Promise<AccessRow> {
  if (process.env.VERCEL_ENV !== "production") return row;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return row;

  const previousCheck = Date.parse(row.updated_at ?? "");
  if (Number.isFinite(previousCheck) && Date.now() - previousCheck < REFRESH_AFTER_MS) return row;

  try {
    const stripe = new Stripe(stripeKey);
    let current: Stripe.Subscription | null = null;

    if (row.stripe_subscription_id) {
      const known = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      if (validPaidSubscription(known)) current = known;
    }

    // Recover first checkout even when the webhook never reached Vercel.
    // Also recover a replacement paid subscription after the old one ends.
    if (!current) {
      const result = await stripe.subscriptions.list({ status: "active", limit: 100 });
      current = result.data.find(validPaidSubscription) ?? null;
    }

    const currentItem = current?.items.data.find(item =>
      LIVE_PRICES.has(item.price.id) && typeof item.current_period_end === "number"
    );
    const periodEnd = currentItem?.current_period_end
      ? new Date(currentItem.current_period_end * 1000).toISOString() : null;

    const next: AccessRow = {
      status: current ? "active" : "inactive",
      stripe_subscription_id: current?.id ?? row.stripe_subscription_id,
      stripe_customer_id: current
        ? (typeof current.customer === "string" ? current.customer : current.customer.id)
        : row.stripe_customer_id,
      current_period_end: periodEnd,
      plan_type: currentItem?.price.recurring?.interval ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await db.from("app_access").update(next).eq("id", 1);
    if (error) return row;
    return next;
  } catch {
    return row;
  }
}

/** Subscription status comes from server-side database and Stripe, never browser cookies. */
export async function getSubscriptionAccess(): Promise<SubscriptionAccess> {
  const unavailable: SubscriptionAccess = {
    active: false, hadSubscription: false, available: false,
    daysRemaining: null, currentPeriodEnd: null,
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return unavailable;

  const sandbox = process.env.VERCEL_ENV !== "production" && process.env.STRIPE_SANDBOX_MODE === "true";

  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await db
      .from(sandbox ? "app_access_sandbox" : "app_access")
      .select("status,stripe_subscription_id,stripe_customer_id,current_period_end,plan_type,updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return unavailable;
    const record: AccessRow = sandbox ? data : await reconcileLiveSubscription(db, data);
    const expiration = Date.parse(record.current_period_end ?? "");
    const hadSubscription = Boolean(record.stripe_subscription_id);
    const active = record.status === "active" && hadSubscription &&
      Number.isFinite(expiration) && expiration > Date.now();

    return {
      active,
      hadSubscription,
      available: true,
      daysRemaining: active ? Math.ceil((expiration - Date.now()) / 86_400_000) : null,
      currentPeriodEnd: active ? new Date(expiration).toISOString() : null,
    };
  } catch {
    return unavailable;
  }
}

export async function isSubscriptionActive(): Promise<boolean> {
  return (await getSubscriptionAccess()).active;
}
