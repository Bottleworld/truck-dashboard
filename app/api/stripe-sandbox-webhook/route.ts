import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SANDBOX_PRICES = new Set([
  "price_1UPcjdLSNQt7bGnKb95HQsj2", // monthly sandbox
  "price_1UPcjfLSNQt7bGnKbiuSycJy", // yearly sandbox
]);

/**
 * Isolated sandbox receiver. Only signed Stripe test events can update
 * the test-only access row. It NEVER writes production app_access.
 *
 * No Stripe secret API key is needed for verifying webhook signatures or
 * using the event's included subscription snapshot.
 */
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production" || process.env.STRIPE_SANDBOX_MODE !== "true") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const secret = process.env.STRIPE_SANDBOX_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    const stripe = new Stripe("sk_test_webhook_signature_only");
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.livemode !== false) {
    return NextResponse.json({ error: "Not a test event" }, { status: 400 });
  }

  if (
    event.type !== "customer.subscription.created" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return NextResponse.json({ received: true });
  }

  const subscription = event.data.object as Stripe.Subscription;
  if (subscription.metadata?.system !== "truck-dashboard" ||
      !subscription.items.data.some(item => SANDBOX_PRICES.has(item.price.id))) {
    return NextResponse.json({ received: true });
  }

  const periodEndSeconds = subscription.items.data
    .map(item => item.current_period_end)
    .filter((end): end is number => typeof end === "number")
    .reduce((a,b) => Math.max(a,b), 0);

  const active = subscription.status === "active" &&
    periodEndSeconds > Math.floor(Date.now() / 1000);
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
  const plan = subscription.items.data[0]?.price.recurring?.interval ?? null;

  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dbUrl || !serviceKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const db = createClient(dbUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: current, error: readError } = await db
      .from("app_access_sandbox")
      .select("stripe_subscription_id")
      .eq("id", 1)
      .single();
    if (readError) throw readError;

    // A canceled or failed secondary subscription never revokes another active license.
    if (!active && current.stripe_subscription_id &&
        current.stripe_subscription_id !== subscription.id) {
      return NextResponse.json({ received: true });
    }

    const { error } = await db.from("app_access_sandbox").update({
      status: active ? "active" : "inactive",
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
      plan_type: plan,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Could not sync test subscription" }, { status: 500 });
  }
}
