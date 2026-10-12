import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return fail("Login unavailable", 503);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].slice(0, 128);
  const attemptKey = "owner:" + createHash("sha256").update(ip).digest("hex");
  try {
    const { data: previous, error: readError } = await db.from("owner_access_attempts")
      .select("attempts,window_started").eq("attempt_key", attemptKey).maybeSingle();
    if (readError) throw readError;
    const reset = !previous || Date.now() - Date.parse(previous.window_started) > 15 * 60 * 1000;
    if (!reset && previous.attempts >= 5) return fail("Too many attempts. Retry in 15 minutes.", 429);
    const { error } = await db.from("owner_access_attempts").upsert({
      attempt_key: attemptKey,
      window_started: reset ? new Date().toISOString() : previous.window_started,
      attempts: reset ? 1 : previous.attempts + 1,
    });
    if (error) throw error;
  } catch { return fail("Login temporarily unavailable", 503); }

  if (!ownerPasswordMatches(supplied)) return fail("Incorrect password", 401);
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(OWNER_COOKIE_NAME, createOwnerCookie(), {
    httpOnly: true, secure: true, sameSite: "strict", path: "/",
    maxAge: OWNER_SESSION_SECONDS,
  });
  return response;
}
