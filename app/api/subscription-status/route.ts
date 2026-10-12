import { NextResponse } from "next/server";
import { getSubscriptionAccess } from "@/lib/subscriptionAccess";

export const dynamic = "force-dynamic";

export async function GET() {
  const access = await getSubscriptionAccess();

  if (!access.available) {
    return NextResponse.json(
      { error: "Subscription verification unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({
    active: access.active,
    daysRemaining: access.daysRemaining,
    currentPeriodEnd: access.currentPeriodEnd,
  }, { headers: { "Cache-Control": "no-store" } });
}
