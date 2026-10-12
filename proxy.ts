import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Shared installation subscription gate.
 * This is intentionally server-side: neither browser storage nor bw_gate cookies
 * are accepted as proof of payment.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // These routes must remain accessible to subscribe and receive signed updates.
  if (pathname === "/billing" || pathname.startsWith("/api/stripe-webhook")) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return denied(request, "Subscription verification unavailable");
  }

  try {
    const db = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await db
      .from("app_access")
      .select("status,current_period_end,stripe_subscription_id")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return denied(request, "Subscription verification unavailable");

    const expiresAt = Date.parse(data.current_period_end ?? "");
    const active =
      data.status === "active" &&
      Boolean(data.stripe_subscription_id) &&
      Number.isFinite(expiresAt) &&
      expiresAt > Date.now();

    if (!active) return denied(request, "Subscription required");
    return NextResponse.next();
  } catch {
    return denied(request, "Subscription verification unavailable");
  }
}

function denied(request: NextRequest, message: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: message }, { status: 402 });
  }
  const target = request.nextUrl.clone();
  target.pathname = "/billing";
  target.search = "";
  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
