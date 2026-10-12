import { NextRequest } from "next/server";
import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";
import { NextResponse } from "next/server";
import { getSubscriptionAccess } from "@/lib/subscriptionAccess";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ownerAuthorized = isOwnerCookieValid(request.cookies.get(OWNER_COOKIE_NAME)?.value);
  const access = await getSubscriptionAccess();

  if (!access.available && !ownerAuthorized) {
    return NextResponse.json(
      { error: "Subscription verification unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json({
    active: access.active,
    ownerAuthorized,
    daysRemaining: access.daysRemaining,
    currentPeriodEnd: access.currentPeriodEnd,
  }, { headers: { "Cache-Control": "no-store" } });
}
