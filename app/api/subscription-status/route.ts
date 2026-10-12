import { NextResponse } from "next/server";
import { isSubscriptionActive } from "@/lib/subscriptionAccess";

export const dynamic = "force-dynamic";

export async function GET() {
  const active = await isSubscriptionActive();
  return NextResponse.json({ active }, { headers: { "Cache-Control": "no-store" } });
}
