import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

type AccessStatus = "active" | "inactive";

async function updateAccess({
  status,
  subscriptionId,
  customerId,
  currentPeriodEnd,
  planType,
}: {
  status: AccessStatus;
  subscriptionId?: string | null;
  customerId?: string | null;
  currentPeriodEnd?: number | null;
  planType?: string | null;
}) {
  const { error } = await supabaseAdmin
    .from("app_access")
    .update({
      status,
      stripe_subscription_id: subscriptionId || null,
      stripe_customer_id: customerId || null,
      current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      plan_type: planType || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }
}

function getCurrentPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null;
}

function getPlanType(subscription: Stripe.Subscription): string | null {
  return subscription.items.data[0]?.price?.recurring?.interval ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown webhook error";

    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        await updateAccess({
          status: "active",
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
          planType: getPlanType(subscription),
        });
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceData = invoice as any;

      if (invoiceData.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          invoiceData.subscription as string
        );

        await updateAccess({
          status: "active",
          subscriptionId: subscription.id,
          customerId: subscription.customer as string,
          currentPeriodEnd: getCurrentPeriodEnd(subscription),
          planType: getPlanType(subscription),
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceData = invoice as any;

      await updateAccess({
        status: "inactive",
        subscriptionId: invoiceData.subscription || null,
        customerId: invoiceData.customer || null,
        currentPeriodEnd: null,
        planType: null,
      });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      await updateAccess({
        status: "inactive",
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        currentPeriodEnd: null,
        planType: null,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}