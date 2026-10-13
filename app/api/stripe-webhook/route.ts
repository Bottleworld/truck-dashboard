import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTHLY = "price_1UPc10PwTBxi2GE8i5Y1S8dK";
const YEARLY = "price_1UPc12PwTBxi2GE89Y3TVMux";
const KNOWN_PRICES = new Set([MONTHLY, YEARLY]);

type AccessUpdate = {
  subscriptionId: string;
  customerId: string;
  status: "active" | "inactive";
  periodEnd: string | null;
  plan: "month" | "year" | null;
};

function objectId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function subscriptionSnapshot(sub: Stripe.Subscription): AccessUpdate | null {
  const item = sub.items?.data.find(line => KNOWN_PRICES.has(line.price.id));
  if (!item) return null;
  const end = typeof item.current_period_end === "number" ? item.current_period_end : 0;
  const active = sub.status === "active" && end * 1000 > Date.now();
  const customer = objectId(sub.customer);
  if (!customer) return null;
  return {
    subscriptionId: sub.id,
    customerId: customer,
    status: active ? "active" : "inactive",
    periodEnd: end ? new Date(end * 1000).toISOString() : null,
    plan: item.price.id === MONTHLY ? "month" : "year",
  };
}

function paidInvoiceSnapshot(invoice: Stripe.Invoice): AccessUpdate | null {
  if (invoice.status !== "paid") return null;
  const subId = objectId(invoice.parent?.subscription_details?.subscription);
  const customer = objectId(invoice.customer);
  if (!subId || !customer) return null;

  // The Stripe 2026 API exposes invoice line price IDs under pricing.price_details.
  // Older line versions may also include a price object.
  type InvoiceLine = {
    price?: { id?: string } | string | null;
    pricing?: { price_details?: { price?: string | { id?: string } } };
    period?: { end?: number };
  };
  const lines = (invoice.lines?.data ?? []) as InvoiceLine[];
  const line = lines.find(item => {
    const priceId = objectId(item.pricing?.price_details?.price) || objectId(item.price);
    return Boolean(priceId && KNOWN_PRICES.has(priceId));
  });
  if (!line || !line.period?.end || line.period.end * 1000 <= Date.now()) return null;
  const priceId = objectId(line.pricing?.price_details?.price) || objectId(line.price);
  return {
    subscriptionId: subId,
    customerId: customer,
    status: "active",
    periodEnd: new Date(line.period.end * 1000).toISOString(),
    plan: priceId === MONTHLY ? "month" : "year",
  };
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  if (!signingSecret || !dbUrl || !dbKey) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const db = createClient(dbUrl, dbKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let event: Stripe.Event;
  try {
    // Used exclusively to verify Stripe's HMAC signature; no Stripe API requests are made.
    const verifier = new Stripe("sk_test_signature_verification_only");
    event = verifier.webhooks.constructEvent(await request.text(), signature, signingSecret);
  } catch {
    await db.from("subscription_sync_health").update({ webhook_last_error: "signature_invalid" }).eq("id", 1);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await db.from("subscription_sync_health").update({
    webhook_last_received_at: new Date().toISOString(),
    webhook_last_event_type: event.type,
    webhook_last_error: null,
  }).eq("id", 1);

  if (!event.livemode) return NextResponse.json({ received: true });

  let update: AccessUpdate | null = null;
  if (event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted") {
    update = subscriptionSnapshot(event.data.object as Stripe.Subscription);
  } else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    update = paidInvoiceSnapshot(event.data.object as Stripe.Invoice);
  }

  if (!update) return NextResponse.json({ received: true });

  try {
    const { error } = await db.rpc("apply_bottleworld_verified_stripe_event", {
      p_created: event.created,
      p_event_type: event.type,
      p_subscription_id: update.subscriptionId,
      p_customer_id: update.customerId,
      p_status: update.status,
      p_period_end: update.periodEnd,
      p_plan_type: update.plan,
    });
    if (error) throw error;
    await db.from("subscription_sync_health").update({
      last_success_at: new Date().toISOString(),
      error_category: null,
      webhook_last_error: null,
    }).eq("id", 1);
    return NextResponse.json({ received: true });
  } catch {
    await db.from("subscription_sync_health").update({ webhook_last_error: "signed_event_sync_failed" }).eq("id", 1);
    return NextResponse.json({ error: "Subscription synchronization failed" }, { status: 500 });
  }
}
