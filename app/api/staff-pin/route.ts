import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateStaffPin } from "@/lib/staffPin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let pin: unknown;
  try { pin = (await request.json()).pin; }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin))
    return NextResponse.json({ error: "Enter a 4-digit PIN" }, { status: 400 });

  // Limit guessing to five PIN attempts per IP per 15-minute window.
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const attemptKey = "staff:" + createHash("sha256").update(ip).digest("hex");
  try {
    const { data: previous, error: previousError } = await supabaseAdmin
      .from("owner_access_attempts").select("attempts,window_started").eq("attempt_key", attemptKey).maybeSingle();
    if (previousError) throw previousError;
    const reset = !previous || Date.now() - Date.parse(previous.window_started) > 15 * 60 * 1000;
    if (!reset && previous.attempts >= 5)
      return NextResponse.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });

    const { error } = await supabaseAdmin.from("owner_access_attempts").upsert({
      attempt_key: attemptKey, attempts: reset ? 1 : previous.attempts + 1,
      window_started: reset ? new Date().toISOString() : previous.window_started,
    });
    if (error) throw error;
  } catch {
    return NextResponse.json({ error: "PIN verification unavailable" }, { status: 503 });
  }

  if (!validateStaffPin(pin)) return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
}
