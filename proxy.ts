import { NextRequest, NextResponse } from "next/server";
import { MANAGER_COOKIE, verifyManagerSession } from "@/lib/managerAuth";
import { isSubscriptionActive } from "@/lib/subscriptionAccess";
import { OWNER_COOKIE_NAME, isOwnerCookieValid } from "@/lib/siteOwner";

/**
 * A subscription is required for all protected pages and APIs.
 * An unpaid visitor sees a blocking payment dialog on the homepage.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path === "/" ||
    path === "/billing" ||
    path === "/api/stripe-webhook" ||
    path === "/api/stripe-sandbox-webhook" ||
    path === "/api/subscription-status" ||
    path === "/api/manager-login" ||
    path === "/api/manager-session" ||
    path === "/api/site-owner" ||
    path === "/api/manager-logout"
  ) return NextResponse.next();

  const owner = isOwnerCookieValid(request.cookies.get(OWNER_COOKIE_NAME)?.value);
  if (!owner && !(await isSubscriptionActive())) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 402, headers: { "Cache-Control": "no-store" } }
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  const manager = verifyManagerSession(request.cookies.get(MANAGER_COOKIE)?.value);
  if (!owner && !manager) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Manager login required" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "?session=expired";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
