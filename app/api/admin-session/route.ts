import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createAdminCookie, verifyAdminCookie, verifyAdminPassword } from "@/lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authenticated = verifyAdminCookie(request.cookies.get(ADMIN_COOKIE)?.value);
  return NextResponse.json({ authenticated }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 1024)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  let password: unknown;
  try { password = (await request.json()).password; }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (typeof password !== "string" || !verifyAdminPassword(password))
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  try {
    const response = NextResponse.json({ authenticated: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_COOKIE, createAdminCookie(), {
      httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: ADMIN_SESSION_SECONDS,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Login unavailable" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
