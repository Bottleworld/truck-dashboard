import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/loginThrottle";
import { OWNER_COOKIE_NAME, OWNER_SESSION_SECONDS, ownerPasswordMatches, createOwnerCookie } from "@/lib/siteOwner";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const fail = (reason: string, status: number) =>
    NextResponse.json({ error: reason }, { status, headers: { "Cache-Control": "no-store" } });

  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return fail("Invalid request", 403);
  if (!process.env.OWNER_ACCESS_PASSWORD) return fail("Owner login not configured", 503);

  let supplied: unknown;
  try { supplied = (await request.json()).password; }
  catch { return fail("Invalid request", 400); }
  if (typeof supplied !== "string" || supplied.length > 128) return fail("Invalid request", 400);

  const limit = await checkLoginRateLimit(request, "owner", 5);
  if (limit === "unavailable") return fail("Login temporarily unavailable", 503);
  if (limit === "limited") return fail("Too many attempts. Retry in 15 minutes.", 429);

  if (!ownerPasswordMatches(supplied)) return fail("Incorrect password", 401);
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(OWNER_COOKIE_NAME, createOwnerCookie(), {
    httpOnly: true, secure: true, sameSite: "strict", path: "/",
    maxAge: OWNER_SESSION_SECONDS,
  });
  return response;
}
