import { NextRequest, NextResponse } from "next/server";
import { MANAGER_COOKIE, verifyManagerSession } from "@/lib/managerAuth";
import { isSubscriptionActive } from "@/lib/subscriptionAccess";

/** Both the paid installation license and a signed manager session are required. */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Keep these routes reachable before payment, and for Stripe notifications.
  if (
    path === "/billing" ||
    path === "/api/stripe-webhook" ||
    path === "/api/subscription-status" ||
    path === "/api/manager-login" ||
    path === "/api/manager-session" ||
    path === "/api/manager-logout"
  ) {
    return NextResponse.next();
  }

  if (!(await isSubscriptionActive())) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402, headers: { "Cache-Control": "no-store" } });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/billing";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // The landing page displays the manager-login form when payment is current.
  if (path === "/") return NextResponse.next();

  const manager = verifyManagerSession(request.cookies.get(MANAGER_COOKIE)?.value);
  if (!manager) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Manager login required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "?session=expired";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
