import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/loginThrottle";
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

  if (!validateStaffPin(pin)) {
    const check = await checkLoginRateLimit(request, "staff", 5);
    if (check === "unavailable") return NextResponse.json({ error: "PIN verification temporarily unavailable" }, { status: 503 });
    if (check === "limited") return NextResponse.json({ error: "Too many attempts. Wait 15 minutes." }, { status: 429 });
    return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });
  }
  return NextResponse.json({ verified: true }, { headers: { "Cache-Control": "no-store" } });
}
