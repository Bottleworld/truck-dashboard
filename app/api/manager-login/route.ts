import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/loginThrottle";
import { MANAGER_COOKIE, MANAGER_SESSION_SECONDS, createManagerSession, validPassword } from "@/lib/managerAuth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 2048) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const limit = await checkLoginRateLimit(request, "manager", 8);
  if (limit === "unavailable") return NextResponse.json({ error: "Login temporarily unavailable" }, { status: 503 });
  if (limit === "limited") return NextResponse.json({ error: "Too many attempts. Retry in 15 minutes." }, { status: 429 });

  let body: { manager?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid input" }, { status: 400 }); }
  if (typeof body.manager !== "string" || typeof body.password !== "string" ||
      !validPassword(body.manager, body.password)) {
    return NextResponse.json({ error: "Wrong manager or password" }, { status: 401 });
  }

  try {
    const session = createManagerSession(body.manager);
    const response = NextResponse.json({ manager: body.manager }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(MANAGER_COOKIE, session, {
      httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: MANAGER_SESSION_SECONDS,
    });
    return response;
  } catch { return NextResponse.json({ error: "Login unavailable" }, { status: 503 }); }
}
