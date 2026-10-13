import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Only Bottle World's current recurring plans may unlock this dashboard.
const BOTTLE_WORLD_PRICES = new Set([
  "price_1UPc10PwTBxi2GE8i5Y1S8dK", // $89.99/month
  "price_1UPc12PwTBxi2GE89Y3TVMux", // $899/year
]);

type AccessState = { status: "active" | "inactive"; subscriptionId: string; customerId: string; periodEnd: string | null; plan: string | null };

function service() {
  const key = process.env.STRIPE_SECRET_KEY;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !dbUrl || !dbKey || !process.env.STRIPE_WEBHOOK_SECRET) throw new Error("Stripe integration not configured");
  return { stripe: new Stripe(key), db: createClient(dbUrl, dbKey, { auth: { persistSession: false } }) };
}

function currentState(sub: Stripe.Subscription): AccessState {
  const end = sub.items.data.map(item => item.current_period_end).filter((time): time is number => typeof time === "number").sort((a,b) => b-a)[0];
  const valid = sub.status === "active" && Boolean(end) && end * 1000 > Date.now();
  return {
    status: valid ? "active" : "inactive",
    subscriptionId: sub.id,
    customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    periodEnd: end ? new Date(end * 1000).toISOString() : null,
    plan: sub.items.data[0]?.price.recurring?.interval ?? null,
  };
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  let services: ReturnType<typeof service>;
  try { services = service(); } catch {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      try {
        const db = createClient(url, key);
        await db.from("subscription_sync_health").update({ webhook_last_error: "webhook_config_missing" }).eq("id", 1);
      } catch { /* Do not expose private settings. */ }
    }
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const { stripe, db } = services;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    await db.from("subscription_sync_health").update({ webhook_last_error: "signature_invalid" }).eq("id", 1);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await db.from("subscription_sync_health").update({
    webhook_last_received_at: new Date().toISOString(),
    webhook_last_event_type: event.type,
    webhook_last_error: null,
  }).eq("id", 1);

  try {
    let subscriptionId: string | null = null;
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.payment_status === "paid") {
        subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;
      }
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      subscriptionId = (event.data.object as Stripe.Subscription).id;
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      // Modern Stripe invoices store their subscription association in parent.
      const parent = invoice.parent?.subscription_details?.subscription;
      subscriptionId = typeof parent === "string" ? parent : parent?.id ?? null;
    }

    if (!subscriptionId) return NextResponse.json({ received: true });
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    if (!sub.items.data.some((item) => BOTTLE_WORLD_PRICES.has(item.price.id))) {
      return NextResponse.json({ received: true });
    }
    const state = currentState(sub);

    // Shared single-installation license: avoid unrelated subscriptions overriding current access.
    const { data: existing, error: readError } = await db.from("app_access").select("stripe_subscription_id").eq("id", 1).single();
    if (readError) throw readError;
    if (existing.stripe_subscription_id && existing.stripe_subscription_id !== subscriptionId) {
      // A new fully paid subscription may replace the old one; never let an unrelated cancellation revoke access.
      if (state.status !== "active") return NextResponse.json({ received: true });
    }
    const { error } = await db.from("app_access").update({
      status: state.status,
      stripe_subscription_id: state.subscriptionId,
      stripe_customer_id: state.customerId,
      current_period_end: state.periodEnd,
      plan_type: state.plan,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) throw error;

    return NextResponse.json({ received: true });
  } catch {
    await db.from("subscription_sync_health").update({ webhook_last_error: "subscription_sync_failed" }).eq("id", 1);
    return NextResponse.json({ error: "Unable to synchronize subscription" }, { status: 500 });
  }
}
