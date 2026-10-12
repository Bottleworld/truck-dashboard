import { NextRequest, NextResponse } from "next/server";
import { MANAGER_COOKIE, verifyManagerSession } from "@/lib/managerAuth";
import { getSubscriptionAccess } from "@/lib/subscriptionAccess";

/** Company-wide subscription + server-signed manager identity. */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Stripe notifications and customer checkout must be accessible without a session.
  if (
    path === "/billing" ||
    path === "/api/stripe-webhook" ||
    path === "/api/stripe-sandbox-webhook" ||
    path === "/api/subscription-status" ||
    path === "/api/manager-login" ||
    path === "/api/manager-session" ||
    path === "/api/manager-logout"
  ) return NextResponse.next();

  const access = await getSubscriptionAccess();
  // Prelaunch/demo use is available to existing managers WITHOUT the owner paying.
  // It is one-way: once any real subscription has existed, cancellation cannot
  // reactivate free access. Missing database data always denies access.
  const prelaunch = process.env.VERCEL_ENV === "production" &&
    process.env.SUBSCRIPTION_PRELAUNCH_MODE === "true" &&
    access.available && !access.hadSubscription;

  if (!access.active && !prelaunch) {
    if (path.startsWith("/api/")) return NextResponse.json(
      { error: "Subscription required" },
      { status: 402, headers: { "Cache-Control": "no-store" } }
    );
    const url = request.nextUrl.clone();
    url.pathname = "/billing";
    url.search = "";
    const response = NextResponse.redirect(url);
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (path === "/") return NextResponse.next();

  const manager = verifyManagerSession(request.cookies.get(MANAGER_COOKIE)?.value);
  if (!manager) {
    if (path.startsWith("/api/")) return NextResponse.json(
      { error: "Manager login required" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
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
